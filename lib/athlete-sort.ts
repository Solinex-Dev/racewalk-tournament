/**
 * Shared finish-order comparator for athlete tables — the single source of
 * truth for "leaderboard order". Used by the public scoreboard, the moderator
 * view, and the moderator edit view so every surface ranks athletes the same:
 *
 *   1. in-standing (status OK) athletes first; DQ / DNF sink to the bottom
 *   2. athletes still racing, by furthest lap reached (descending) — these stay
 *      at the top so the live action is always visible on screen
 *   3. athletes who have finished, by finish position (1, 2, 3, …) — these sink
 *      below the still-racing athletes (but remain above DQ / DNF)
 *   4. bib number as the final tiebreak
 */
export type SortableAthlete = {
  status: "OK" | "DQ" | "DNF";
  position: number | null;
  isFinished: boolean;
  currentLap: number;
  bib: string;
};

export function compareAthletesByFinish(a: SortableAthlete, b: SortableAthlete): number {
  const aActive = a.status === "OK" ? 0 : 1;
  const bActive = b.status === "OK" ? 0 : 1;
  if (aActive !== bActive) return aActive - bActive;
  // Within the in-standing (OK) group: still-racing athletes rank ABOVE finishers.
  if (a.isFinished && b.isFinished) return (a.position || 999) - (b.position || 999);
  if (a.isFinished) return 1; // a finished, b still racing → a sinks below b
  if (b.isFinished) return -1; // b finished, a still racing → a stays above b
  if (a.currentLap !== b.currentLap) return b.currentLap - a.currentLap;
  return a.bib.localeCompare(b.bib);
}
