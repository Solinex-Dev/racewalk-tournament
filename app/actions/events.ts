"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";
import { requirePermission } from "@/lib/authz";
import { parseBibAgeGroup } from "@/lib/bib";

export type EventAthleteInput = { athleteId: string; bib: string };

/**
 * Every registered athlete must have a valid age-encoded BIB ([age band][3-digit
 * sequence], e.g. 65001). Reject otherwise — a malformed/short BIB must not be
 * saved. Server-side enforcement (the form blocks it too, this is defense).
 */
function assertValidBibs(athletes: EventAthleteInput[]) {
  const bad = athletes.filter((a) => !parseBibAgeGroup(a.bib));
  if (bad.length > 0) {
    throw new Error(
      `หมายเลข BIB ต้องเป็นรูปแบบ [รุ่นอายุ][ลำดับ 3 หลัก] เช่น 65001 — มี ${bad.length} รายการที่ยังไม่ได้กรอกหรือไม่ถูกต้อง`,
    );
  }
}

export type EventActionData = {
  name: string;
  /** datetime-local string, e.g. "2026-07-12T08:00". Required — also drives `date`. */
  startTime: string;
  /** datetime-local string; optional. */
  endTime?: string;
  location: string;
  distanceKm: string;
  lapCount: number;
  status: "DRAFT" | "SCHEDULED" | "ONGOING" | "FINISHED";
  athletes: EventAthleteInput[];
};

/**
 * Derive the event's calendar day (date-only, midnight UTC) from the start-time
 * input. Keeps `Event.date` identical in shape to the old date-only field so all
 * day-based scheduling/display logic keeps working unchanged.
 */
function resolveEventDate(startTime: string): Date {
  // startTime is "yyyy-mm-ddThh:mm"; the first 10 chars are the calendar day.
  return new Date(startTime.slice(0, 10));
}

/**
 * Converts a Prisma unique-constraint failure (P2002) into a friendly Thai
 * message. EventAthlete has @@unique([eventId, bib]) so a duplicate BIB
 * within the same event surfaces here.
 */
function rethrowFriendly(err: unknown): never {
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "P2002"
  ) {
    throw new Error(
      "บันทึกไม่สำเร็จ — มีหมายเลข Bib ซ้ำกันในกิจกรรมนี้ กรุณาตรวจสอบรายการที่ขึ้นเตือนสีแดงแล้วบันทึกอีกครั้ง",
    );
  }
  throw err;
}

export async function createEvent(data: EventActionData) {
  const me = await requirePermission("events", "create");
  assertValidBibs(data.athletes);
  let eventId = "";
  await prisma
    .$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          name: data.name,
          date: resolveEventDate(data.startTime),
          startTime: new Date(data.startTime),
          endTime: data.endTime ? new Date(data.endTime) : null,
          location: data.location,
          distanceKm: data.distanceKm,
          lapCount: Math.max(1, Math.floor(data.lapCount || 1)),
          status: data.status,
          createdById: me.id,
          updatedById: me.id,
        },
      });
      eventId = event.id;

      if (data.athletes.length > 0) {
        await tx.eventAthlete.createMany({
          data: data.athletes.map((a, i) => ({
            eventId: event.id,
            athleteId: a.athleteId,
            bib: a.bib,
            sortOrder: i,
            createdById: me.id,
            updatedById: me.id,
          })),
        });
      }
    })
    .catch(rethrowFriendly);

  await logCurrentAdmin(ActivityLogAction.EVENT_CREATED, "Event", eventId, {
    name: data.name,
    status: data.status,
    athletes: data.athletes.length,
  });
  revalidatePath("/admin/events");
  return { ok: true, id: eventId };
}

export async function updateEvent(id: string, data: EventActionData) {
  const me = await requirePermission("events", "edit");
  assertValidBibs(data.athletes);
  const now = new Date();

  await prisma
    .$transaction(async (tx) => {
      await tx.event.update({
        where: { id },
        data: {
          name: data.name,
          date: resolveEventDate(data.startTime),
          startTime: new Date(data.startTime),
          endTime: data.endTime ? new Date(data.endTime) : null,
          location: data.location,
          distanceKm: data.distanceKm,
          lapCount: Math.max(1, Math.floor(data.lapCount || 1)),
          status: data.status,
          updatedById: me.id,
        },
      });

      // Soft-delete all current registrations, then upsert each submitted athlete.
      // This handles removals (deletedAt set) and BIB changes (bib updated) atomically.
      await tx.eventAthlete.updateMany({
        where: { eventId: id, deletedAt: null },
        data: { deletedAt: now },
      });
      // The array order IS the display order — persist each athlete's index as sortOrder.
      for (let i = 0; i < data.athletes.length; i++) {
        const a = data.athletes[i];
        await tx.eventAthlete.upsert({
          where: { eventId_athleteId: { eventId: id, athleteId: a.athleteId } },
          create: {
            eventId: id,
            athleteId: a.athleteId,
            bib: a.bib,
            sortOrder: i,
            createdById: me.id,
            updatedById: me.id,
          },
          update: { bib: a.bib, sortOrder: i, deletedAt: null, updatedById: me.id },
        });
      }
    })
    .catch(rethrowFriendly);

  await logCurrentAdmin(ActivityLogAction.EVENT_UPDATED, "Event", id, {
    name: data.name,
    status: data.status,
    athletes: data.athletes.length,
  });
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
  return { ok: true };
}
