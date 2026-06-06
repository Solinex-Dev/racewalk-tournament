/**
 * CSV export of full event results — all rounds, all athletes, all key stats.
 * Returns UTF-8 with BOM so Excel opens Thai correctly.
 *
 * GET /api/events/:eventId/export             → full event
 * GET /api/events/:eventId/export?round=ID    → single round
 *
 * Admin-only.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/authz";
import { hasPermission } from "@/lib/permissions";
import { attachmentContentDisposition } from "@/lib/content-disposition";
import { metersFromKm } from "@/lib/distance";
import {
  parseAgeGroupsParam,
  bibMatchesAgeGroups,
  bibAgeStart,
  ageGroupLabel,
} from "@/lib/bib";

type Ctx = { params: Promise<{ eventId: string }> };

function escapeCsv(field: string | number | null | undefined): string {
  if (field === null || field === undefined) return "";
  const s = String(field);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export async function GET(request: Request, ctx: Ctx) {
  const me = await getCurrentAdmin();
  if (!hasPermission(me, "reports", "view")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { eventId } = await ctx.params;
  const url = new URL(request.url);
  const roundFilter = url.searchParams.get("round");
  const ageGroups = parseAgeGroupsParam(url.searchParams.get("ageGroups"));

  const [event, rawEventAthletes] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      include: {
        rounds: {
          // Only FINISHED rounds are exportable — skip rounds still in progress.
          where: {
            deletedAt: null,
            status: "FINISHED",
            ...(roundFilter ? { id: roundFilter } : {}),
          },
          orderBy: { scheduledTime: "asc" },
          include: {
            roundAthletes: {
              where: { deletedAt: null },
              include: { athlete: { include: { affiliation: { select: { name: true } } } } },
              orderBy: [{ position: "asc" }, { athleteId: "asc" }],
            },
            cards: { where: { deletedAt: null } },
            finishTimes: { where: { deletedAt: null } },
          },
        },
      },
    }),
    prisma.eventAthlete.findMany({
      where: { eventId, deletedAt: null },
      select: { athleteId: true, bib: true },
    }),
  ]);

  if (!event) return new NextResponse("Not found", { status: 404 });

  // Nothing finished to export (unfinished per-round request, or no finished rounds).
  if (event.rounds.length === 0) {
    return new NextResponse(
      roundFilter
        ? "รอบนี้ยังแข่งไม่เสร็จ จึงยังไม่สามารถ export รายงานได้"
        : "ยังไม่มีรอบที่แข่งเสร็จสำหรับออกรายงาน",
      { status: 403 },
    );
  }

  const bibMap = new Map(rawEventAthletes.map((ea) => [ea.athleteId, ea.bib]));

  const lines: string[] = [];

  // Header section
  lines.push(
    escapeCsv(`Event,${event.name}`),
    escapeCsv(`Date,${event.date.toISOString().slice(0, 10)}`),
    escapeCsv(`Location,${event.location}`),
    escapeCsv(`Status,${event.status}`),
  );
  if (ageGroups.length > 0) {
    lines.push(escapeCsv(`Age Groups,${ageGroups.map(ageGroupLabel).join(" / ")}`));
  }
  lines.push("");

  for (const round of event.rounds) {
    lines.push(`Round,${escapeCsv(round.name)}`, `Status,${round.status}`);
    if (round.distanceKm) lines.push(`Distance (m),${escapeCsv(metersFromKm(round.distanceKm))}`);
    if (round.startedAt) lines.push(`Started at,${round.startedAt.toISOString()}`);
    if (round.endedAt) lines.push(`Ended at,${round.endedAt.toISOString()}`);
    // Athlete table for this round
    lines.push(
      "",
      [
        "BIB",
        "Age Group",
        "Name",
        "Country",
        "Affiliation",
        "Status",
        "Position",
        "Yellow Cards",
        "Confirmed Reds",
        "Pending Reds",
        "Finish Time",
      ]
        .map(escapeCsv)
        .join(","),
    );

    for (const ra of round.roundAthletes) {
      const bib = bibMap.get(ra.athleteId) ?? "?";
      if (!bibMatchesAgeGroups(bib, ageGroups)) continue;

      const yellow = round.cards.filter((c) => c.athleteId === ra.athleteId && c.color === "YELLOW").length;
      const confirmedRed = round.cards.filter(
        (c) => c.athleteId === ra.athleteId && c.color === "RED" && c.state === "CONFIRMED",
      ).length;
      const pendingRed = round.cards.filter(
        (c) => c.athleteId === ra.athleteId && c.color === "RED" && c.state === "PENDING",
      ).length;
      const finish = round.finishTimes.find((f) => f.athleteId === ra.athleteId);
      const ageStart = bibAgeStart(bib);
      // Show the DQ rule code in the Status column when present; otherwise the
      // plain status ("Other"/free-text DQ and auto-DQ fall back to "DQ").
      const statusCell =
        ra.status === "DQ" && ra.dqReasonCode ? ra.dqReasonCode : ra.status;

      lines.push(
        [
          bib,
          ageStart !== null ? ageGroupLabel(ageStart) : "",
          ra.athlete.name,
          ra.athlete.country,
          ra.athlete.affiliation?.name ?? "",
          statusCell,
          ra.position ?? "",
          yellow,
          confirmedRed,
          pendingRed,
          formatMs(finish?.timeMs),
        ]
          .map(escapeCsv)
          .join(","),
      );
    }
    lines.push("", "");
  }

  const csv = "﻿" + lines.join("\r\n"); // UTF-8 BOM for Excel
  const filename = `${event.name}-results.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": attachmentContentDisposition(filename),
    },
  });
}
