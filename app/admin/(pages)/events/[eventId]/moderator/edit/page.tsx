import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  ModeratorEditView,
  type EditAthlete,
  type EditCard,
  type EditJudge,
  type EditLap,
  type EditFinish,
  type EditRoundOption,
} from "@/components/moderator/moderator-edit-view";

export const metadata: Metadata = {
  title: "Moderator Edit – การแข่งขันเดินทน",
  description: "หน้าแก้ไขข้อมูลการแข่งขัน (correction mode) สำหรับ admin",
};

type Props = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ round?: string }>;
};

export default async function ModeratorEditPage(props: Props) {
  const { eventId } = await props.params;
  const search = await props.searchParams;

  const event = await prisma.event.findUnique({
    where: { id: eventId, deletedAt: null },
    include: {
      rounds: {
        where: { deletedAt: null },
        orderBy: { scheduledTime: "asc" },
        select: { id: true, name: true, status: true },
      },
    },
  });

  if (!event) notFound();
  if (event.status === "DRAFT") {
    redirect(`/admin/events/${eventId}`);
  }

  const rounds: EditRoundOption[] = event.rounds.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
  }));

  // Pick the round: from query param, or default to first
  const selectedRoundId = search.round && rounds.some((r) => r.id === search.round)
    ? search.round
    : rounds[0]?.id;

  if (!selectedRoundId) {
    return (
      <ModeratorEditView
        eventId={eventId}
        eventName={event.name}
        rounds={rounds}
        selectedRoundId=""
        athletes={[]}
        judges={[]}
        cards={[]}
        laps={[]}
        finishes={[]}
      />
    );
  }

  const round = await prisma.round.findUnique({
    where: { id: selectedRoundId },
    include: {
      roundAthletes: {
        where: { deletedAt: null },
        include: { athlete: { select: { id: true, name: true } } },
        orderBy: [{ position: "asc" }, { bib: "asc" }],
      },
      roundOfficials: {
        where: { deletedAt: null },
        include: { judge: { select: { name: true } } },
      },
      cards: {
        where: { deletedAt: null },
        include: {
          athlete: { select: { id: true, name: true } },
          judge: { select: { name: true } },
        },
        orderBy: { issuedAt: "desc" },
      },
      lapTimes: {
        where: { deletedAt: null },
        include: { athlete: { select: { id: true, name: true } } },
        orderBy: [{ lapNumber: "asc" }, { athleteId: "asc" }],
      },
      finishTimes: {
        where: { deletedAt: null },
        include: { athlete: { select: { id: true, name: true } } },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!round) notFound();

  // Map for fast bib lookup
  const bibByAthleteId = new Map(round.roundAthletes.map((ra) => [ra.athleteId, ra.bib]));
  const zoneByJudgeId = new Map(round.roundOfficials.map((ro) => [ro.judgeId, ro.zone ?? ""]));

  const athletes: EditAthlete[] = round.roundAthletes.map((ra) => ({
    id: ra.athleteId,
    bib: ra.bib,
    name: ra.athlete.name,
    status: ra.status,
    position: ra.position,
  }));

  // Scoring officials become the headings of the "judges" accordion (zone judges
  // first by zone label, then head judge; the event logger is excluded — handled
  // in the Lap/Finish sections).
  const judges: EditJudge[] = round.roundOfficials
    .filter((ro) => ro.position === "JUDGE" || ro.position === "HEAD_JUDGE")
    .map((ro) => ({
      id: ro.judgeId,
      name: ro.judge.name,
      position: ro.position,
      zone: ro.zone ?? "",
    }))
    .sort((a, b) => {
      if (a.position !== b.position) return a.position === "HEAD_JUDGE" ? 1 : -1;
      return a.zone.localeCompare(b.zone, "en");
    });

  const cards: EditCard[] = round.cards.map((c) => ({
    id: c.id,
    athleteId: c.athleteId,
    athleteName: c.athlete.name,
    bib: bibByAthleteId.get(c.athleteId) ?? "?",
    judgeId: c.judgeId,
    judgeName: c.judge.name,
    judgeZone: zoneByJudgeId.get(c.judgeId) ?? "",
    color: c.color,
    symbol: c.symbol,
    state: c.state,
    issuedAt: c.issuedAt.toISOString(),
  }));

  const laps: EditLap[] = round.lapTimes.map((l) => ({
    id: l.id,
    athleteId: l.athleteId,
    athleteName: l.athlete.name,
    bib: bibByAthleteId.get(l.athleteId) ?? "?",
    lapNumber: l.lapNumber,
    timeMs: l.timeMs,
  }));

  const finishes: EditFinish[] = round.finishTimes.map((ft) => ({
    id: ft.id,
    athleteId: ft.athleteId,
    athleteName: ft.athlete.name,
    bib: bibByAthleteId.get(ft.athleteId) ?? "?",
    timeMs: ft.timeMs,
    position: ft.position,
  }));

  return (
    <ModeratorEditView
      eventId={eventId}
      eventName={event.name}
      rounds={rounds}
      selectedRoundId={selectedRoundId}
      athletes={athletes}
      judges={judges}
      cards={cards}
      laps={laps}
      finishes={finishes}
    />
  );
}
