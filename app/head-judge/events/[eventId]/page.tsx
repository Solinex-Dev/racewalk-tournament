import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  HeadJudgeView,
  type PendingCard,
  type AthleteRow,
  type LogItem,
} from "@/components/head-judge/head-judge-view";
import { AutoRefresh } from "@/components/common/auto-refresh";
import { prisma } from "@/lib/prisma";
import { getOfficialSession } from "@/lib/official-session";

export const metadata: Metadata = {
  title: "หน้าทำงานหัวหน้ากรรมการ – การแข่งขันเดินทน",
};

type Props = { params: Promise<{ eventId: string }> };

function formatTime(dt: Date) {
  return dt.toTimeString().slice(0, 8);
}

function symbolLabel(s: "LIFTED_FOOT" | "BENT_KNEE") {
  return s === "LIFTED_FOOT" ? "ยกเท้า" : "เข่างอ";
}

export default async function HeadJudgePage(props: Props) {
  const { eventId } = await props.params;
  const session = await getOfficialSession();

  if (!session || session.eventId !== eventId || session.position !== "HEAD_JUDGE") {
    redirect(`/head-judge/events/${eventId}/join`);
  }

  const round = await prisma.round.findUnique({
    where: { id: session.roundId, deletedAt: null },
    include: {
      event: { select: { name: true } },
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
        include: { judge: { select: { name: true } }, athlete: { select: { name: true } } },
      },
      activityLogs: {
        where: { deletedAt: null },
        orderBy: { timestamp: "desc" },
        take: 50,
      },
    },
  });

  if (!round) {
    redirect(`/head-judge/events/${eventId}/join`);
  }

  const pendingCards: PendingCard[] = round.cards
    .filter((c) => c.color === "RED" && c.state === "PENDING")
    .map((c) => {
      const ra = round.roundAthletes.find((ra) => ra.athleteId === c.athleteId);
      const ro = round.roundOfficials.find((ro) => ro.judgeId === c.judgeId);
      return {
        id: c.id,
        athleteId: c.athleteId,
        athleteName: c.athlete.name,
        bib: ra?.bib ?? "?",
        symbol: c.symbol === "LIFTED_FOOT" ? "~" : ">",
        symbolLabel: symbolLabel(c.symbol),
        judgeName: c.judge.name,
        zone: ro?.zone ?? "",
        time: formatTime(c.issuedAt),
      };
    });

  const athletes: AthleteRow[] = round.roundAthletes.map((ra) => {
    const yellowCards = round.cards.filter(
      (c) => c.athleteId === ra.athleteId && c.color === "YELLOW",
    ).length;
    const confirmedRed = round.cards.filter(
      (c) => c.athleteId === ra.athleteId && c.color === "RED" && c.state === "CONFIRMED",
    ).length;
    const pendingRed = round.cards.filter(
      (c) => c.athleteId === ra.athleteId && c.color === "RED" && c.state === "PENDING",
    ).length;
    return {
      bib: ra.bib,
      athleteId: ra.athleteId,
      name: ra.athlete.name,
      affiliation: ra.athlete.affiliation?.name ?? "",
      yellowCards,
      confirmedRed,
      pendingRed,
      status: ra.status,
    };
  });

  const athleteNameById = new Map(
    round.roundAthletes.map((ra) => [ra.athleteId, ra.athlete.name]),
  );

  const logs: LogItem[] = round.activityLogs.map((log) => ({
    id: log.id,
    time: formatTime(log.timestamp),
    actor: log.actorName,
    actorRole: log.actorRole,
    actionType: log.actionType,
    targetBib: log.targetBib ?? undefined,
    targetAthlete: log.targetAthleteId
      ? athleteNameById.get(log.targetAthleteId)
      : undefined,
    details: log.details ?? undefined,
    lapNumber: log.lapNumber ?? undefined,
  }));

  return (
    <>
      <AutoRefresh intervalMs={5000} />
      <HeadJudgeView
        eventId={eventId}
        judgeName={session.judgeName}
        eventName={round.event.name}
        roundName={round.name}
        pendingCards={pendingCards}
        athletes={athletes}
        logs={logs}
      />
    </>
  );
}
