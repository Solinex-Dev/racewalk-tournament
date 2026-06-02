import { prisma } from "@/lib/prisma";
import type { Round, RoundAthlete } from "@prisma/client";

export async function loadOfficialRound(roundId: string): Promise<Round> {
  const round = await prisma.round.findUnique({
    where: { id: roundId, deletedAt: null },
  });
  if (!round) throw new Error("ไม่พบรอบที่ระบุ");
  return round;
}

/** Cards may only be issued while the round is actively in progress. */
export function assertRoundOngoingForCards(round: Pick<Round, "status">): void {
  if (round.status === "ONGOING") return;
  if (round.status === "FINISHED") {
    throw new Error("รอบนี้จบการแข่งขันแล้ว — ไม่สามารถออกใบได้");
  }
  throw new Error("รอบนี้ยังไม่เริ่ม — รอผู้ดูแลเริ่มจับเวลาก่อน");
}

/** Lap/finish recording requires an started ONGOING round. */
export function assertRoundOngoingForTiming(
  round: Pick<Round, "status" | "startedAt">,
): void {
  if (round.status === "FINISHED") {
    throw new Error("รอบนี้จบการแข่งขันแล้ว — ไม่สามารถบันทึกเวลาได้");
  }
  if (round.status !== "ONGOING" || !round.startedAt) {
    throw new Error("รอ Admin เริ่มจับเวลาก่อน");
  }
}

/** Head judge review while the round is still open. */
export function assertRoundOpenForReview(round: Pick<Round, "status">): void {
  if (round.status === "FINISHED") {
    throw new Error("รอบนี้จบการแข่งขันแล้ว — ไม่สามารถยืนยันใบได้");
  }
  if (round.status !== "ONGOING") {
    throw new Error("รอบนี้ยังไม่เริ่ม");
  }
}

export function assertAthleteActive(ra: Pick<RoundAthlete, "status">): void {
  if (ra.status === "DQ") throw new Error("นักกีฬาถูกตัดสิทธิ์แล้ว (DQ)");
  if (ra.status === "DNF") throw new Error("นักกีฬาถอนตัวแล้ว (DNF)");
}
