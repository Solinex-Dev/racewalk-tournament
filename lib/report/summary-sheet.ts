/**
 * Shared data layer for the official **Race Walking Judges Summary Sheet** export.
 *
 * Maps the domain DB (Event / Round / Athlete / Judge / Card / FinishTime) into the
 * structure of the World Athletics RWJS form so both the Excel (.xlsx) generator and
 * the PDF/print page render from one consistent source.
 *
 * Symbol convention (matches the official form):
 *   LIFTED_FOOT (ยกเท้า / loss of contact) → "~"
 *   BENT_KNEE   (เข่างอ / bent knee)        → "<"
 *
 * Note: the in-app UI renders BENT_KNEE as ">", but the official paper form uses "<";
 * the export deliberately follows the official form.
 */
import { prisma } from "@/lib/prisma";

export const OFFICIAL_SYMBOL = { LIFTED_FOOT: "~", BENT_KNEE: "<" } as const;
export const SYMBOL_TH = { LIFTED_FOOT: "ยกเท้า", BENT_KNEE: "เข่างอ" } as const;

export type DbSymbol = "LIFTED_FOOT" | "BENT_KNEE";
export type OfficialSymbol = (typeof OFFICIAL_SYMBOL)[DbSymbol];
export type RedState = "PENDING" | "CONFIRMED" | "OVERRIDDEN";

export type JudgeColumn = {
  id: string;
  name: string;
  zone: string; // "Zone A" (or "" if none)
  shortZone: string; // "A"
};

export type JudgeMark = {
  yellowLifted: boolean; // judge showed a "~" yellow paddle
  yellowBent: boolean; // judge showed a "<" yellow paddle
  red: { symbol: OfficialSymbol; state: RedState } | null; // red card sent (max 1/judge)
};

export type AthleteRow = {
  bib: string;
  name: string;
  country: string;
  affiliation: string;
  status: "OK" | "DQ" | "DNF";
  position: number | null;
  finishMs: number | null;
  /** marks indexed by judge id */
  marks: Record<string, JudgeMark>;
  /** totals across all judges — confirmed reds only for `red` */
  totals: { lifted: number; bent: number; red: number };
  /** DQ notification info (only when status === "DQ") */
  dq: { time: string | null; offence: string | null } | null;
};

export type RoundSummary = {
  id: string;
  name: string;
  status: "SCHEDULED" | "ONGOING" | "FINISHED";
  distanceKm: string | null;
  startTime: string | null; // "HH:MM"
  startedAt: Date | null;
  endedAt: Date | null;
  chiefJudge: string;
  recorders: string[];
  judges: JudgeColumn[];
  athletes: AthleteRow[];
};

export type EventSummary = {
  id: string;
  name: string;
  date: Date;
  location: string;
  distanceKm: string;
  rounds: RoundSummary[];
};

// ── formatting helpers (shared by xlsx + print) ──────────────────────────────

export function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatClock(dt: Date | null | undefined): string {
  if (!dt) return "";
  return dt.toTimeString().slice(0, 5); // HH:MM
}

export function formatClockSec(dt: Date | null | undefined): string {
  if (!dt) return "";
  return dt.toTimeString().slice(0, 8); // HH:MM:SS
}

// ── query ────────────────────────────────────────────────────────────────────

/**
 * Loads an event and shapes every (non-deleted) round into a RoundSummary.
 * Pass `roundId` to restrict to a single round (still returns the full event meta).
 * Returns null if the event does not exist.
 */
export async function loadEventSummary(
  eventId: string,
  roundId?: string,
): Promise<EventSummary | null> {
  const event = await prisma.event.findUnique({
    where: { id: eventId, deletedAt: null },
    include: {
      rounds: {
        where: { deletedAt: null, ...(roundId ? { id: roundId } : {}) },
        orderBy: { scheduledTime: "asc" },
        include: {
          roundAthletes: {
            where: { deletedAt: null },
            include: { athlete: { include: { affiliation: { select: { name: true } } } } },
            orderBy: [{ position: "asc" }, { bib: "asc" }],
          },
          roundOfficials: {
            where: { deletedAt: null },
            include: { judge: { select: { name: true } } },
          },
          cards: {
            where: { deletedAt: null },
            include: { judge: { select: { name: true } } },
          },
          finishTimes: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!event) return null;

  const rounds: RoundSummary[] = event.rounds.map((r) => {
    // Zone judges become the columns of the sheet, ordered by zone label.
    const judges: JudgeColumn[] = r.roundOfficials
      .filter((ro) => ro.position === "JUDGE")
      .map((ro) => {
        const zone = ro.zone ?? "";
        return {
          id: ro.judgeId,
          name: ro.judge.name,
          zone,
          shortZone: zone.replace(/^Zone\s*/i, "").trim(),
        };
      })
      .sort((a, b) => a.zone.localeCompare(b.zone, "en"));

    const chiefJudge =
      r.roundOfficials.find((ro) => ro.position === "HEAD_JUDGE")?.judge.name ?? "";
    const recorders = r.roundOfficials
      .filter((ro) => ro.position === "EVENT_LOGGER")
      .map((ro) => ro.judge.name);

    const finishByAthlete = new Map(r.finishTimes.map((f) => [f.athleteId, f]));

    const athletes: AthleteRow[] = r.roundAthletes.map((ra) => {
      const cards = r.cards.filter((c) => c.athleteId === ra.athleteId);

      // Per-judge marks
      const marks: Record<string, JudgeMark> = {};
      for (const j of judges) {
        marks[j.id] = { yellowLifted: false, yellowBent: false, red: null };
      }
      const ensure = (judgeId: string): JudgeMark =>
        (marks[judgeId] ??= { yellowLifted: false, yellowBent: false, red: null });

      let liftedTotal = 0;
      let bentTotal = 0;
      let redConfirmed = 0;

      for (const c of cards) {
        const sym = c.symbol as DbSymbol;
        const m = ensure(c.judgeId);
        if (c.color === "YELLOW") {
          if (sym === "LIFTED_FOOT") {
            m.yellowLifted = true;
            liftedTotal += 1;
          } else {
            m.yellowBent = true;
            bentTotal += 1;
          }
        } else {
          // RED — keep the most decisive (CONFIRMED > PENDING > OVERRIDDEN)
          const state = (c.state ?? "PENDING") as RedState;
          const rank = { CONFIRMED: 3, PENDING: 2, OVERRIDDEN: 1 } as const;
          if (!m.red || rank[state] > rank[m.red.state]) {
            m.red = { symbol: OFFICIAL_SYMBOL[sym], state };
          }
          if (state === "CONFIRMED") redConfirmed += 1;
        }
      }

      // DQ notification — time of the latest confirmed red, offence = its symbols
      let dq: AthleteRow["dq"] = null;
      if (ra.status === "DQ") {
        const confirmedReds = cards
          .filter((c) => c.color === "RED" && (c.state ?? "") === "CONFIRMED")
          .sort(
            (a, b) =>
              (a.decidedAt ?? a.issuedAt).getTime() - (b.decidedAt ?? b.issuedAt).getTime(),
          );
        const last = confirmedReds.at(-1);
        const offence = confirmedReds
          .map((c) => OFFICIAL_SYMBOL[c.symbol as DbSymbol])
          .join(" ");
        dq = {
          time: last ? formatClock(last.decidedAt ?? last.issuedAt) : null,
          offence: offence || null,
        };
      }

      const finish = finishByAthlete.get(ra.athleteId);

      return {
        bib: ra.bib,
        name: ra.athlete.name,
        country: ra.athlete.country,
        affiliation: ra.athlete.affiliation?.name ?? "",
        status: ra.status,
        position: ra.position ?? null,
        finishMs: finish?.timeMs ?? null,
        marks,
        totals: { lifted: liftedTotal, bent: bentTotal, red: redConfirmed },
        dq,
      };
    });

    return {
      id: r.id,
      name: r.name,
      status: r.status,
      distanceKm: r.distanceKm,
      // Show the ACTUAL race start (the moderator's editable source of truth);
      // fall back to the scheduled time only for rounds that haven't started.
      startTime: formatClock(r.startedAt ?? r.scheduledTime),
      startedAt: r.startedAt,
      endedAt: r.endedAt,
      chiefJudge,
      recorders,
      judges,
      athletes,
    };
  });

  return {
    id: event.id,
    name: event.name,
    date: event.date,
    location: event.location,
    distanceKm: event.distanceKm,
    rounds,
  };
}
