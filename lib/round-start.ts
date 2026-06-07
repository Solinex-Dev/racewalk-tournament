import type { OfficialPosition } from "@prisma/client";

/**
 * A round can only start once it has at least one of EACH of these officials
 * assigned (non-deleted). EVENT_LOGGER is the lap-time keeper.
 * Single source of truth shared by the startRound action and the moderator UI.
 */
export const REQUIRED_START_POSITIONS: OfficialPosition[] = [
  "HEAD_JUDGE",
  "JUDGE",
  "EVENT_LOGGER",
];

/** Thai labels per position (matches POSITION_LABEL on the moderator page). */
export const POSITION_LABEL_TH: Record<OfficialPosition, string> = {
  HEAD_JUDGE: "หัวหน้ากรรมการ",
  JUDGE: "กรรมการ",
  EVENT_LOGGER: "ผู้เก็บ Lap Time",
};

/**
 * Given the positions present on a round (already filtered to non-deleted
 * officials), return the required positions that are still MISSING. An empty
 * array means the round may start.
 */
export function missingStartRoles(
  present: OfficialPosition[],
): OfficialPosition[] {
  const have = new Set(present);
  return REQUIRED_START_POSITIONS.filter((p) => !have.has(p));
}
