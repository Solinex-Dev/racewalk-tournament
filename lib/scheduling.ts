/**
 * Scheduling guards for rounds.
 *
 * 1) assertNoScheduleConflict — a person (athlete or judge) may not take part in
 *    two rounds of *different* events whose time windows actually OVERLAP. Sharing
 *    the same calendar day is no longer enough to block: a morning race and an
 *    afternoon race on the same day are both allowed, as long as their clock-time
 *    windows don't intersect.
 *
 * 2) assertRoundWithinEvent — a round's date/time may not fall before its event's
 *    start day. (Event dates are stored date-only, so the lower bound is the start
 *    of the event's calendar day.)
 *
 * A round's busy window is the half-open interval [start, end):
 *   start = startedAt ?? scheduledTime
 *   end   = endedAt   ?? expectedEndTime ?? start + estimatedDuration(distanceKm)
 * A round with no known start time occupies its whole event day, so an un-timed
 * round still blocks anything else that day (preserving the old guard for it).
 *
 * Note: racewalk rounds never cross midnight, so candidate rounds are pre-filtered
 * to the same calendar day as the new round's window before the precise overlap
 * check — cheap, and a cross-midnight clash isn't a real case in this domain.
 */
import { prisma } from "@/lib/prisma";

const MS_PER_MIN = 60_000;
// Planning pace used ONLY when a round has no explicit end time. 5 min/km matches
// the seed convention; a flat 2-hour window is used when distance is unknown.
const PACE_MIN_PER_KM = 5;
const DEFAULT_DURATION_MS = 2 * 60 * MS_PER_MIN;

export type RoundTimeShape = {
  scheduledTime: Date | null;
  expectedEndTime: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  distanceKm: string | null;
};

type Window = { start: Date; end: Date };

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() + 1);
  return d;
}

function estimatedDurationMs(distanceKm: string | null): number {
  const km = distanceKm ? Number(distanceKm) : Number.NaN;
  if (Number.isFinite(km) && km > 0) return km * PACE_MIN_PER_KM * MS_PER_MIN;
  return DEFAULT_DURATION_MS;
}

/** Resolve a round's busy [start, end) window. See file header for the rules. */
function resolveWindow(round: RoundTimeShape, eventDate: Date): Window {
  const start = round.startedAt ?? round.scheduledTime;
  if (!start) return { start: startOfDay(eventDate), end: endOfDay(eventDate) };
  const rawEnd = round.endedAt ?? round.expectedEndTime;
  const end =
    rawEnd && rawEnd.getTime() > start.getTime()
      ? rawEnd
      : new Date(start.getTime() + estimatedDurationMs(round.distanceKm));
  return { start, end };
}

function overlaps(a: Window, b: Window): boolean {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();
}

function clock(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function dmy(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}

/**
 * A round's start (and end, if given) must not fall before the event's start day.
 * Also rejects an end time that precedes the start time.
 */
export function assertRoundWithinEvent(opts: {
  scheduledTime: Date | null;
  expectedEndTime: Date | null;
  eventDate: Date;
}): void {
  const { scheduledTime, expectedEndTime, eventDate } = opts;
  const eventDayStart = startOfDay(eventDate);

  if (scheduledTime && scheduledTime.getTime() < eventDayStart.getTime()) {
    throw new Error(
      `วันและเวลาเริ่มของรอบ (${dmy(scheduledTime)} ${clock(scheduledTime)} น.) ต้องไม่ก่อนวันเริ่มกิจกรรม (${dmy(eventDate)})`,
    );
  }
  if (
    expectedEndTime &&
    !scheduledTime &&
    expectedEndTime.getTime() < eventDayStart.getTime()
  ) {
    throw new Error(
      `เวลาสิ้นสุดของรอบ (${dmy(expectedEndTime)} ${clock(expectedEndTime)} น.) ต้องไม่ก่อนวันเริ่มกิจกรรม (${dmy(eventDate)})`,
    );
  }
  if (
    expectedEndTime &&
    scheduledTime &&
    expectedEndTime.getTime() < scheduledTime.getTime()
  ) {
    throw new Error("เวลาสิ้นสุด (โดยประมาณ) ของรอบ ต้องไม่ก่อนเวลาเริ่มของรอบ");
  }
}

/**
 * Throw if any of the given athletes/judges are already assigned to a round of a
 * *different* event whose busy window overlaps this round's window.
 */
export async function assertNoScheduleConflict(opts: {
  eventId: string;
  eventDate: Date;
  round: RoundTimeShape;
  athleteIds?: string[];
  judgeIds?: string[];
}): Promise<void> {
  const { eventId, eventDate, round, athleteIds = [], judgeIds = [] } = opts;
  if (athleteIds.length === 0 && judgeIds.length === 0) return;

  const newWin = resolveWindow(round, eventDate);

  // Cheap prefilter: only events on the same calendar day as this round's window
  // can possibly clash (rounds never cross midnight in this domain).
  const dayStart = startOfDay(newWin.start);
  const dayEnd = endOfDay(newWin.start);
  const otherEvents = await prisma.event.findMany({
    where: { id: { not: eventId }, deletedAt: null, date: { gte: dayStart, lt: dayEnd } },
    select: { id: true, name: true, date: true },
  });
  if (otherEvents.length === 0) return;

  const otherEventIds = otherEvents.map((e) => e.id);
  const eventById = new Map(otherEvents.map((e) => [e.id, e]));

  const roundTimeSelect = {
    eventId: true,
    scheduledTime: true,
    expectedEndTime: true,
    startedAt: true,
    endedAt: true,
    distanceKm: true,
  } as const;

  if (athleteIds.length > 0) {
    const rows = await prisma.roundAthlete.findMany({
      where: {
        deletedAt: null,
        athleteId: { in: athleteIds },
        round: { deletedAt: null, eventId: { in: otherEventIds } },
      },
      select: {
        athlete: { select: { name: true } },
        round: { select: roundTimeSelect },
      },
    });
    for (const row of rows) {
      const ev = eventById.get(row.round.eventId);
      if (!ev) continue;
      const win = resolveWindow(row.round, ev.date);
      if (overlaps(newWin, win)) {
        throw new Error(
          `นักกีฬา "${row.athlete.name}" ติดแข่งในรายการ "${ev.name}" ช่วง ${clock(win.start)}–${clock(win.end)} น. ซึ่งทับซ้อนกับเวลาของรอบนี้ (${clock(newWin.start)}–${clock(newWin.end)} น.) — เข้าร่วมได้รายการเดียวในเวลาที่ทับกัน`,
        );
      }
    }
  }

  if (judgeIds.length > 0) {
    const rows = await prisma.roundOfficial.findMany({
      where: {
        deletedAt: null,
        judgeId: { in: judgeIds },
        round: { deletedAt: null, eventId: { in: otherEventIds } },
      },
      select: {
        judge: { select: { name: true } },
        round: { select: roundTimeSelect },
      },
    });
    for (const row of rows) {
      const ev = eventById.get(row.round.eventId);
      if (!ev) continue;
      const win = resolveWindow(row.round, ev.date);
      if (overlaps(newWin, win)) {
        throw new Error(
          `กรรมการ "${row.judge.name}" ติดงานในรายการ "${ev.name}" ช่วง ${clock(win.start)}–${clock(win.end)} น. ซึ่งทับซ้อนกับเวลาของรอบนี้ (${clock(newWin.start)}–${clock(newWin.end)} น.) — เข้าร่วมได้รายการเดียวในเวลาที่ทับกัน`,
        );
      }
    }
  }
}
