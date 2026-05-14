"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type TimekeeperJoinFormProps = {
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

export function TimekeeperJoinForm({ eventId, event }: TimekeeperJoinFormProps) {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: ภายหลังเชื่อมต่อ API ตรวจสอบ secret_code ของคนนับรอบ
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      if (!eventId) return;
      router.push(`/timekeeper/events/${eventId}`);
    }, 400);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md rounded-3xl border-slate-800 bg-slate-900 px-6 py-8 shadow-lg">
        <CardContent className="space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              การแข่งขันเดินทน – คนนับรอบ
            </p>
            <h1 className="text-2xl font-semibold text-slate-100">
              เข้าร่วมเป็นคนนับรอบใน Event
            </h1>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm">
            {event ? (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Event กำลังดำเนินการอยู่
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-100">
                  {event.name}
                </p>
                <p className="text-xs text-slate-300">{event.heat_name}</p>
                <p className="mt-1 text-[11px] text-emerald-400">
                  สถานะ: {event.statusLabel}
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-300">
                ไม่พบข้อมูล Event จากรหัสที่ระบุใน URL
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-200">
                รหัสลับของคนนับรอบใน Event นี้
              </label>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                  value={code}
                  onChange={(value) => setCode(value.toUpperCase())}
                  containerClassName="justify-center"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <p className="text-center text-[11px] text-slate-400">
                ใช้รหัสลับ 6 ตัวที่ได้รับจากผู้จัด / Admin ของ Event
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitting || code.trim().length !== 6 || !event}
              className="w-full rounded-xl bg-slate-100 text-sm font-medium text-slate-900 hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-500"
            >
              {submitting ? "กำลังตรวจสอบรหัส..." : "เข้าร่วม Event ในฐานะคนนับรอบ"}
            </Button>
          </form>

          <p className="text-center text-[11px] text-slate-400">
            ถ้าไม่ทราบรหัส ให้ติดต่อผู้ประสานงานสนามแข่งหรือ Admin ของ Event
          </p>
          <p className="text-center text-[11px] text-slate-400">
            เทสหน้าผู้บันทึกรอบ รหัส 111111
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
