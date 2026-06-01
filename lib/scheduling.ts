/**
 * Same-day participation guard. A person (athlete or judge) may not take part in
 * two different events held on the same calendar day. Enforced when assigning
 * athletes/officials to a round (see `app/actions/rounds.ts`).
 */
import { prisma } from "@/lib/prisma";

function dayBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/**
 * Throw if any of the given athletes/judges are already assigned to a round of a
 * *different* event whose date falls on the same calendar day as `eventDate`.
 */
export async function assertNoSameDayConflict(opts: {
  eventId: string;
  eventDate: Date;
  athleteIds?: string[];
  judgeIds?: string[];
}): Promise<void> {
  const { eventId, eventDate, athleteIds = [], judgeIds = [] } = opts;
  if (athleteIds.length === 0 && judgeIds.length === 0) return;

  const { start, end } = dayBounds(eventDate);
  const sameDayEvents = await prisma.event.findMany({
    where: { id: { not: eventId }, deletedAt: null, date: { gte: start, lt: end } },
    select: { id: true, name: true },
  });
  if (sameDayEvents.length === 0) return;

  const otherEventIds = sameDayEvents.map((e) => e.id);
  const eventNameById = new Map(sameDayEvents.map((e) => [e.id, e.name]));

  if (athleteIds.length > 0) {
    const clash = await prisma.roundAthlete.findFirst({
      where: {
        deletedAt: null,
        athleteId: { in: athleteIds },
        round: { deletedAt: null, eventId: { in: otherEventIds } },
      },
      include: { athlete: { select: { name: true } }, round: { select: { eventId: true } } },
    });
    if (clash) {
      throw new Error(
        `นักกีฬา "${clash.athlete.name}" ถูกจัดอยู่ในรายการ "${eventNameById.get(clash.round.eventId) ?? ""}" ซึ่งแข่งวันเดียวกันแล้ว — เข้าร่วมได้รายการเดียวต่อวัน`,
      );
    }
  }

  if (judgeIds.length > 0) {
    const clash = await prisma.roundOfficial.findFirst({
      where: {
        deletedAt: null,
        judgeId: { in: judgeIds },
        round: { deletedAt: null, eventId: { in: otherEventIds } },
      },
      include: { judge: { select: { name: true } }, round: { select: { eventId: true } } },
    });
    if (clash) {
      throw new Error(
        `กรรมการ "${clash.judge.name}" ถูกจัดอยู่ในรายการ "${eventNameById.get(clash.round.eventId) ?? ""}" ซึ่งแข่งวันเดียวกันแล้ว — เข้าร่วมได้รายการเดียวต่อวัน`,
      );
    }
  }
}
