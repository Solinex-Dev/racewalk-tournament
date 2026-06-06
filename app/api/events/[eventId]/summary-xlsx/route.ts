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
import { getCurrentAdmin } from "@/lib/authz";
import { hasPermission } from "@/lib/permissions";
import { loadEventSummary } from "@/lib/report/summary-sheet";
import { buildSummaryWorkbook } from "@/lib/report/summary-xlsx";
import { attachmentContentDisposition } from "@/lib/content-disposition";
import { parseAgeGroupsParam } from "@/lib/bib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ eventId: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const me = await getCurrentAdmin();
  if (!hasPermission(me, "reports", "view")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { eventId } = await ctx.params;
  const params = new URL(request.url).searchParams;
  const roundFilter = params.get("round") ?? undefined;
  const ageGroups = parseAgeGroupsParam(params.get("ageGroups"));

  const summary = await loadEventSummary(eventId, roundFilter, ageGroups);
  if (!summary) return new NextResponse("Not found", { status: 404 });

  // Block export when there is nothing finished to export (per-round request for an
  // unfinished round, or a whole-event request with no finished rounds yet).
  if (summary.rounds.length === 0) {
    return new NextResponse(
      roundFilter
        ? "รอบนี้ยังแข่งไม่เสร็จ จึงยังไม่สามารถ export รายงานได้"
        : "ยังไม่มีรอบที่แข่งเสร็จสำหรับออกรายงาน",
      { status: 403 },
    );
  }

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
