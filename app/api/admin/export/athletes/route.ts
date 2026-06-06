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
import { CSV_HEADERS } from "@/lib/csv/import-types";
import { bangkokDateISO } from "@/lib/datetime";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentAdmin();
  if (!me?.isRoot) return new NextResponse("Forbidden", { status: 403 });

  const rows = await prisma.athlete.findMany({
    where: { deletedAt: null },
    include: { affiliation: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  const csv = toCsv(
    CSV_HEADERS.athlete,
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
