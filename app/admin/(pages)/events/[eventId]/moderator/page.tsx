import { notFound } from "next/navigation";
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

  const eventInfo: EventInfo = {
    id: event.id,
    name: event.name,
    date: formatThaiDate(event.date),
    location: event.location,
    status: event.status.toLowerCase() as EventInfo["status"],
    currentRoundId: event.rounds.find((r) => r.status === "ONGOING")?.id,
  };

  const rounds: RoundData[] = event.rounds.map((r) => {
    // Build athlete summaries with card counts
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
      return {
        bib: ra.bib,
        name: ra.athlete.name,
        affiliation: ra.athlete.affiliation?.name ?? "",
        country: ra.athlete.country,
        yellowCards: yellowCount,
        redCards: redCount,
        status: ra.status,
        position: ra.position ?? undefined,
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

    const normalLogs: ActivityLogItem[] = r.activityLogs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      time: formatTime(log.timestamp),
      date: formatDateLabel(log.timestamp),
      actor: log.actorName,
      actorId: log.actorId,
      role: log.actorRole === "MODERATOR" ? "moderator" : "judge",
      action: log.details ?? log.actionType,
      actionType: log.actionType || "other",
      targetBib: log.targetBib ?? undefined,
      roundId: r.id,
      details: log.details ?? undefined,
    }));

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
