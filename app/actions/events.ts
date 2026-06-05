"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";
import { requirePermission } from "@/lib/authz";

export type EventAthleteInput = { athleteId: string; bib: string };

export type EventActionData = {
  name: string;
  date: string;
  location: string;
  distanceKm: string;
  lapCount: number;
  status: "DRAFT" | "SCHEDULED" | "ONGOING" | "FINISHED";
  athletes: EventAthleteInput[];
};

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
  let eventId = "";
  await prisma
    .$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          name: data.name,
          date: new Date(data.date),
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
          data: data.athletes.map((a) => ({
            eventId: event.id,
            athleteId: a.athleteId,
            bib: a.bib,
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
  const now = new Date();

  await prisma
    .$transaction(async (tx) => {
      await tx.event.update({
        where: { id },
        data: {
          name: data.name,
          date: new Date(data.date),
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
      for (const a of data.athletes) {
        await tx.eventAthlete.upsert({
          where: { eventId_athleteId: { eventId: id, athleteId: a.athleteId } },
          create: {
            eventId: id,
            athleteId: a.athleteId,
            bib: a.bib,
            createdById: me.id,
            updatedById: me.id,
          },
          update: { bib: a.bib, deletedAt: null, updatedById: me.id },
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
