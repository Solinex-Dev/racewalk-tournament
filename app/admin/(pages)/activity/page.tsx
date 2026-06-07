import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";
import { NoAccess } from "@/components/admin/no-access";
import { getCurrentAdmin } from "@/lib/authz";
import { hasPermission } from "@/lib/permissions";
import {
  activityActionLabel,
  activityDetailText,
  entityTypeLabel,
} from "@/lib/activity-log-labels";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ประวัติการใช้งาน – การแข่งขันเดินทน",
  description: "บันทึกการกระทำของผู้ดูแลระบบทั้งหมด (audit trail)",
};

const PAGE_SIZE = 50;

type Props = { searchParams: Promise<{ page?: string }> };

function fmt(dt: Date): string {
  return dt.toLocaleString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default async function ActivityLogPage(props: Readonly<Props>) {
  const me = await getCurrentAdmin();
  if (!hasPermission(me, "admins", "view")) return <NoAccess />;

  const { page: pageParam } = await props.searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  // Non-root admins must not see activity performed BY a root admin. Root admins
  // see everything. The same filter is applied to count and findMany so the total
  // and pagination stay consistent with the rows the viewer is allowed to see.
  const where = me?.isRoot ? {} : { user: { isRoot: false } };

  const [total, rows] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <PageBreadcrumb
          items={[{ label: "แดชบอร์ด", href: "/admin" }, { label: "ประวัติการใช้งาน" }]}
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">ประวัติการใช้งาน</h1>
          <p className="mt-1 text-sm text-slate-600">
            บันทึกการกระทำของผู้ดูแลระบบทั้งหมด — ใครทำอะไร เมื่อไหร่ (ทั้งหมด {total.toLocaleString("th-TH")} รายการ)
          </p>
        </div>

        <Card className="overflow-hidden rounded-2xl border-slate-200">
          <CardContent className="p-0">
            <div className="min-w-full overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">เวลา</th>
                    <th className="px-4 py-3 text-left">ผู้ใช้</th>
                    <th className="px-4 py-3 text-left">การกระทำ</th>
                    <th className="px-4 py-3 text-left">รายการ</th>
                    <th className="px-4 py-3 text-left">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                        ยังไม่มีบันทึกการใช้งาน
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => {
                      const detail = activityDetailText(r.details);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80">
                          <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-slate-500 text-nowrap">
                            {fmt(r.createdAt)}
                          </td>
                          <td className="px-4 py-2.5 text-xs font-medium text-slate-800 text-nowrap">
                            {r.user?.name?.trim() || r.user?.email || "—"}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-700 text-nowrap">
                            {activityActionLabel(r.action)}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-600 text-nowrap">
                            {entityTypeLabel(r.entityType)}
                            {r.entityId ? (
                              <span className="ml-1 font-mono text-[10px] text-slate-400 text-nowrap">
                                {r.entityId.slice(0, 10)}
                              </span>
                            ) : null}
                          </td>
                          <td className="max-w-xs truncate px-4 py-2.5 text-xs text-slate-500 text-nowrap">
                            {detail || "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-600">
                  หน้า {page} จาก {totalPages}
                </p>
                <div className="flex gap-2">
                  <Link href={`/admin/activity?page=${Math.max(1, page - 1)}`} aria-disabled={page <= 1}>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      className="h-8 rounded-lg text-xs"
                    >
                      <ChevronLeft className="h-4 w-4" /> 
                    </Button>
                  </Link>
                  <Link
                    href={`/admin/activity?page=${Math.min(totalPages, page + 1)}`}
                    aria-disabled={page >= totalPages}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      className="h-8 rounded-lg text-xs"
                    >
                       <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
