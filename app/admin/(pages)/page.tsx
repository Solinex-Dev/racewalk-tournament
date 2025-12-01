export default function AdminDashboardPage() {
  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="max-w-full space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Admin overview
          </h1>
          <p className="max-w-xl text-sm text-slate-600">
            ภาพรวมการจัดการแข่งขันเดินทนบน Racewalk Tournament – ดูสถานะ Event,
            กรรมการ และนักกีฬาในระบบจากหน้านี้
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-slate-500">
              Events
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">–</p>
            <p className="mt-1 text-xs text-slate-500">
              จำนวน Event ทั้งหมดในระบบ (เชื่อมต่อฐานข้อมูลภายหลัง)
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-slate-500">
              Judges
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">–</p>
            <p className="mt-1 text-xs text-slate-500">
              จำนวนกรรมการที่ลงทะเบียนในระบบ
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-slate-500">
              Athletes
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">–</p>
            <p className="mt-1 text-xs text-slate-500">
              จำนวนรายชื่อนักกีฬาทั้งหมด
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-slate-500">
              System
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              Ready for configuration
            </p>
            <p className="mt-1 text-xs text-slate-500">
              ตั้งค่า Event, Judges, Athletes และการรายงานผลจากเมนูด้านซ้าย
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[2fr,1.2fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Quick links
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              ลิงก์ไปยังหน้าจัดการหลักของ Admin (จะเชื่อม route จริงภายหลัง)
            </p>
            <div className="mt-4 grid gap-2 text-sm text-slate-700">
              <button className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100">
                <span>สร้าง Event ใหม่</span>
                <span className="text-[11px] text-slate-500">/admin/events/new</span>
              </button>
              <button className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100">
                <span>จัดการ Events ทั้งหมด</span>
                <span className="text-[11px] text-slate-500">/admin/events</span>
              </button>
              <button className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100">
                <span>จัดการ Judges</span>
                <span className="text-[11px] text-slate-500">/admin/judges</span>
              </button>
              <button className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100">
                <span>จัดการ Athletes</span>
                <span className="text-[11px] text-slate-500">/admin/athletes</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              หมายเหตุการใช้งาน
            </h2>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
              <li>• เมนูด้านซ้ายจะถูกปรับเป็นเมนูจริงของ Racewalk Tournament ภายหลัง</li>
              <li>• การแสดงตัวเลขสถิติต่าง ๆ จะเชื่อมกับฐานข้อมูล MySQL ผ่าน Prisma</li>
              <li>• โทนสี/โลโก้สามารถปรับให้ตรงกับแบรนด์สนามแข่งขันได้</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}


