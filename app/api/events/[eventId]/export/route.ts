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
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ eventId: string }> };

function escapeCsv(field: string | number | null | undefined): string {
  if (field === null || field === undefined) return "";
  const s = String(field);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
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
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { eventId } = await ctx.params;
  const url = new URL(request.url);
  const roundFilter = url.searchParams.get("round");

  const event = await prisma.event.findUnique({
    where: { id: eventId, deletedAt: null },
    include: {
      rounds: {
        where: {
          deletedAt: null,
          ...(roundFilter ? { id: roundFilter } : {}),
        },
        orderBy: { scheduledTime: "asc" },
        include: {
          roundAthletes: {
            where: { deletedAt: null },
            include: { athlete: { include: { affiliation: { select: { name: true } } } } },
            orderBy: [{ position: "asc" }, { bib: "asc" }],
          },
          cards: { where: { deletedAt: null } },
          finishTimes: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!event) return new NextResponse("Not found", { status: 404 });

  const lines: string[] = [];

  // Header section
  lines.push(escapeCsv(`Event,${event.name}`));
  lines.push(escapeCsv(`Date,${event.date.toISOString().slice(0, 10)}`));
  lines.push(escapeCsv(`Location,${event.location}`));
  lines.push(escapeCsv(`Status,${event.status}`));
  lines.push("");

  for (const round of event.rounds) {
    lines.push(`Round,${escapeCsv(round.name)}`);
    lines.push(`Status,${round.status}`);
    if (round.distanceKm) lines.push(`Distance (km),${escapeCsv(round.distanceKm)}`);
    if (round.startedAt) lines.push(`Started at,${round.startedAt.toISOString()}`);
    if (round.endedAt) lines.push(`Ended at,${round.endedAt.toISOString()}`);
    lines.push("");

    // Athlete table for this round
    lines.push(
      [
        "BIB",
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
      const yellow = round.cards.filter((c) => c.athleteId === ra.athleteId && c.color === "YELLOW").length;
      const confirmedRed = round.cards.filter(
        (c) => c.athleteId === ra.athleteId && c.color === "RED" && c.state === "CONFIRMED",
      ).length;
      const pendingRed = round.cards.filter(
        (c) => c.athleteId === ra.athleteId && c.color === "RED" && c.state === "PENDING",
      ).length;
      const finish = round.finishTimes.find((f) => f.athleteId === ra.athleteId);

      lines.push(
        [
          ra.bib,
          ra.athlete.name,
          ra.athlete.country,
          ra.athlete.affiliation?.name ?? "",
          ra.status,
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
    lines.push("");
    lines.push("");
  }

  const csv = "﻿" + lines.join("\r\n"); // UTF-8 BOM for Excel
  const safeName = event.name.replace(/[^a-zA-Z0-9_฀-๿-]/g, "_");
  const filename = `${safeName}-results.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
