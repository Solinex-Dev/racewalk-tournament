import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Racewalk Tournament",
  description:
    "Landing page ของ Racewalk Tournament แนะนำระบบ, ฟีเจอร์, และลิงก์เข้าส่วนสำคัญ เช่น Event live page, Judger join และ Admin console.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top navigation */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-xs font-semibold text-white">
              RW
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">
                Racewalk Tournament
              </span>
              <span className="text-[11px] text-slate-500">
                Real-time Judging &amp; Scoreboard
              </span>
            </div>
          </div>

          {/* Language toggle (UI only for now) */}
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-1 text-xs font-medium text-slate-600">
            <button className="rounded-full bg-white px-3 py-1 shadow-sm">
              TH
            </button>
            <button className="rounded-full px-3 py-1 text-slate-500">
              EN
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-20 pt-10 sm:px-6 lg:flex-row lg:items-start lg:px-8 lg:pt-16">
        {/* Hero section */}
        <section className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
            ระบบจัดการแข่งขันเดินทนสำหรับสนามแข่งจริง
            <span className="h-1 w-1 rounded-full bg-sky-500" />
            รองรับกรรมการหลายคนแบบ Real-time
          </div>

          <div className="space-y-4">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              ติดตามผลการแข่งขันเดินทนแบบ{" "}
              <span className="text-sky-600">Real-time</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              ระบบ Racewalk Tournament ช่วยให้สนามแข่งขัน, กรรมการ และผู้ชม
              เห็นคะแนนและสถานะการแข่งขันได้ทันที
              เชื่อมต่อการให้คะแนนของกรรมการหลายคนเข้าสู่ Scoreboard กลางเดียวกัน
            </p>
          </div>

          {/* Primary actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/events/current"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
            >
              ดูการแข่งขันปัจจุบัน
              <span className="text-[11px] font-normal text-sky-100">
                หากมี Event ที่กำลังแข่ง
              </span>
            </Link>

            <Link
              href="/events"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              ดูการแข่งขันทั้งหมด
            </Link>

            <Link
              href="/judge/events/preview/join"
              className="inline-flex items-center justify-center rounded-full border border-dashed border-slate-300 px-4 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-100"
            >
              สำหรับกรรมการ – กรอกรหัสเพื่อเข้าร่วม Event
            </Link>
          </div>

          {/* Target audiences */}
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                สำหรับสนามแข่งขัน / ผู้จัดงาน
              </h2>
              <ul className="space-y-1.5 text-slate-600">
                <li>• ตั้งค่า Event, รายชื่อนักกีฬา และกรรมการได้จากหน้าเดียว</li>
                <li>• มีหน้า Dashboard และ Report สำหรับออกรายงานหลังแข่ง</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                สำหรับกรรมการ (Judger)
              </h2>
              <ul className="space-y-1.5 text-slate-600">
                <li>• Join การแข่งขันด้วยรหัสที่ Admin กำหนด</li>
                <li>• บันทึกคะแนนและสถานะการแข่งขันแบบ Real-time</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Feature & tech summary */}
        <aside className="mt-6 w-full max-w-md space-y-4 lg:mt-0">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              ฟีเจอร์หลักของระบบ
            </h2>
            <dl className="space-y-2 text-sm text-slate-700">
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">Public</dt>
                <dd className="flex-1">
                  Event live page พร้อม Scoreboard
                  และลิงก์แชร์ผลการแข่งขันแต่ละ Event
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">Judger</dt>
                <dd className="flex-1">
                  Join match ด้วยรหัส, บันทึกคะแนน และอัปเดตสถานะการแข่งขัน
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">Admin</dt>
                <dd className="flex-1">
                  จัดการ Event, Judges, Athletes และดาวน์โหลดรายงานผลการแข่งขัน
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-900 p-4 text-slate-50 shadow-sm">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Tech stack
            </h2>
            <p className="mb-2 text-sm">
              Next.js (App Router) + TypeScript + Tailwind CSS
              เชื่อมต่อฐานข้อมูล MySQL ด้วย Prisma
            </p>
            <p className="text-xs text-slate-400">
              ดีไซน์โทน Light เน้นความอ่านง่าย รองรับทั้งภาษาไทยและอังกฤษ
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
