/**
 * CSV export of all judges — ROOT ADMIN only. Round-trip-safe (see athletes route).
 *
 * GET /api/admin/export/judges
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

  const rows = await prisma.judge.findMany({
    where: { deletedAt: null },
    include: {
      organization: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  const csv = toCsv(
    CSV_HEADERS.judge,
    rows.map((j) => [
      j.id, j.prefix ?? "", j.firstName ?? "", j.middleName ?? "", j.lastName ?? "",
      j.country, j.province ?? "", j.status,
      j.organizationId ?? "", j.organization?.name ?? "",
      j.departmentId ?? "", j.department?.name ?? "", j.note ?? "",
    ]),
  );

  await logCurrentAdmin(ActivityLogAction.JUDGES_EXPORTED, "Judge", "*", { count: rows.length });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": attachmentContentDisposition(`judges-${bangkokDateISO(new Date())}.csv`),
      "Cache-Control": "no-store",
    },
  });
}
