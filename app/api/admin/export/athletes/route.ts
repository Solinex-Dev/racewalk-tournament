/**
 * CSV export of all athletes — ROOT ADMIN only.
 * Emits lossless canonical values (raw ISO country code, canonical Thai province)
 * plus FK id + human name, so the file round-trips back through CSV import.
 *
 * GET /api/admin/export/athletes
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
  "id", "prefix", "first_name", "middle_name", "last_name",
  "country", "province", "club", "affiliation_id", "affiliation_name", "note",
] as const;

export async function GET() {
  const me = await getCurrentAdmin();
  if (!me?.isRoot) return new NextResponse("Forbidden", { status: 403 });

  const rows = await prisma.athlete.findMany({
    where: { deletedAt: null },
    include: { affiliation: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  const csv = toCsv(
    HEADERS,
    rows.map((a) => [
      a.id, a.prefix ?? "", a.firstName ?? "", a.middleName ?? "", a.lastName ?? "",
      a.country, a.province ?? "", a.club ?? "",
      a.affiliationId ?? "", a.affiliation?.name ?? "", a.note ?? "",
    ]),
  );

  await logCurrentAdmin(ActivityLogAction.ATHLETES_EXPORTED, "Athlete", "*", { count: rows.length });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": attachmentContentDisposition(`athletes-${bangkokDateISO(new Date())}.csv`),
      "Cache-Control": "no-store",
    },
  });
}
