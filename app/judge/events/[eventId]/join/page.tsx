import type { Metadata } from "next";
import { JudgeJoinForm } from "@/components/judge/judge-join-form";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "เข้าร่วมเป็นกรรมการ – การแข่งขันเดินทน",
  description: "หน้าให้กรรมการกรอกรหัสกรรมการเพื่อเข้าร่วม Event บน Racewalk Tournament",
};

type Props = { params: Promise<{ eventId: string }> };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "ยังไม่เผยแพร่",
  SCHEDULED: "กำหนดการ",
  ONGOING: "กำลังดำเนินการอยู่",
  FINISHED: "จบการแข่งขันแล้ว",
};

export default async function JudgeJoinPage(props: Readonly<Props>) {
  const { eventId } = await props.params;

  const event = await prisma.event.findUnique({
    where: { id: eventId, deletedAt: null },
    include: {
      rounds: {
        where: { deletedAt: null, status: { not: "FINISHED" } },
        orderBy: { scheduledTime: "asc" },
        take: 1,
      },
    },
  });

  const eventInfo = event
    ? {
        id: event.id,
        name: event.name,
        statusLabel: STATUS_LABEL[event.status] ?? event.status,
      }
    : null;

  return <JudgeJoinForm eventId={eventId} event={eventInfo} />;
}
