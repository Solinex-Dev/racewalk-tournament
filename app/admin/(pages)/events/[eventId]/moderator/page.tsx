import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ModeratorView,
  type EventInfo,
  type RoundData,
  type AthleteSummary,
  type JudgeSummary,
  type ActivityLogItem,
  type PendingRedCard,
  type RoundStatus,
} from "@/components/moderator/moderator-view";

type Props = { params: Promise<{ eventId: string }> };

const POSITION_LABEL: Record<string, string> = {
  JUDGE: "กรรมการ",
  HEAD_JUDGE: "หัวหน้ากรรมการ",
  EVENT_LOGGER: "เก็บ Lap Time",
  TIMEKEEPER: "จับเวลา",
};

function formatThaiDate(dt: Date) {
  return dt.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

function formatTime(dt: Date) {
  return dt.toTimeString().slice(0, 8);
}

function formatDateLabel(dt: Date) {
  return dt.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}

function symbolForCard(symbol: "LIFTED_FOOT" | "BENT_KNEE"): "~" | ">" {
  return symbol === "LIFTED_FOOT" ? "~" : ">";
}

function symbolLabel(symbol: "LIFTED_FOOT" | "BENT_KNEE"): string {
  return symbol === "LIFTED_FOOT" ? "ยกเท้า" : "เข่างอ";
}

// Human-readable verb for a RoundActivityLog.actionType (the `details` column
// carries the specific value, e.g. "Lap 5 - 00:12:34", so these stay generic).
const ACTION_LABEL: Record<string, string> = {
  round_start: "เริ่มรอบการแข่งขัน",
  round_end: "จบรอบการแข่งขัน",
  athlete_dq: "ตัดสิทธิ์ (DQ)",
  lap_time: "บันทึกเวลา Lap",
  finish_time: "บันทึกเวลาเข้าเส้นชัย",
  yellow_card: "ให้ใบเหลือง",
  red_card: "ให้ใบแดง",
  red_card_confirm: "ยืนยันใบแดง",
  red_card_override: "ยกเลิกใบแดง",
  moderator_delete_card: "ลบใบ (Moderator)",
  moderator_override_status: "แก้สถานะนักกีฬา (Moderator)",
  moderator_edit_lap: "แก้เวลา Lap (Moderator)",
  moderator_delete_lap: "ลบ Lap (Moderator)",
  moderator_edit_finish: "แก้เวลาเข้าเส้นชัย (Moderator)",
  moderator_delete_finish: "ลบเวลาเข้าเส้นชัย (Moderator)",
  other: "เหตุการณ์",
};

function actionLabel(actionType: string): string {
  return ACTION_LABEL[actionType] ?? actionType;
}

export default async function ModeratorPage(props: Props) {
  const { eventId } = await props.params;

  const event = await prisma.event.findUnique({
    where: { id: eventId, deletedAt: null },
    include: {
      rounds: {
        where: { deletedAt: null },
        orderBy: { scheduledTime: "asc" },
        include: {
          roundAthletes: {
            where: { deletedAt: null },
            include: {
              athlete: {
                include: { affiliation: { select: { name: true } } },
              },
            },
            orderBy: [{ position: "asc" }, { bib: "asc" }],
          },
          roundOfficials: {
            where: { deletedAt: null },
            include: { judge: { select: { name: true } } },
          },
          cards: {
            where: { deletedAt: null },
            include: { athlete: { select: { name: true } }, judge: { select: { name: true } } },
          },
          activityLogs: {
            where: { deletedAt: null },
            orderBy: { timestamp: "asc" },
          },
        },
      },
    },
  });

  if (!event) notFound();
  if (event.status === "DRAFT") {
    redirect(`/admin/events/${eventId}`);
  }

  const eventInfo: EventInfo = {
    id: event.id,
    name: event.name,
    date: formatThaiDate(event.date),
    location: event.location,
    status: event.status.toLowerCase() as EventInfo["status"],
    currentRoundId: event.rounds.find((r) => r.status === "ONGOING")?.id,
  };

  const rounds: RoundData[] = event.rounds.map((r) => {
    // Map judgeId → zone for this round (cards only carry judge name)
    const zoneByJudgeId = new Map(
      r.roundOfficials.map((ro) => [ro.judgeId, ro.zone ?? ""]),
    );

    // Build athlete summaries with card counts + per-card breakdown
    const athletes: AthleteSummary[] = r.roundAthletes.map((ra) => {
      const yellowCount = r.cards.filter(
        (c) => c.athleteId === ra.athleteId && c.color === "YELLOW",
      ).length;
      const redCount = r.cards.filter(
        (c) =>
          c.athleteId === ra.athleteId &&
          c.color === "RED" &&
          c.state === "CONFIRMED",
      ).length;

      // All cards for this athlete, newest first, with judge + zone + state
      const cardDetails = r.cards
        .filter((c) => c.athleteId === ra.athleteId)
        .sort((a, b) => a.issuedAt.getTime() - b.issuedAt.getTime())
        .map((c) => ({
          id: c.id,
          color: c.color,
          symbol: symbolForCard(c.symbol),
          symbolLabel: symbolLabel(c.symbol),
          state: c.state,
          judgeName: c.judge.name,
          judgeZone: zoneByJudgeId.get(c.judgeId) ?? "",
          time: formatTime(c.issuedAt),
        }));

      return {
        bib: ra.bib,
        name: ra.athlete.name,
        affiliation: ra.athlete.affiliation?.name ?? "",
        country: ra.athlete.country,
        yellowCards: yellowCount,
        redCards: redCount,
        status: ra.status,
        position: ra.position ?? undefined,
        cardDetails,
      };
    });

    // Build judge summaries
    const judges: JudgeSummary[] = r.roundOfficials.map((ro) => ({
      id: ro.judgeId,
      name: ro.judge.name,
      position: POSITION_LABEL[ro.position] ?? ro.position,
      zone: ro.zone ?? "",
      roundId: r.id,
    }));

    // Build card-based activity log entries (derived from cards) + log entries
    const cardLogs: ActivityLogItem[] = r.cards.map((c) => ({
      id: `card-${c.id}`,
      timestamp: c.issuedAt.toISOString(),
      time: formatTime(c.issuedAt),
      date: formatDateLabel(c.issuedAt),
      actor: c.judge.name,
      actorId: c.judgeId,
      role: "judge",
      action: c.color === "YELLOW" ? "ให้ใบเหลือง" : "ให้ใบแดง",
      actionType: c.color === "YELLOW" ? "yellow_card" : "red_card",
      targetAthlete: c.athlete.name,
      targetBib: r.roundAthletes.find((ra) => ra.athleteId === c.athleteId)?.bib,
      roundId: r.id,
      details: symbolLabel(c.symbol),
      symbol: symbolForCard(c.symbol),
    }));

    // Resolve athlete display name from targetAthleteId (lap/finish/dq/dnf logs
    // only store the id, not the name).
    const athleteNameById = new Map(
      r.roundAthletes.map((ra) => [ra.athleteId, ra.athlete.name]),
    );

    const normalLogs: ActivityLogItem[] = r.activityLogs
      // yellow_card / red_card issuance is already shown via cardLogs (derived from
      // Card rows) — skip the raw log entries so each card appears only once.
      .filter((log) => log.actionType !== "yellow_card" && log.actionType !== "red_card")
      .map((log) => {
      const label = actionLabel(log.actionType);
      // Avoid showing the same text twice when details merely repeats the label.
      const detailText =
        log.details && log.details.trim() !== label ? log.details : undefined;
      return {
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        time: formatTime(log.timestamp),
        date: formatDateLabel(log.timestamp),
        actor: log.actorName,
        actorId: log.actorId,
        role: log.actorRole === "MODERATOR" ? "moderator" : "judge",
        action: label,
        actionType: log.actionType || "other",
        targetAthlete: log.targetAthleteId
          ? athleteNameById.get(log.targetAthleteId)
          : undefined,
        targetBib: log.targetBib ?? undefined,
        roundId: r.id,
        details: detailText,
      };
    });

    // Pending red cards
    const pendingRedCards: PendingRedCard[] = r.cards
      .filter((c) => c.color === "RED" && c.state === "PENDING")
      .map((c) => {
        const ra = r.roundAthletes.find((ra) => ra.athleteId === c.athleteId);
        const ro = r.roundOfficials.find((ro) => ro.judgeId === c.judgeId);
        return {
          id: c.id,
          roundId: r.id,
          judgeId: c.judgeId,
          judgeName: c.judge.name,
          judgeZone: ro?.zone ?? "",
          targetBib: ra?.bib ?? "?",
          targetAthlete: c.athlete.name,
          symbol: symbolForCard(c.symbol),
          time: formatTime(c.issuedAt),
        };
      });

    return {
      info: {
        id: r.id,
        name: r.name,
        status: r.status.toLowerCase() as RoundStatus,
        distance_km: r.distanceKm ?? undefined,
        scheduled_time: r.scheduledTime?.toISOString(),
        expected_end_time: r.expectedEndTime?.toISOString(),
        started_at: r.startedAt?.toISOString(),
        ended_at: r.endedAt?.toISOString(),
        note: r.note ?? undefined,
        heat_name: r.heatName ?? undefined,
        lapCount: r.lapCount ?? undefined,
        currentLap: r.currentLap,
      },
      athletes,
      judges,
      logs: [...cardLogs, ...normalLogs],
      pendingRedCards,
    };
  });

  return <ModeratorView eventId={eventId} event={eventInfo} rounds={rounds} />;
}
