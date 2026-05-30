/**
 * Excel (.xlsx) export of the official Race Walking Judges Summary Sheet.
 * One worksheet per round.
 *
 * GET /api/events/:eventId/summary-xlsx            → whole event (sheet per round)
 * GET /api/events/:eventId/summary-xlsx?round=ID   → single round
 *
 * Admin-only. Node runtime (exceljs).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { loadEventSummary } from "@/lib/report/summary-sheet";
import { buildSummaryWorkbook } from "@/lib/report/summary-xlsx";
import { attachmentContentDisposition } from "@/lib/content-disposition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ eventId: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { eventId } = await ctx.params;
  const roundFilter = new URL(request.url).searchParams.get("round") ?? undefined;

  const summary = await loadEventSummary(eventId, roundFilter);
  if (!summary) return new NextResponse("Not found", { status: 404 });

  const wb = await buildSummaryWorkbook(summary);

  // exceljs returns a Node Buffer (a Uint8Array view) — a valid Response body at
  // runtime; cast to ArrayBuffer to satisfy the BodyInit type.
  const body = (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;

  const roundSuffix =
    roundFilter && summary.rounds[0] ? `-${summary.rounds[0].name}` : "";
  const filename = `${summary.name}${roundSuffix}-summary-sheet.xlsx`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": attachmentContentDisposition(filename),
      "Cache-Control": "no-store",
    },
  });
}
