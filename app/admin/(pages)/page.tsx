import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ภาพรวมผู้ดูแลระบบ – การแข่งขันเดินทน",
  description:
    "หน้าแดชบอร์ดภาพรวมสำหรับผู้ดูแลระบบ Racewalk Tournament แสดงสถานะ Event ปัจจุบัน, กรรมการ และนักกีฬา.",
};

export default function AdminDashboardPage() {
  // TODO: ภายหลังให้ดึงข้อมูลเหล่านี้จากฐานข้อมูลจริง
  const currentEvent = {
    id: "evt-001",
    name: "Racewalk Championship 2025",
    date: "2025-03-15",
    location: "สนามกีฬาแห่งชาติ",
    status: "ongoing" as const,
    athletesCount: 120,
    judgesCount: 16,
  };

  const stats = {
    eventsTotal: 8,
    judgesTotal: 32,
    athletesTotal: 240,
  };

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="max-w-full space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            ภาพรวมผู้ดูแลระบบ
          </h1>
          <p className="max-w-xl text-sm text-slate-600">
            ภาพรวมการจัดการแข่งขันเดินทน – ดูสถานะกิจกรรม,
            กรรมการ และนักกีฬาในระบบจากหน้านี้
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-slate-500">
              กิจกรรม
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {stats.eventsTotal}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              จำนวน Event ทั้งหมดในระบบ (เชื่อมต่อฐานข้อมูลภายหลัง)
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-slate-500">
              กรรมการ
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {stats.judgesTotal}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              จำนวนกรรมการที่ลงทะเบียนในระบบ
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-slate-500">
              นักกีฬา
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {stats.athletesTotal}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              จำนวนรายชื่อนักกีฬาทั้งหมด
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-slate-500">
              ระบบ
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              พร้อมสำหรับการตั้งค่า
            </p>
            <p className="mt-1 text-xs text-slate-500">
              ตั้งค่า Event, Judges, Athletes และการรายงานผลจากเมนูด้านซ้าย
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[2fr,1.3fr]">
          
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                กิจกรรมปัจจุบัน (กำลังดำเนินการ)
              </p>
              <div className="mt-2 flex flex-col gap-2 text-sm text-slate-900">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{currentEvent.name}</p>
                  <span className="inline-flex items-center rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-medium text-white">
                    กำลังดำเนินการ
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  วันที่แข่งขัน{" "}
                  <span className="font-medium">{currentEvent.date}</span> ที่{" "}
                  <span className="font-medium">{currentEvent.location}</span>
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700">
                  <div className="rounded-xl bg-white/60 px-3 py-2">
                    <p className="text-[10px] font-medium uppercase text-slate-500">
                      นักกีฬาในกิจกรรม
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {currentEvent.athletesCount}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/60 px-3 py-2">
                    <p className="text-[10px] font-medium uppercase text-slate-500">
                      กรรมการในกิจกรรม
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {currentEvent.judgesCount}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 text-xs">
                  <a
                    href={`/admin/events/${currentEvent.id}`}
                    className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    ไปหน้า Event นี้
                  </a>
                  <a
                    href={`/events/${currentEvent.id}`}
                    className="inline-flex flex-1 items-center justify-center rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
                  >
                    เปิดหน้า Live / Public
                  </a>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-emerald-700/80">
                * ข้อมูล Event ปัจจุบันนี้เป็นตัวอย่างเบื้องต้น – ภายหลังจะดึงจาก
                Event ที่สถานะเป็น &quot;ongoing&quot; โดยอัตโนมัติ
              </p>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}


