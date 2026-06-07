import type { Metadata } from "next";
import type { ReactNode } from "react";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Card, CardContent } from "@/components/ui/card";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";
import { NoAccess } from "@/components/admin/no-access";
import { getCurrentAdmin } from "@/lib/authz";
import { getChangelog } from "@/lib/changelog";
import { ChangelogTable } from "@/components/admin/changelog-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About – การแข่งขันเดินทน",
  description: "ข้อมูลแอปพลิเคชันจาก environment (เฉพาะ Root Admin)",
};

function fmtDateTime(dt: Date): string {
  return dt.toLocaleString("th-TH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Last deploy = explicit DEPLOYED_AT, else the build artifact's mtime, else unknown. */
async function resolveDeployedAt(): Promise<Date | null> {
  const explicit = process.env.DEPLOYED_AT?.trim();
  if (explicit) {
    const d = new Date(explicit);
    if (!Number.isNaN(d.getTime())) return d;
  }
  try {
    const s = await stat(path.join(process.cwd(), ".next", "BUILD_ID"));
    return s.mtime;
  } catch {
    return null;
  }
}

export default async function AboutPage() {
  const me = await getCurrentAdmin();
  if (!me?.isRoot) return <NoAccess />;

  const changelog = getChangelog();

  const appName = (process.env.APP_NAME || "").trim();
  const appVersion = (process.env.APP_VERSION || "").trim();
  const deployedAt = await resolveDeployedAt();
  const nodeEnv = (process.env.NODE_ENV || "").trim();

  const rows: { label: string; value: ReactNode }[] = [
    {
      label: "Application",
      value: appName || <span className="text-slate-400">— ไม่ได้ตั้งค่า</span>,
    },
    {
      label: "Version",
      value: appVersion ? (
        <span className="font-mono">{appVersion}</span>
      ) : (
        <span className="text-slate-400">— ไม่ได้ตั้งค่า</span>
      ),
    },
    {
      label: "Deploy Date",
      value: deployedAt ? (
        fmtDateTime(deployedAt)
      ) : (
        <span className="text-slate-400">— ไม่ทราบ (ยังไม่ได้ build หรือไม่ได้ตั้ง DEPLOYED_AT)</span>
      ),
    },
    {
      label: "Environment",
      value: <span className="font-mono text-slate-500">{nodeEnv || "—"}</span>,
    },
  ];

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <PageBreadcrumb items={[{ label: "แดชบอร์ด", href: "/admin" }, { label: "About" }]} />

        <div className="flex items-center gap-3">
          
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">About</h1>
          </div>
        </div>

        <Card className="overflow-hidden rounded-2xl border-slate-200">
          <CardContent className="p-0">
            <dl className="divide-y divide-slate-100">
              {rows.map((r) => (
                <div key={r.label} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
                  <dt className="w-full text-sm font-medium text-slate-600 sm:w-72">{r.label}</dt>
                  <dd className="text-sm text-slate-900">{r.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Changelog
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Notable changes version
            </p>
          </div>
          <ChangelogTable entries={changelog} />
        </section>

        {/* <p className="text-xs text-slate-400">
          ค่าทั้งหมดอ่านจากตัวแปร environment ของเซิร์ฟเวอร์ขณะรัน — แก้ไขได้ที่ไฟล์ <span className="font-mono">.env</span>
        </p> */}
      </div>
    </main>
  );
}
