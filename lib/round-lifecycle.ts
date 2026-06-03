import { prisma } from "@/lib/prisma";

type EventSyncResult = "ONGOING" | "FINISHED" | null;

/**
 * Keep Event.status in sync with the aggregate state of its rounds:
 *   - any round ONGOING            → Event ONGOING
 *   - all rounds FINISHED (>=1)    → Event FINISHED
 *   - otherwise (only SCHEDULED)   → leave SCHEDULED/DRAFT untouched
 * Returns the resulting event status (or null if event not found / unchanged).
 */
export async function syncEventStatus(
  eventId: string,
): Promise<EventSyncResult> {
  const rounds = await prisma.round.findMany({
    where: { eventId, deletedAt: null },
    select: { status: true },
  });
  if (rounds.length === 0) return null;

  const anyOngoing = rounds.some((r) => r.status === "ONGOING");
  const allFinished = rounds.every((r) => r.status === "FINISHED");

  let next: EventSyncResult = null;
  if (anyOngoing) next = "ONGOING";
  else if (allFinished) next = "FINISHED";

  if (next) {
    await prisma.event.updateMany({
      where: { id: eventId, status: { not: next } },
      data: { status: next },
    });
  }
  return next;
}

export type RoundEndActor = { id: string; name: string; role: string };

/**
 * Marks a round FINISHED (idempotent) with an end-of-race activity-log entry,
 * then syncs the parent event status. Shared by the admin/moderator "end race"
 * action AND the automatic trigger fired when the last in-standing athlete
 * crosses the line.
 *
 * Returns `ended: false` if the round was already finished (no-op), so callers
 * can decide whether to additionally log/announce.
 */
export async function finalizeRoundEnd(
  roundId: string,
  actor: RoundEndActor,
  detail: string,
): Promise<{
  ended: boolean;
  eventId: string | null;
  eventStatus: "ONGOING" | "FINISHED" | null;
}> {
  const round = await prisma.round.findUnique({ where: { id: roundId } });
  if (!round) return { ended: false, eventId: null, eventStatus: null };
  if (round.status === "FINISHED") {
    return { ended: false, eventId: round.eventId, eventStatus: null };
  }

  await prisma.round.update({
    where: { id: roundId },
    data: { status: "FINISHED", endedAt: new Date() },
  });

  await prisma.roundActivityLog.create({
    data: {
      roundId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      actionType: "round_end",
      details: detail,
    },
  });

  const eventStatus = await syncEventStatus(round.eventId);
  return { ended: true, eventId: round.eventId, eventStatus };
}

/**
 * True when every in-standing (status OK) athlete in the round has a finish
 * time. DQ/DNF athletes never receive a finish time, so they don't block this.
 * Returns false for a round with zero OK athletes (nothing to finish).
 */
export async function allActiveAthletesFinished(roundId: string): Promise<boolean> {
  const [okAthletes, finishes] = await Promise.all([
    prisma.roundAthlete.findMany({
      where: { roundId, deletedAt: null, status: "OK" },
      select: { athleteId: true },
    }),
    prisma.finishTime.findMany({
      where: { roundId, deletedAt: null },
      select: { athleteId: true },
    }),
  ]);
  if (okAthletes.length === 0) return false;
  const finished = new Set(finishes.map((f) => f.athleteId));
  return okAthletes.every((a) => finished.has(a.athleteId));
}
