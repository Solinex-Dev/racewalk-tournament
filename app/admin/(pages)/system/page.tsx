import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";
import { NoAccess } from "@/components/admin/no-access";
import { getCurrentAdmin } from "@/lib/authz";
import { sinceDaysAgo } from "@/lib/date-range";
import {
  activityActionLabel,
  activityDetailText,
  entityTypeLabel,
  operationLabel,
  formatUserAgent,
} from "@/lib/activity-log-labels";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "System Monitor – การแข่งขันเดินทน",
  description: "บันทึกการใช้งานระบบทั้งหมด — ใคร ทำอะไร ที่ไหน เมื่อไหร่ อย่างไร (เฉพาะ Root Admin)",
};

const PAGE_SIZE = 50;

const OPERATIONS = ["CREATE", "READ", "UPDATE", "DELETE", "ACTION"] as const;

const OP_BADGE: Record<string, string> = {
  CREATE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  READ: "border-slate-200 bg-slate-100 text-slate-600",
  UPDATE: "border-amber-200 bg-amber-50 text-amber-700",
  DELETE: "border-red-200 bg-red-50 text-red-700",
  ACTION: "border-sky-200 bg-sky-50 text-sky-700",
};

type Props = {
  searchParams: Promise<{
    page?: string;
    op?: string;
    user?: string;
    days?: string;
    q?: string;
  }>;
};

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

const inputCls =
  "h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/5";

export default async function SystemMonitorPage(props: Props) {
  const me = await getCurrentAdmin();
  if (!me?.isRoot) return <NoAccess />;

  const sp = await props.searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const op = sp.op && (OPERATIONS as readonly string[]).includes(sp.op) ? sp.op : "";
  const userId = sp.user || "";
  const days = sp.days || "7";
  const q = (sp.q || "").trim();

  const where: {
    operation?: string;
    userId?: string;
    createdAt?: { gte: Date };
    OR?: Array<{ path?: { contains: string }; action?: { contains: string } }>;
  } = {};
  if (op) where.operation = op;
  if (userId) where.userId = userId;
  if (q) where.OR = [{ path: { contains: q } }, { action: { contains: q } }];
  if (days !== "all") {
    const n = Number(days) || 7;
    where.createdAt = { gte: sinceDaysAgo(n) };
  }

  const [total, rows, admins] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { user: { select: { name: true, email: true, role: true, isRoot: true } } },
    }),
    prisma.user.findMany({
      where: { role: "ADMIN", deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const baseParams = new URLSearchParams();
  if (op) baseParams.set("op", op);
  if (userId) baseParams.set("user", userId);
  if (days) baseParams.set("days", days);
  if (q) baseParams.set("q", q);
  const pageHref = (p: number) => {
    const u = new URLSearchParams(baseParams);
    u.set("page", String(p));
    return `/admin/system?${u.toString()}`;
  };

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <PageBreadcrumb
          items={[{ label: "แดชบอร์ด", href: "/admin" }, { label: "System Monitor" }]}
        />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">System Monitor</h1>
          </div>
        </div>

        {/* Filters (GET form — works without JS, shareable URL) */}
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-4">
            <form method="get" className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">ค้นหา (หน้า / action)</label>
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="เช่น /admin/events, ATHLETE"
                  className={`${inputCls} w-56`}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">ประเภท</label>
                <select name="op" defaultValue={op} className={inputCls}>
                  <option value="">ทั้งหมด</option>
                  {OPERATIONS.map((o) => (
                    <option key={o} value={o}>
                      {operationLabel(o)} ({o})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">ผู้ใช้</label>
                <select name="user" defaultValue={userId} className={`${inputCls} max-w-52`}>
                  <option value="">ทุกคน</option>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name?.trim() || a.email || a.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">ช่วงเวลา</label>
                <select name="days" defaultValue={days} className={inputCls}>
                  <option value="1">24 ชม. ล่าสุด</option>
                  <option value="7">7 วันล่าสุด</option>
                  <option value="30">30 วันล่าสุด</option>
                  <option value="all">ทั้งหมด</option>
                </select>
              </div>
              <Button type="submit" className="h-9 rounded-lg px-4 text-sm">
                กรอง
              </Button>
              <Link
                href="/admin/system"
                className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-4 text-sm text-slate-600 hover:bg-slate-50"
              >
                ล้างตัวกรอง
              </Link>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-slate-200">
          <CardContent className="p-0">
            <div className="min-w-full overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-3 text-left">TIME</th>
                    <th className="px-3 py-3 text-left">USER</th>
                    <th className="px-3 py-3 text-left">METHOD</th>
                    <th className="px-3 py-3 text-left">TYPE</th>
                    <th className="px-3 py-3 text-left">ACTION</th>
                    <th className="px-3 py-3 text-left">PAGE / PATH</th>
                    <th className="px-3 py-3 text-left">IP ADDRESS</th>
                    <th className="px-3 py-3 text-left">DEVICE</th>
                    <th className="px-3 py-3 text-left">DETAILS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                        ไม่พบบันทึกตามตัวกรอง
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => {
                      const detail = activityDetailText(r.details);
                      const entity = entityTypeLabel(r.entityType);
                      return (
                        <tr key={r.id} className="align-top hover:bg-slate-50/80">
                          <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-slate-500">
                            {fmt(r.createdAt)}
                          </td>
                          <td className="px-3 py-2.5 text-xs flex gap-3 text-nowrap">
                            <div className="font-medium text-slate-800">
                              {r.user?.name?.trim() || r.user?.email || "—"}
                            </div>
                            <span
                              className={`mt-0.5 inline-block rounded-full border px-1.5 py-0.5 text-[10px] ${
                                r.user?.isRoot
                                  ? "border-red-200 bg-red-50 text-red-700"
                                  : "border-slate-200 bg-slate-100 text-slate-600"
                              }`}
                            >
                              {r.user?.isRoot ? "Root" : r.user?.role ?? "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                              {r.method ?? "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium text-nowrap ${
                                OP_BADGE[r.operation ?? ""] ?? "border-slate-200 bg-slate-100 text-slate-600"
                              }`}
                            >
                              {operationLabel(r.operation) || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-700 text-nowrap">
                            {activityActionLabel(r.action)}
                            {entity ? (
                              <span className="ml-1 text-[10px] text-slate-400">· {entity}</span>
                            ) : null}
                          </td>
                          <td className="max-w-[18rem] truncate px-3 py-2.5 font-mono text-[11px] text-slate-500" title={r.path ?? ""}>
                            {r.path ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-slate-500">
                            {r.ipAddress ?? "—"}
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-slate-500 text-nowrap" title={r.userAgent ?? ""}>
                            {formatUserAgent(r.userAgent) || "—"}
                          </td>
                          <td
                            className="max-w-[16rem] truncate px-3 py-2.5 text-[11px] text-slate-500 text-wrap"
                            title={r.details ? JSON.stringify(r.details) : ""}
                          >
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
                  <Link href={pageHref(Math.max(1, page - 1))} aria-disabled={page <= 1}>
                    <Button variant="outline" size="sm" disabled={page <= 1} className="h-8 rounded-lg text-xs">
                      <ChevronLeft className="h-4 w-4" /> 
                    </Button>
                  </Link>
                  <Link href={pageHref(Math.min(totalPages, page + 1))} aria-disabled={page >= totalPages}>
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
