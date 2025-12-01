"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type JudgeJoinFormProps = {
  eventId: string;
  event:
    | {
        id: string;
        name: string;
        heat_name: string;
        statusLabel: string;
      }
    | null;
};

export function JudgeJoinForm({ eventId, event }: JudgeJoinFormProps) {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: ภายหลังเชื่อมต่อ API ตรวจสอบ event_secret_code ที่ถูกต้องสำหรับกรรมการแต่ละคน
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      if (!eventId) return;
      // mock: ถ้ากรอกอะไรมาก็ให้ไปหน้า judge workspace
      router.push(`/judge/events/${eventId}`);
    }, 400);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md rounded-3xl px-6 py-8 shadow-lg">
        <CardContent className="space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Racewalk Tournament – Judge
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              เข้าร่วมเป็นกรรมการใน Event
            </h1>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            {event ? (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Event กำลังดำเนินการอยู่
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {event.name}
                </p>
                <p className="text-xs text-slate-600">{event.heat_name}</p>
                <p className="mt-1 text-[11px] text-emerald-700">
                  สถานะ: {event.statusLabel}
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-600">
                ไม่พบข้อมูล Event จากรหัสที่ระบุใน URL
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="judge-code"
                className="block text-sm font-medium text-slate-800"
              >
                รหัสลับของกรรมการใน Event นี้
              </label>
              <Input
                id="judge-code"
                type="text"
                inputMode="text"
                autoComplete="off"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="เช่น AB12CD"
                maxLength={6}
                className="w-full rounded-xl font-mono tracking-[0.25em] uppercase"
              />
              <p className="text-[11px] text-slate-500">
                ใช้รหัสลับ 6 ตัวที่ได้รับจากผู้จัด / Admin ของ Event
                (ไม่ใช่โค้ด join รวมของ Event)
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitting || code.trim().length !== 6 || !event}
              className="w-full rounded-xl text-sm font-medium"
            >
              {submitting ? "กำลังตรวจสอบรหัส..." : "เข้าร่วม Event ในฐานะกรรมการ"}
            </Button>
          </form>

          <p className="text-center text-[11px] text-slate-500">
            ถ้าไม่ทราบรหัส ให้ติดต่อผู้ประสานงานสนามแข่งหรือ Admin ของ Event
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


