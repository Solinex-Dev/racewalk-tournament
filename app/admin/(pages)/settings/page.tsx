import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Settings – Racewalk Tournament",
  description: "ตั้งค่าโปรไฟล์ผู้ดูแลระบบ (Admin profile settings).",
};

export default function AdminSettingsPage() {
  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Settings
          </h1>
          <p className="text-sm text-slate-600">
            ตั้งค่าโปรไฟล์ของผู้ดูแลระบบ (Admin) เช่น ชื่อ อีเมล และรหัสผ่าน
          </p>
        </div>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="space-y-6 p-6">
            <section className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  ข้อมูลโปรไฟล์
                </h2>
                <p className="text-xs text-slate-500">
                  ใช้สำหรับแสดงชื่อและติดต่อกลับในระบบหลังบ้าน
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    ชื่อจริง
                  </label>
                  <Input
                    placeholder="เช่น สุขสันต์"
                    className="rounded-xl border-slate-200 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    นามสกุล
                  </label>
                  <Input
                    placeholder="เช่น ใจดี"
                    className="rounded-xl border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  อีเมลสำหรับล็อกอิน
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="rounded-xl border-slate-200 text-sm"
                />
              </div>
            </section>

            <section className="space-y-4 border-t border-dashed border-slate-200 pt-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  เปลี่ยนรหัสผ่าน
                </h2>
                <p className="text-xs text-slate-500">
                  เพื่อความปลอดภัย แนะนำให้เปลี่ยนรหัสผ่านเป็นระยะ ๆ
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    รหัสผ่านปัจจุบัน
                  </label>
                  <Input
                    type="password"
                    className="rounded-xl border-slate-200 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    รหัสผ่านใหม่
                  </label>
                  <Input
                    type="password"
                    className="rounded-xl border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="rounded-xl px-4 py-2 text-sm font-medium">
                  บันทึกการเปลี่ยนรหัสผ่าน
                </Button>
              </div>
            </section>

            <p className="text-[11px] text-slate-500">
              * ขณะนี้ยังเป็นแบบฟอร์มตัวอย่างเท่านั้น – ภายหลังจะเชื่อมต่อกับ
              backend เพื่อตรวจสอบรหัสผ่านและบันทึกข้อมูลจริง
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}


