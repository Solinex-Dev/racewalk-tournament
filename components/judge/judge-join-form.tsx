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
import { joinAsOfficial } from "@/app/actions/officials";

type JudgeJoinFormProps = {
  eventId: string;
  event:
    | {
        id: string;
        name: string;
        statusLabel: string;
      }
    | null;
};

export function JudgeJoinForm({ eventId, event }: JudgeJoinFormProps) {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await joinAsOfficial(eventId, code);
      if (result.ok) {
        router.push(result.redirect);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md rounded-3xl border-slate-800 bg-slate-900 px-6 py-8 shadow-lg">
        <CardContent className="space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              การแข่งขันเดินทน – กรรมการ
            </p>
            <h1 className="text-2xl font-semibold text-slate-100">
              เข้าร่วมเป็นกรรมการใน Event
            </h1>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm">
            {event ? (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Event
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-100">{event.name}</p>
                <p className="mt-1 text-[11px] text-emerald-400">สถานะ: {event.statusLabel}</p>
              </>
            ) : (
              <p className="text-xs text-slate-300">ไม่พบข้อมูล Event จากรหัสที่ระบุใน URL</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-200">
                รหัสกรรมการของกรรมการใน Event นี้
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
                ใช้รหัสกรรมการ 6 ตัวที่ได้รับจาก Admin ของ Event
              </p>
            </div>

            {error && (
              <p className="rounded-lg bg-red-900/40 px-3 py-2 text-center text-xs text-red-300">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isPending || code.trim().length !== 6 || !event}
              className="w-full rounded-xl bg-slate-100 text-sm font-medium text-slate-900 hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-500"
            >
              {isPending ? "กำลังตรวจสอบรหัส..." : "เข้าร่วม Event"}
            </Button>
          </form>

          <p className="text-center text-[11px] text-slate-400">
            ระบบจะตรวจสอบรหัสและพาคุณไปยังหน้าทำงานตามตำแหน่งที่ได้รับมอบหมาย
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
