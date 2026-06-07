import { revalidatePath, revalidateTag } from "next/cache";
import { leaderboardTag } from "@/lib/leaderboard";

/** Invalidate all race-day views that read live round data. */
export function revalidateRaceDayViews(eventId: string): void {
  revalidatePath(`/judge/events/${eventId}`);
  revalidatePath(`/head-judge/events/${eventId}`);
  revalidatePath(`/event-logger/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}/moderator`);
  revalidatePath(`/events/${eventId}`);
  // Purge the cached public leaderboard query so the next poll re-reads the DB.
  // Next 16 requires a cache-life profile as the 2nd arg; "max" reproduces the
  // legacy single-arg "invalidate now" behaviour.
  revalidateTag(leaderboardTag(eventId), "max");
}
