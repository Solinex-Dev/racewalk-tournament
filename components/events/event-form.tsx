 "use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type EventFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<EventFormValues>;
};

export type EventFormValues = {
  name: string;
  date: string;
  location: string;
  distance_km: string;
  status: "draft" | "scheduled" | "ongoing" | "finished";
  note?: string;
  judge_join_code?: string;
};

const EMPTY_VALUES: EventFormValues = {
  name: "",
  date: "",
  location: "",
  distance_km: "",
  status: "draft",
  note: "",
  judge_join_code: "",
};


export function EventForm({ mode, defaultValues }: EventFormProps) {
  const [form, setForm] = React.useState<EventFormValues>(() => {
    return {
      ...EMPTY_VALUES,
      ...defaultValues,
    };
  });

  const isEdit = mode === "edit";

  // TODO: เชื่อมต่อ submit กับ server action / API จริงภายหลัง
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // eslint-disable-next-line no-console
    console.log("[Mock submit event]", form);
    alert(
      isEdit
        ? "บันทึกการแก้ไข Event (mock) เรียบร้อย – รอเชื่อมต่อฐานข้อมูลจริง"
        : "สร้าง Event ใหม่ (mock) เรียบร้อย – รอเชื่อมต่อฐานข้อมูลจริง",
    );
  };

  return (
    <Card className="rounded-2xl border-slate-200">
      <CardContent className="p-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                ชื่อ Event
              </label>
              <Input
                required
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="เช่น Racewalk Championship 2025"
              />
              <p className="text-[11px] text-slate-500">
                ชื่อเต็มของการแข่งขันที่จะใช้แสดงทั้งฝั่ง Admin และ Public
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                วันที่จัดการแข่งขัน
              </label>
              <Input
                type="date"
                required
                value={form.date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                สถานที่จัดการแข่งขัน
              </label>
              <Input
                value={form.location}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="เช่น สนามกีฬาแห่งชาติ"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                ระยะทาง (กิโลเมตร)
              </label>
              <Input
                type="number"
                min={0}
                step="0.1"
                value={form.distance_km}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    distance_km: e.target.value,
                  }))
                }
                placeholder="เช่น 10, 20, 50"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                สถานะ Event
              </label>
              <select
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/5"
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as EventFormValues["status"],
                  }))
                }
              >
                <option value="draft">ร่าง – ยังไม่เผยแพร่</option>
                <option value="scheduled">กำหนดการ – ตั้งวันไว้แล้ว</option>
                <option value="ongoing">กำลังดำเนินการ – กำลังแข่งขัน</option>
                <option value="finished">เสร็จสิ้น – แข่งขันเสร็จแล้ว</option>
              </select>
              <p className="text-[11px] text-slate-500">
                ใช้กำหนด state หลักของ Event เพื่อแสดงผลและคุม flow อื่น ๆ
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                โค้ดสำหรับกรรมการ (Judge join code)
              </label>
              <Input
                value={form.judge_join_code}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    judge_join_code: e.target.value,
                  }))
                }
                placeholder="เช่น RW2025-A – ใช้สำหรับกรรมการ join เข้ารายการนี้"
              />
              <p className="text-[11px] text-slate-500">
                โค้ดนี้จะใช้ในหน้า Judger join match page
              </p>
            </div>
          </div>


          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800">
              หมายเหตุภายใน (Internal note)
            </label>
            <textarea
              className="min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/5"
              value={form.note}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, note: e.target.value }))
              }
              placeholder="รายละเอียดเพิ่มเติม เช่น เงื่อนไขพิเศษ / หมายเหตุสำหรับทีมงาน"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="submit"
              className="rounded-xl px-4 py-2 text-sm font-medium"
            >
              {isEdit ? "บันทึกการเปลี่ยนแปลง" : "สร้าง Event ใหม่"}
            </Button>
          </div>

          <p className="text-[11px] text-slate-500">
            * ฟอร์มนี้เป็นตัวอย่างเบื้องต้น – ในขั้นต่อไปจะเชื่อมต่อกับ Prisma
            / MySQL และเพิ่มการ validate อย่างละเอียดมากขึ้น
            <br />
            * หลังจากสร้าง Event แล้ว สามารถสร้างรอบแข่ง (Round) และเพิ่มนักกีฬา/กรรมการในแต่ละรอบได้
          </p>
        </form>
      </CardContent>
    </Card>
  );
}


