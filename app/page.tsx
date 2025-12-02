import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "การแข่งขันเดินทน | Racewalk Tournament",
  description:
    "Landing page ของ Racewalk Tournament สำหรับผู้ชม กรรมการ และผู้จัดงาน – ดู Live scoreboard, เข้าร่วมเป็นกรรมการ และจัดการ Event ได้จากที่เดียว.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-cyan-400 text-xs font-semibold text-white shadow-lg shadow-sky-500/40">
              RW
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">
                การแข่งขันเดินทน
              </span>
              <span className="text-[11px] text-slate-400">
                Live scoreboard · ระบบตัดสินบนคลาวด์
              </span>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Language toggle (UI only for now) */}
            <div className="hidden items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-1 text-xs font-medium text-slate-300 sm:flex">
              <button className="rounded-full bg-slate-50 px-3 py-1 text-slate-900 shadow-sm shadow-slate-900/50">
                TH
              </button>
              <button className="rounded-full px-3 py-1 text-slate-500">
                EN
              </button>
            </div>
            <Link
              href="/admin/login"
              className="hidden rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 sm:inline-flex"
            >
              เข้าสู่ระบบผู้จัดงาน
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        {/* Section: Current event tournament */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-5 py-8 shadow-xl shadow-sky-500/10 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          {/* Background accents */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-10 top-6 h-40 w-40 rounded-full bg-sky-500/15 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
          </div>

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-100 backdrop-blur">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Current demo tournament
                <span className="hidden text-sky-200/80 sm:inline">
                  ตัวอย่างการทำงานของระบบ Racewalk Tournament
                </span>
              </div>

              <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl lg:text-4xl">
                การแข่งขันเดินทนชิงแชมป์ 2025
              </h1>

              <p className="max-w-lg text-sm leading-relaxed text-slate-300">
                ดูตัวอย่างหน้า Live scoreboard ของรายการ 10 km Road Race
                เห็นอันดับนักกีฬา เวลา Lap ล่าสุด เวลารวม และจำนวนใบเตือนแบบเรียลไทม์
                เหมาะสำหรับใช้เป็นตัวอย่างให้กรรมการและผู้จัดงานทดลองระบบ
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/events/evt-001"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-medium text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-400"
                >
                  เปิดหน้า Live ของทัวร์นาเมนต์นี้
                </Link>

                <Link
                  href="/judge/events/evt-001/join"
                  className="inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-950/60 px-5 py-2.5 text-sm font-medium text-slate-100 shadow-sm shadow-slate-900/60 transition hover:border-slate-400 hover:bg-slate-900/80"
                >
                  ทดลองเข้าร่วมเป็นกรรมการในสนาม
                </Link>
              </div>

              <div className="mt-2 text-xs text-slate-400">
                * Event นี้เป็นข้อมูลตัวอย่างสำหรับเดโมเท่านั้น ไม่ใช่การแข่งขันจริง
              </div>
            </div>

            {/* Small preview card */}
            <aside className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.8)] backdrop-blur lg:w-80">
              <div className="mb-3 flex items-center justify-between gap-2 text-[11px] text-slate-300">
                <span>ตัวอย่างอันดับ Live</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  ระบบออนไลน์
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-100">
                <div className="flex items-center justify-between rounded-lg bg-slate-900/70 px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-semibold text-slate-950">
                      1
                    </span>
                    <div>
                      <div className="text-xs font-medium">Athlete 101</div>
                      <div className="text-[10px] text-slate-400">
                        THA · RW Club Bangkok
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-emerald-300">
                      42:13
                    </div>
                    <div className="text-[10px] text-slate-400">
                      1 ใบเหลือง · 0 ใบแดง
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-900/40 px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-semibold text-slate-100">
                      2
                    </span>
                    <div>
                      <div className="text-xs font-medium text-slate-100">
                        Athlete 204
                      </div>
                      <div className="text-[10px] text-slate-400">
                        JPN · East Asia Walk
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-100">
                      +00:07
                    </div>
                    <div className="text-[10px] text-slate-400">
                      0 ใบเหลือง · 0 ใบแดง
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Section: About tournament / Racewalk info */}
        <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-lg shadow-slate-900/60 sm:p-7 lg:p-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-50 sm:text-xl">
                เกี่ยวกับการแข่งขันเดินทน (Racewalk Tournament)
              </h2>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                ระบบสำหรับจัดการแข่งขันเดินทนที่เน้นความโปร่งใส เข้าใจง่าย และใช้งานได้จริงในสนาม
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <h3 className="text-sm font-semibold text-slate-50">
                Racewalk คืออะไร
              </h3>
              <p className="text-xs leading-relaxed text-slate-300">
                การแข่งขันเดินทนเป็นกีฬาที่มีกติกาชัดเจนเรื่องการ “เดินไม่วิ่ง”
                ต้องมีเท้าข้างหนึ่งสัมผัสพื้นตลอดเวลา และเข่าขาหน้าต้องเหยียดตรงจนกว่าจะผ่านแนวดิ่งของลำตัว
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <h3 className="text-sm font-semibold text-slate-50">
                ทำไมต้องใช้ระบบ Live
              </h3>
              <p className="text-xs leading-relaxed text-slate-300">
                เพราะการตัดสินเดินทนมีการให้ใบเหลืองและใบแดงจากกรรมการหลายจุด
                ระบบ Live scoreboard ช่วยรวมข้อมูลทั้งหมดแบบเรียลไทม์
                ทำให้ทั้งนักกีฬา โค้ช และผู้ชมเข้าใจสถานการณ์เดียวกัน
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <h3 className="text-sm font-semibold text-slate-50">
                Racewalk Tournament ช่วยอย่างไร
              </h3>
              <p className="text-xs leading-relaxed text-slate-300">
                ผู้จัดงานตั้งค่า Event ได้เอง แยกประเภทการแข่งขัน ระยะทาง และกลุ่มอายุ
                กรรมการใช้ workspace ของตนเองในการบันทึกการตัดสิน
                ขณะที่ผู้ชมและสื่อสามารถเปิดหน้า Live เพื่อติดตามผลได้ทันที
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
