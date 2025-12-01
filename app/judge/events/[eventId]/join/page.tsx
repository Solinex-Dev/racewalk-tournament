import type { Metadata } from "next";
import { JudgeJoinForm } from "@/components/judge/judge-join-form";

export const metadata: Metadata = {
  title: "เข้าร่วมเป็นกรรมการ – การแข่งขันเดินทน",
  description:
    "หน้าให้กรรมการกรอกรหัสลับที่ได้รับจากผู้จัดการแข่งขัน เพื่อเข้าร่วม Event บน Racewalk Tournament.",
};

const MOCK_EVENT_INFO = {
  "evt-001": {
    id: "evt-001",
    name: "Racewalk Championship 2025",
    heat_name: "รุ่นทั่วไป ระยะ 20 กม.",
    statusLabel: "กำลังดำเนินการอยู่",
  },
};

type JudgeJoinPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function JudgeJoinPage(props: JudgeJoinPageProps) {
  const { eventId } = await props.params;
  const event =
    MOCK_EVENT_INFO[eventId as keyof typeof MOCK_EVENT_INFO] ?? null;

  return <JudgeJoinForm eventId={eventId} event={event} />;
}

