import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LapRecorder, type AthleteRecord } from "@/components/timekeeper/lap-recorder";
import { AutoRefresh } from "@/components/common/auto-refresh";
import { OfficialEndedDialog } from "@/components/common/official-ended-dialog";
import { lapsCompleted } from "@/lib/lap-progress";
import { prisma } from "@/lib/prisma";
import { getOfficialSession } from "@/lib/official-session";

export const metadata: Metadata = {
  title: "หน้าคนเก็บ Lap Time – การแข่งขันเดินทน",
};

type Props = { params: Promise<{ eventId: string }> };

function formatMs(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default async function EventLoggerPage(props: Readonly<Props>) {
  const { eventId } = await props.params;
  const session = await getOfficialSession();

  if (!session) {
    redirect(`/event-logger/events/${eventId}/join`);
  }
  if (session.eventId !== eventId || session.position !== "EVENT_LOGGER") {
    redirect(`/event-logger/events/${eventId}/join`);
  }

  const round = await prisma.round.findUnique({
    where: { id: session.roundId, deletedAt: null },
    include: {
      event: { select: { name: true } },
      roundAthletes: {
        where: { deletedAt: null },
        include: { athlete: { select: { name: true } } },
        orderBy: [{ position: "asc" }, { bib: "asc" }],
      },
      lapTimes: { where: { deletedAt: null }, orderBy: { lapNumber: "asc" } },
      finishTimes: { where: { deletedAt: null } },
    },
  });

  if (!round) redirect(`/event-logger/events/${eventId}/join`);

  const lapCount = round.lapCount ?? 0;

  const athletes: AthleteRecord[] = round.roundAthletes.map((ra) => {
    const myLaps = round.lapTimes.filter((l) => l.athleteId === ra.athleteId);
    const lastLap = myLaps.at(-1);
    const finish = round.finishTimes.find((f) => f.athleteId === ra.athleteId);
    const lastLapAtFallback = lastLap ? formatMs(lastLap.timeMs) : null;
    return {
      bib: ra.bib,
      athleteId: ra.athleteId,
      name: ra.athlete.name,
      currentLap: lapsCompleted(myLaps.length, !!finish, lapCount),
      lapCount,
      // The finish IS the final crossing — show it as the most recent time when present.
      lastLapAt: finish ? formatMs(finish.timeMs) : lastLapAtFallback,
      status: ra.status,
      finishedAt: finish ? formatMs(finish.timeMs) : null,
    };
  });

  return (
    <>
      <AutoRefresh intervalMs={2000} />
      <OfficialEndedDialog
        open={round.status === "FINISHED"}
        roundName={round.name}
        roleLabel="ผู้เก็บ Lap Time"
      />
      <LapRecorder
        eventId={eventId}
        judgeName={session.judgeName}
        roleLabel="คนเก็บ Lap Time"
        joinPath={`/event-logger/events/${eventId}/join`}
        eventName={round.event.name}
        roundName={round.name}
        distanceKm={round.distanceKm ?? ""}
        lapCount={lapCount}
        athletes={athletes}
        raceStartedAt={round.startedAt?.toISOString() ?? null}
        raceEndedAt={round.endedAt?.toISOString() ?? null}
      />
    </>
  );
}
