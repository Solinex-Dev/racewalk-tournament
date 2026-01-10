import type { Metadata } from "next";
import { HeadJudgeJoinForm } from "@/components/judge/head-judge-join-form";

export const metadata: Metadata = {
  title: "เข้าร่วมเป็นหัวหน้ากรรมการ – การแข่งขันเดินทน",
  description:
    "หน้าให้หัวหน้ากรรมการกรอกรหัสลับที่ได้รับจากผู้จัดการแข่งขัน เพื่อเข้าร่วม Event บน Racewalk Tournament.",
};

const MOCK_EVENT_INFO = {
  "evt-001": {
    id: "evt-001",
    name: "Racewalk Championship 2025",
    heat_name: "รุ่นทั่วไป ระยะ 20 กม.",
    statusLabel: "กำลังดำเนินการอยู่",
  },
};

type HeadJudgeJoinPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function HeadJudgeJoinPage(props: HeadJudgeJoinPageProps) {
  const { eventId } = await props.params;
  const event =
    MOCK_EVENT_INFO[eventId as keyof typeof MOCK_EVENT_INFO] ?? null;

  return <HeadJudgeJoinForm eventId={eventId} event={event} />;
}

