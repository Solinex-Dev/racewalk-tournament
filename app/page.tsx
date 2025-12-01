import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Racewalk Tournament",
  description:
    "Landing page ของ Racewalk Tournament สำหรับผู้ชม กรรมการ และผู้จัดงาน – ดู Live scoreboard, เข้าร่วมเป็นกรรมการ และจัดการ Event ได้จากที่เดียว.",
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
            การแข่งขันเดินทน (Racewalk) ระดับสนามจริง
            <span className="h-1 w-1 rounded-full bg-sky-500" />
            ดูผลสด – เข้าใจง่ายทั้งนักกีฬาและผู้ชม
          </div>

          <div className="space-y-4">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              ติดตาม{" "}
              <span className="text-sky-600">ผลการแข่งขันเดินทนแบบสด</span>{" "}
              เห็นอันดับ เวลารวม และใบเหลือง–ใบแดง ชัดเจน
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Racewalk Tournament ถูกออกแบบมาสำหรับ{" "}
              <span className="font-medium">
                นักกีฬาเดินทน, โค้ช, ผู้ชมข้างสนาม และครอบครัวที่ติดตามอยู่บ้าน
              </span>
              – หน้า Live จะแสดงอันดับ ป้ายประเทศ สโมสร เวลาต่อ Lap
              และจำนวนใบเหลือง–ใบแดงของนักกีฬาแต่ละคนอย่างชัดเจน
              เพื่อให้เข้าใจสถานการณ์ในสนามแบบเรียลไทม์
            </p>
          </div>

          {/* Primary actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/events/evt-001"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
            >
              ดู Live scoreboard (ตัวอย่าง)
              <span className="text-[11px] font-normal text-sky-100">
                Event mock: Racewalk Championship 2025
              </span>
            </Link>

            <Link
              href="/judge/events/evt-001/join"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              สำหรับกรรมการในสนาม – กรอกรหัสเพื่อเข้าร่วม Event ตัวอย่าง
            </Link>

            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center rounded-full border border-dashed border-slate-300 px-4 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-100"
            >
              สำหรับผู้จัดงาน / สมาคม – เข้าสู่ระบบจัดการ Event
            </Link>
          </div>
        </section>

        {/* Feature & tech summary */}
        <aside className="mt-6 w-full max-w-md space-y-4 lg:mt-0">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              ถ้าเข้าหน้า Live / ใช้งานในสนาม คุณจะได้อะไรบ้าง
            </h2>
            <dl className="space-y-2 text-sm text-slate-700">
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">สำหรับผู้ชม</dt>
                <dd className="flex-1">
                  เห็นอันดับนักกีฬาแบบอัปเดตตลอด เวลา Lap ล่าสุด เวลารวม
                  และจำนวนใบเหลือง/ใบแดง ทำให้เข้าใจกติกาเดินทนและตามเชียร์ได้สนุกขึ้น
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">สำหรับกรรมการ</dt>
                <dd className="flex-1">
                  ใช้ workspace ตัดสินจากจุดของตัวเอง
                  ลดการใช้กระดาษและลดโอกาสจดผิด บันทึกข้อมูลตรงเข้าสู่ระบบกลาง
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">สำหรับสมาคม</dt>
                <dd className="flex-1">
                  ได้ข้อมูลการแข่งขันที่เก็บเป็นระบบ สามารถใช้ทบทวนผลการแข่งขัน
                  หรืออ้างอิงในรายการต่อ ๆ ไปได้ง่าย
                </dd>
              </div>
            </dl>
          </div>

        </aside>
      </main>
    </div>
  );
}
