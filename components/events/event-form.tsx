"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createEvent, updateEvent } from "@/app/actions/events";

export type EventFormValues = {
  name: string;
  date: string;
  location: string;
  distanceKm: string;
  lapCount: number;
  status: "DRAFT" | "SCHEDULED" | "ONGOING" | "FINISHED";
  isCurrent: boolean;
};

type EventFormProps = {
  mode: "create" | "edit";
  eventId?: string;
  defaultValues?: Partial<EventFormValues>;
};

const EMPTY: EventFormValues = {
  name: "",
  date: "",
  location: "",
  distanceKm: "",
  lapCount: 1,
  status: "DRAFT",
  isCurrent: false,
};

export function EventForm({ mode, eventId, defaultValues }: EventFormProps) {
  const router = useRouter();
  const [form, setForm] = React.useState<EventFormValues>({
    ...EMPTY,
    ...defaultValues,
  });
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const isEdit = mode === "edit";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (isEdit && eventId) {
          await updateEvent(eventId, form);
          router.push(`/admin/events/${eventId}`);
        } else {
          const result = await createEvent(form);
          router.push(`/admin/events/${result.id}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
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
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
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
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                สถานที่จัดการแข่งขัน
              </label>
              <Input
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                placeholder="เช่น สนามกีฬาแห่งชาติ"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                ระยะทางรวม (กิโลเมตร)
              </label>
              <Input
                type="number"
                min={0}
                step="0.1"
                value={form.distanceKm}
                onChange={(e) => setForm((p) => ({ ...p, distanceKm: e.target.value }))}
                placeholder="เช่น 10, 20, 50"
              />
              <p className="text-[11px] text-slate-500">
                ระยะทางทั้งหมดของการแข่งขัน (รวมทุกรอบสนาม)
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                จำนวนรอบสนาม (Lap count) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min={1}
                step="1"
                required
                value={form.lapCount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, lapCount: Math.max(1, Number(e.target.value) || 1) }))
                }
                placeholder="เช่น 10, 20, 50"
              />
              <p className="text-[11px] text-slate-500">
                จำนวนรอบที่นักกีฬาต้องเดินครบเพื่อจบการแข่งขัน — กำหนดตามขนาดสนามจริง
                (เช่น สนามระยะรอบ 1 กม. ที่แข่ง 20 กม. ใส่ 20 รอบ)
                {form.distanceKm && form.lapCount > 0 && (
                  <span className="block mt-0.5 text-emerald-600">
                    ระยะต่อรอบประมาณ {(Number(form.distanceKm) / form.lapCount).toFixed(2)} กม./รอบ
                  </span>
                )}
              </p>
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
                  setForm((p) => ({ ...p, status: e.target.value as EventFormValues["status"] }))
                }
              >
                <option value="DRAFT">ร่าง – ยังไม่เผยแพร่</option>
                <option value="SCHEDULED">กำหนดการ – ตั้งวันไว้แล้ว</option>
                <option value="ONGOING">กำลังดำเนินการ – กำลังแข่งขัน</option>
                <option value="FINISHED">เสร็จสิ้น – แข่งขันเสร็จแล้ว</option>
              </select>
              <p className="text-[11px] text-slate-500">
                ใช้กำหนด state หลักของ Event เพื่อแสดงผลและคุม flow อื่น ๆ
              </p>
            </div>

            <div className="space-y-1.5 flex flex-col justify-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={form.isCurrent}
                  onChange={(e) => setForm((p) => ({ ...p, isCurrent: e.target.checked }))}
                />
                <span className="text-sm font-medium text-slate-800">
                  กิจกรรมปัจจุบัน (isCurrent)
                </span>
              </label>
              <p className="text-[11px] text-slate-500 ml-6">
                เปิดหน้าแสดงผลสาธารณะและหน้ากรรมการสำหรับ Event นี้
                (จะยกเลิก Event อื่นที่เป็น isCurrent อยู่โดยอัตโนมัติ)
              </p>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl px-4 py-2 text-sm font-medium"
            >
              {isPending
                ? "กำลังบันทึก..."
                : isEdit
                ? "บันทึกการเปลี่ยนแปลง"
                : "สร้าง Event ใหม่"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
