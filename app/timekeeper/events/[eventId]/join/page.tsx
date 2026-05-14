import type { Metadata } from "next";
import { TimekeeperJoinForm } from "@/components/timekeeper/timekeeper-join-form";

export const metadata: Metadata = {
  title: "เข้าร่วมเป็นคนนับรอบ – การแข่งขันเดินทน",
  description: "หน้าให้คนนับรอบกรอกรหัสลับเพื่อเข้าร่วม Event",
};

const MOCK_EVENT_INFO: Record<
  string,
  { id: string; name: string; heat_name: string; statusLabel: string }
> = {
  "evt-001": {
    id: "evt-001",
    name: "Racewalk Championship 2025",
    heat_name: "รุ่นทั่วไป ระยะ 20 กม.",
    statusLabel: "กำลังดำเนินการอยู่",
  },
};

type TimekeeperJoinPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function TimekeeperJoinPage(props: TimekeeperJoinPageProps) {
  const { eventId } = await props.params;
  const event = MOCK_EVENT_INFO[eventId] ?? null;

  return <TimekeeperJoinForm eventId={eventId} event={event} />;
}
