import type { Metadata } from "next";
import { TimekeeperJoinForm } from "@/components/timekeeper/timekeeper-join-form";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "เข้าร่วมเป็นคนนับรอบ – การแข่งขันเดินทน",
};

type Props = { params: Promise<{ eventId: string }> };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "ยังไม่เผยแพร่",
  SCHEDULED: "กำหนดการ",
  ONGOING: "กำลังดำเนินการอยู่",
  FINISHED: "จบการแข่งขันแล้ว",
};

export default async function TimekeeperJoinPage(props: Props) {
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
        heat_name: event.rounds[0]?.heatName ?? event.rounds[0]?.name ?? "",
        statusLabel: STATUS_LABEL[event.status] ?? event.status,
      }
    : null;

  return <TimekeeperJoinForm eventId={eventId} event={eventInfo} />;
}
