import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { compareAthletesByFinish } from "@/lib/athlete-sort";
import { NoAccess } from "@/components/admin/no-access";
import { getCurrentAdmin } from "@/lib/authz";
import { hasPermission } from "@/lib/permissions";
import {
  ModeratorEditView,
  type EditAthlete,
  type EditCard,
  type EditJudge,
  type EditLap,
  type EditFinish,
  type EditRoundOption,
  type EditRoundInfo,
  type EditLogItem,
} from "@/components/moderator/moderator-edit-view";

export const metadata: Metadata = {
  title: "Moderator Edit – การแข่งขันเดินทน",
  description: "หน้าแก้ไขข้อมูลการแข่งขัน (correction mode) สำหรับ admin",
};

type Props = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ round?: string }>;
};

const ACTION_LABEL: Record<string, string> = {
  round_start: "เริ่มรอบการแข่งขัน",
  round_end: "จบรอบการแข่งขัน",
  athlete_dq: "ตัดสิทธิ์ (DQ)",
  athlete_dnf: "ไม่จบการแข่งขัน (DNF)",
  lap_time: "บันทึกเวลา Lap",
  finish_time: "บันทึกเวลาเข้าเส้นชัย",
  yellow_card: "ให้ใบเหลือง",
  red_card: "ให้ใบแดง",
  red_card_confirm: "ยืนยันใบแดง",
  red_card_override: "ยกเลิกใบแดง",
  moderator_delete_card: "ลบใบ (แก้ไข)",
  moderator_confirm_red: "ยืนยันใบแดง (แก้ไข)",
  moderator_reject_red: "ยกเลิกใบแดง (แก้ไข)",
  moderator_edit_card: "แก้ไขใบ (แก้ไข)",
  moderator_override_status: "แก้สถานะนักกีฬา (แก้ไข)",
  moderator_edit_lap: "แก้เวลา Lap (แก้ไข)",
  moderator_delete_lap: "ลบ Lap (แก้ไข)",
  moderator_edit_finish: "แก้เวลาเข้าเส้นชัย (แก้ไข)",
  moderator_delete_finish: "ลบเวลาเข้าเส้นชัย (แก้ไข)",
  moderator_edit_finish_position: "แก้อันดับ (แก้ไข)",
  moderator_edit_round: "แก้ข้อมูลรอบ (แก้ไข)",
};

const ACTOR_ROLE_LABEL: Record<string, string> = {
  JUDGE: "กรรมการ",
  HEAD_JUDGE: "หัวหน้ากรรมการ",
  EVENT_LOGGER: "ผู้เก็บ Lap Time",
  MODERATOR: "ผู้ดูแล",
  ADMIN: "ผู้ดูแลระบบ",
};

export default async function ModeratorEditPage(props: Readonly<Props>) {
  const { eventId } = await props.params;
  const search = await props.searchParams;

  const me = await getCurrentAdmin();
  if (!hasPermission(me, "moderator", "view")) return <NoAccess />;

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
        logs={[]}
        roundInfo={null}
      />
    );
  }

  const [round, rawEventAthletes] = await Promise.all([
    prisma.round.findUnique({
      where: { id: selectedRoundId },
      include: {
        roundAthletes: {
          where: { deletedAt: null },
          include: { athlete: { select: { id: true, name: true } } },
          orderBy: [{ position: "asc" }, { athleteId: "asc" }],
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
      activityLogs: {
        where: { deletedAt: null },
        orderBy: { timestamp: "desc" },
        take: 100,
      },
    },
  }),
    prisma.eventAthlete.findMany({
      where: { eventId, deletedAt: null },
      select: { athleteId: true, bib: true },
    }),
  ]);

  if (!round) notFound();

  // BIB is stored at Event level — build lookup maps for use throughout this page.
  const bibByAthleteId = new Map(rawEventAthletes.map((ea) => [ea.athleteId, ea.bib]));
  const zoneByJudgeId = new Map(round.roundOfficials.map((ro) => [ro.judgeId, ro.zone ?? ""]));

  const athletes: EditAthlete[] = round.roundAthletes.map((ra) => ({
    id: ra.athleteId,
    bib: bibByAthleteId.get(ra.athleteId) ?? "?",
    name: ra.athlete.name,
    status: ra.status,
    position: ra.position,
  }));

  // Finish-order sort — identical to the public leaderboard (lib/athlete-sort)
  const finishedAthleteIds = new Set(round.finishTimes.map((f) => f.athleteId));
  const lapsByAthlete = new Map<string, number>();
  for (const l of round.lapTimes) {
    lapsByAthlete.set(l.athleteId, (lapsByAthlete.get(l.athleteId) ?? 0) + 1);
  }
  athletes.sort((a, b) =>
    compareAthletesByFinish(
      {
        status: a.status,
        position: a.position,
        isFinished: finishedAthleteIds.has(a.id),
        currentLap: (lapsByAthlete.get(a.id) ?? 0) + (finishedAthleteIds.has(a.id) ? 1 : 0),
        bib: a.bib,  // already resolved from bibByAthleteId above
      },
      {
        status: b.status,
        position: b.position,
        isFinished: finishedAthleteIds.has(b.id),
        currentLap: (lapsByAthlete.get(b.id) ?? 0) + (finishedAthleteIds.has(b.id) ? 1 : 0),
        bib: b.bib,  // already resolved from bibByAthleteId above
      },
    ),
  );

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

  const athleteNameById = new Map(
    round.roundAthletes.map((ra) => [ra.athleteId, ra.athlete.name]),
  );

  const logs: EditLogItem[] = round.activityLogs.map((log) => {
    const label = ACTION_LABEL[log.actionType] ?? log.actionType;
    return {
      id: log.id,
      time: log.timestamp.toTimeString().slice(0, 8),
      date: log.timestamp.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
      }),
      actorName: log.actorName,
      actorRoleLabel: ACTOR_ROLE_LABEL[log.actorRole] ?? log.actorRole,
      actionLabel: label,
      targetBib: log.targetBib ?? undefined,
      targetAthlete: log.targetAthleteId
        ? athleteNameById.get(log.targetAthleteId)
        : undefined,
      details: log.details && log.details.trim() !== label ? log.details : undefined,
    };
  });

  const roundInfo: EditRoundInfo = {
    name: round.name,
    distanceKm: round.distanceKm ?? "",
    lapCount: round.lapCount,
    startedAt: round.startedAt?.toISOString() ?? null,
    endedAt: round.endedAt?.toISOString() ?? null,
    scheduledTime: round.scheduledTime?.toISOString() ?? null,
    status: round.status,
  };

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
      logs={logs}
      roundInfo={roundInfo}
    />
  );
}
