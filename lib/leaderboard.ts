/**
 * Shared leaderboard data layer for the public scoreboard.
 *
 * Split out of app/events/[eventId]/page.tsx so BOTH the initial server render
 * and the polled JSON route handler (app/api/events/[eventId]/leaderboard) use
 * the exact same query + transform. The board no longer re-renders the whole
 * page on every poll; it fetches the DTO from the cached route handler instead.
 *
 *   queryLeaderboardRaw   – the heavy nested Prisma read
 *   getCachedLeaderboard  – queryLeaderboardRaw wrapped in the Next data cache,
 *                           tagged so a single card/lap/finish write purges it
 *                           (see lib/revalidate-race-day.ts)
 *   buildLeaderboard      – pure, serializable DTO builder (Dates → ISO strings)
 */
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { compareAthletesByFinish } from "@/lib/athlete-sort";
import { lapsCompleted } from "@/lib/lap-progress";
import type { RedCardDetail } from "@/components/judge/card-matrix";

/** How long the cached query result is reused before a background refresh. */
export const LEADERBOARD_REVALIDATE_SECONDS = 5;

/** Cache tag for one event's leaderboard data. Purged on every race-day write. */
export function leaderboardTag(eventId: string): string {
  return `event:${eventId}`;
}

// The heavy nested query behind the public board.
export function queryLeaderboardRaw(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId, deletedAt: null },
    include: {
      eventAthletes: {
        where: { deletedAt: null },
        select: { athleteId: true, bib: true },
      },
      rounds: {
        where: { deletedAt: null },
        orderBy: { scheduledTime: "asc" },
        include: {
          roundAthletes: {
            where: { deletedAt: null },
            // Fixed start-list order (athleteId tiebreak so rows never swap
            // nondeterministically between polls).
            orderBy: [{ sortOrder: "asc" }, { athleteId: "asc" }],
            include: {
              athlete: { include: { affiliation: { select: { name: true } } } },
            },
          },
          cards: {
            where: {
              deletedAt: null,
              OR: [{ color: "YELLOW" }, { color: "RED", state: "CONFIRMED" }],
            },
          },
          lapTimes: { where: { deletedAt: null }, orderBy: { lapNumber: "asc" } },
          finishTimes: { where: { deletedAt: null } },
        },
      },
    },
  });
}

export type LeaderboardData = Awaited<ReturnType<typeof queryLeaderboardRaw>>;

/**
 * queryLeaderboardRaw behind the Next data cache, keyed by event and tagged so
 * `revalidateTag(leaderboardTag(eventId))` (fired by every card/lap/finish/round
 * write) purges it immediately. Replaces the old per-instance in-memory Map:
 * this cache is shared across the instance's requests AND invalidated on write.
 */
export function getCachedLeaderboard(eventId: string) {
  return unstable_cache(
    () => queryLeaderboardRaw(eventId),
    ["leaderboard", eventId],
    { tags: [leaderboardTag(eventId)], revalidate: LEADERBOARD_REVALIDATE_SECONDS },
  );
}

export type LeaderboardRow = {
  bib: string;
  athleteId: string;
  name: string;
  affiliation: string;
  country: string;
  yellowCards: number;
  redCards: number;
  redCardDetails: RedCardDetail[];
  position: number;
  rank: number | null;
  totalTime: string;
  status: "OK" | "DQ" | "DNF";
  currentLap: number;
  isFinished: boolean;
};

export type LeaderboardDTO = {
  event: {
    id: string;
    name: string;
    location: string;
    distanceKm: string;
    /** lowercased event status (scheduled | ongoing | finished) */
    status: string;
  };
  currentRound: {
    id: string;
    name: string;
    distanceKm: string | null;
    lapCount: number;
    currentLap: number;
    status: string;
    startedAt: string | null;
    endedAt: string | null;
  } | null;
  rows: LeaderboardRow[];
  lapCount: number;
  isRaceLive: boolean;
  isCurrentRoundFinished: boolean;
  remainingOnField: number;
  totalAthletes: number;
  elapsedFallback: string | null;
};

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Date | string | null → ISO string | null. The Next data cache may hand back
// dates as strings (its serializer), so accept both and never call .toISOString
// on a string.
function toIso(d: Date | string | null | undefined): string | null {
  if (d == null) return null;
  return typeof d === "string" ? d : d.toISOString();
}

/**
 * Pure transform: raw query result → serializable leaderboard DTO.
 * `roundParam` picks a specific round (so simultaneous rounds are each viewable),
 * else falls back to ONGOING, else last FINISHED, else first SCHEDULED.
 */
export function buildLeaderboard(
  event: NonNullable<LeaderboardData>,
  roundParam?: string,
): LeaderboardDTO {
  const requestedRound = roundParam
    ? event.rounds.find((r) => r.id === roundParam)
    : null;
  const currentRound =
    requestedRound ??
    event.rounds.find((r) => r.status === "ONGOING") ??
    [...event.rounds].reverse().find((r) => r.status === "FINISHED") ??
    event.rounds[0];

  const eventStatus = event.status.toLowerCase();
  const isRaceLive =
    eventStatus !== "finished" &&
    event.rounds.some((r) => r.status === "ONGOING");

  const currentRoundEndedAt = currentRound ? toIso(currentRound.endedAt) : null;
  const currentRoundStartedAt = currentRound ? toIso(currentRound.startedAt) : null;

  const isCurrentRoundFinished =
    eventStatus === "finished" ||
    currentRound?.status === "FINISHED" ||
    currentRoundEndedAt != null;

  // BIB is stored at Event level.
  const bibMap = new Map(
    (event.eventAthletes ?? []).map((ea) => [ea.athleteId, ea.bib]),
  );

  let rows: LeaderboardRow[] = [];
  let lapCount = 0;

  if (currentRound) {
    lapCount = currentRound.lapCount ?? 0;
    rows = currentRound.roundAthletes.map((ra): LeaderboardRow => {
      const yellow = currentRound.cards.filter(
        (c) => c.athleteId === ra.athleteId && c.color === "YELLOW",
      ).length;
      const redCardsForMe = currentRound.cards.filter(
        (c) =>
          c.athleteId === ra.athleteId &&
          c.color === "RED" &&
          c.state === "CONFIRMED",
      );
      const red = redCardsForMe.length;
      // CardSymbol enum → glyph: BENT_KNEE = ">" (เข่างอ), LIFTED_FOOT = "~" (ยกเท้า)
      const redCardDetails: RedCardDetail[] = redCardsForMe.map((c) => ({
        symbol: c.symbol === "BENT_KNEE" ? ">" : "~",
      }));
      const lapsForMe = currentRound.lapTimes.filter(
        (l) => l.athleteId === ra.athleteId,
      );
      const finish = currentRound.finishTimes.find(
        (f) => f.athleteId === ra.athleteId,
      );
      const lastTimeMs = finish?.timeMs ?? lapsForMe.at(-1)?.timeMs;
      return {
        bib: bibMap.get(ra.athleteId) ?? "?",
        athleteId: ra.athleteId,
        name: ra.athlete.name,
        affiliation: ra.athlete.affiliation?.name ?? "",
        country: ra.athlete.country,
        yellowCards: yellow,
        redCards: red,
        redCardDetails,
        position: ra.position ?? 0,
        rank: null,
        totalTime: lastTimeMs === undefined ? "-" : formatMs(lastTimeMs),
        status: ra.status,
        currentLap: lapsCompleted(lapsForMe.length, !!finish, lapCount),
        isFinished: !!finish,
      };
    });

    // Display order is FIXED to the round's start-list. Rank still reflects live
    // finish placing (DQ-aware): compute on a SEPARATE finish-sorted copy, then
    // stamp it back by athleteId without reordering the displayed array.
    const byFinish = [...rows].sort(compareAthletesByFinish);
    const rankByAthleteId = new Map<string, number>();
    let rankCounter = 0;
    for (const a of byFinish) {
      if (a.status === "OK" && a.isFinished) {
        rankByAthleteId.set(a.athleteId, ++rankCounter);
      }
    }
    for (const a of rows) {
      a.rank = rankByAthleteId.get(a.athleteId) ?? null;
    }
  }

  const remainingOnField = rows.filter(
    (a) => a.status === "OK" && !a.isFinished,
  ).length;

  // Pre-computed fallback for rounds without startedAt (e.g. legacy finished rounds).
  const elapsedFallback: string | null = (() => {
    if (!currentRound || currentRoundStartedAt) return null;
    if (
      currentRound.status === "FINISHED" &&
      currentRound.finishTimes.length > 0
    ) {
      const maxMs = Math.max(...currentRound.finishTimes.map((f) => f.timeMs));
      return formatMs(maxMs);
    }
    return null;
  })();

  return {
    event: {
      id: event.id,
      name: event.name,
      location: event.location,
      distanceKm: event.distanceKm,
      status: eventStatus,
    },
    currentRound: currentRound
      ? {
          id: currentRound.id,
          name: currentRound.name,
          distanceKm: currentRound.distanceKm,
          lapCount: currentRound.lapCount ?? 0,
          currentLap: currentRound.currentLap ?? 0,
          status: currentRound.status,
          startedAt: currentRoundStartedAt,
          endedAt: currentRoundEndedAt,
        }
      : null,
    rows,
    lapCount,
    isRaceLive,
    isCurrentRoundFinished,
    remainingOnField,
    totalAthletes: rows.length,
    elapsedFallback,
  };
}
