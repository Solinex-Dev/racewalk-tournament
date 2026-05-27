import { revalidatePath } from "next/cache";

/** Invalidate all race-day views that read live round data. */
export function revalidateRaceDayViews(eventId: string): void {
  revalidatePath(`/judge/events/${eventId}`);
  revalidatePath(`/head-judge/events/${eventId}`);
  revalidatePath(`/event-logger/events/${eventId}`);
  revalidatePath(`/timekeeper/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}/moderator`);
  revalidatePath(`/events/${eventId}`);
}
