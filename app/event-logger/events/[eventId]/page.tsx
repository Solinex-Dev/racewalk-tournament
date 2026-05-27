import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LapRecorder, type AthleteRecord } from "@/components/timekeeper/lap-recorder";
import { AutoRefresh } from "@/components/common/auto-refresh";
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

export default async function EventLoggerPage(props: Props) {
  const { eventId } = await props.params;
  const session = await getOfficialSession();

  if (!session || session.eventId !== eventId || session.position !== "EVENT_LOGGER") {
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
    const lastLap = myLaps[myLaps.length - 1];
    const finish = round.finishTimes.find((f) => f.athleteId === ra.athleteId);
    return {
      bib: ra.bib,
      athleteId: ra.athleteId,
      name: ra.athlete.name,
      currentLap: myLaps.length + (finish ? 1 : 0),
      lapCount,
      lastLapAt: lastLap ? formatMs(lastLap.timeMs) : finish ? formatMs(finish.timeMs) : null,
      status: ra.status,
      finishedAt: finish ? formatMs(finish.timeMs) : null,
    };
  });

  return (
    <>
      <AutoRefresh intervalMs={10000} />
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
