import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { JudgeWorkspace, type JudgeAthleteRow } from "@/components/judge/judge-workspace";
import { AutoRefresh } from "@/components/common/auto-refresh";
import { OfficialEndedDialog } from "@/components/common/official-ended-dialog";
import { prisma } from "@/lib/prisma";
import { getOfficialSession } from "@/lib/official-session";

export const metadata: Metadata = {
  title: "หน้าทำงานกรรมการ – การแข่งขันเดินทน",
};

type Props = { params: Promise<{ eventId: string }> };

export default async function JudgePage(props: Props) {
  const { eventId } = await props.params;
  const session = await getOfficialSession();

  if (!session || session.eventId !== eventId) {
    redirect(`/judge/events/${eventId}/join`);
  }
  if (session.position !== "JUDGE" && session.position !== "HEAD_JUDGE") {
    // Wrong role for this page - send to their correct workspace
    redirect(`/judge/events/${eventId}/join`);
  }

  const round = await prisma.round.findUnique({
    where: { id: session.roundId, deletedAt: null },
    include: {
      event: { select: { id: true, name: true } },
      roundAthletes: {
        where: { deletedAt: null },
        include: { athlete: { select: { name: true } } },
        orderBy: [{ position: "asc" }, { bib: "asc" }],
      },
      cards: {
        where: { deletedAt: null },
      },
    },
  });

  if (!round) {
    redirect(`/judge/events/${eventId}/join`);
  }

  const myJudgeId = session.judgeId;

  const rows: JudgeAthleteRow[] = round.roundAthletes.map((ra) => {
    const myCards = round.cards.filter(
      (c) => c.athleteId === ra.athleteId && c.judgeId === myJudgeId,
    );
    const myYellowKnee = myCards.some((c) => c.color === "YELLOW" && c.symbol === "BENT_KNEE");
    const myYellowFoot = myCards.some((c) => c.color === "YELLOW" && c.symbol === "LIFTED_FOOT");
    const myRed = myCards.find((c) => c.color === "RED" && c.state !== "OVERRIDDEN");
    const totalRed = round.cards.filter(
      (c) => c.athleteId === ra.athleteId && c.color === "RED" && c.state === "CONFIRMED",
    ).length;
    return {
      bib: ra.bib,
      athleteId: ra.athleteId,
      name: ra.athlete.name,
      status: ra.status,
      myYellowKnee,
      myYellowFoot,
      myRedSymbol: myRed ? (myRed.symbol === "BENT_KNEE" ? ">" : "~") : null,
      totalRed,
    };
  });

  return (
    <>
      <AutoRefresh intervalMs={15000} />
      <OfficialEndedDialog
        open={round.status === "FINISHED"}
        roundName={round.name}
        roleLabel="กรรมการ"
      />
      <JudgeWorkspace
        eventId={eventId}
        judgeName={session.judgeName}
        event={{
          id: round.event.id,
          name: round.event.name,
          roundName: round.name,
          heatName: round.heatName ?? "",
          distanceKm: round.distanceKm ?? "",
          lapCount: round.lapCount ?? 0,
          currentLap: round.currentLap,
        }}
        athletes={rows}
      />
    </>
  );
}
