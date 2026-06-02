/**
 * Laps completed, for display.
 *
 * The final crossing of a race is stored as the FinishTime (not a lap row), so a
 * finish counts as the last lap: completed = lapRows + (finished ? 1 : 0).
 *
 * Clamped to lapCount so it can never display more laps than the race has — this
 * guards against dirty data (e.g. a leftover final-lap row sitting alongside a
 * finish, which would otherwise read as N+1 / N).
 */
export function lapsCompleted(
  lapRows: number,
  hasFinish: boolean,
  lapCount: number,
): number {
  const raw = lapRows + (hasFinish ? 1 : 0);
  return lapCount > 0 ? Math.min(raw, lapCount) : raw;
}
