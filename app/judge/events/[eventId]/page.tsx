import type { Metadata } from "next";
import { JudgeWorkspace } from "@/components/judge/judge-workspace";

export const metadata: Metadata = {
  title: "หน้าทำงานกรรมการ – การแข่งขันเดินทน",
  description:
    "หน้าทำงานสำหรับกรรมการในการบันทึกสถานะและผลการแข่งขันของ Event เดินทนบน Racewalk Tournament.",
};

type JudgeWorkspacePageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

const MOCK_JUDGE_EVENT_INFO = {
  "evt-001": {
    id: "evt-001",
    name: "Racewalk Championship 2025",
    heat_name: "รุ่นทั่วไป ระยะ 20 กม.",
    lapCount: 20,
    currentLap: 7,
    distance_km: "20",
  },
};

export default async function JudgeWorkspacePage(
  props: JudgeWorkspacePageProps,
) {
  const { eventId } = await props.params;
  const event =
    MOCK_JUDGE_EVENT_INFO[eventId as keyof typeof MOCK_JUDGE_EVENT_INFO] ??
    null;

  return <JudgeWorkspace eventId={eventId} event={event} />;
}

