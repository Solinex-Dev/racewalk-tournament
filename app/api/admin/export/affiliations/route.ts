/**
 * CSV export of all affiliations — ROOT ADMIN only. Round-trip-safe.
 *
 * GET /api/admin/export/affiliations
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/authz";
import { attachmentContentDisposition } from "@/lib/content-disposition";
import { toCsv } from "@/lib/csv/serialize";
import { bangkokDateISO } from "@/lib/datetime";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = [
  "id", "name", "country", "province",
  "head_judge_id", "head_judge_name", "joined_at", "note",
] as const;

export async function GET() {
  const me = await getCurrentAdmin();
  if (!me?.isRoot) return new NextResponse("Forbidden", { status: 403 });

  const rows = await prisma.affiliation.findMany({
    where: { deletedAt: null },
    include: { headJudge: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  const csv = toCsv(
    HEADERS,
    rows.map((a) => [
      a.id, a.name, a.country, a.province ?? "",
      a.headJudgeId ?? "", a.headJudge?.name ?? "",
      a.joinedAt ? bangkokDateISO(a.joinedAt) : "", a.note ?? "",
    ]),
  );

  await logCurrentAdmin(ActivityLogAction.AFFILIATIONS_EXPORTED, "Affiliation", "*", { count: rows.length });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": attachmentContentDisposition(`affiliations-${bangkokDateISO(new Date())}.csv`),
      "Cache-Control": "no-store",
    },
  });
}
