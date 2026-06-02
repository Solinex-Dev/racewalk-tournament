"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";
import { requirePermission } from "@/lib/authz";

export type EventActionData = {
  name: string;
  date: string;
  location: string;
  distanceKm: string;
  lapCount: number;
  status: "DRAFT" | "SCHEDULED" | "ONGOING" | "FINISHED";
};

export async function createEvent(data: EventActionData) {
  const me = await requirePermission("events", "create");
  const event = await prisma.event.create({
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
  await logCurrentAdmin(ActivityLogAction.EVENT_CREATED, "Event", event.id, {
    name: event.name,
    status: event.status,
  });
  revalidatePath("/admin/events");
  return { ok: true, id: event.id };
}

export async function updateEvent(id: string, data: EventActionData) {
  const me = await requirePermission("events", "edit");
  await prisma.event.update({
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
  await logCurrentAdmin(ActivityLogAction.EVENT_UPDATED, "Event", id, {
    name: data.name,
    status: data.status,
  });
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
  return { ok: true };
}
