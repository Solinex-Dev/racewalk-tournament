/**
 * Shared race-time formatting helpers.
 *
 * Times across the app are stored as integer milliseconds (LapTime.timeMs,
 * FinishTime.timeMs). Several components previously kept their own local
 * `formatMs` copy — this is the single source of truth.
 */

/** Format a duration in milliseconds as `HH:MM:SS` (negatives clamp to 0). */
export function formatRaceTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Parse a `H:MM:SS` / `MM:SS` / `SS` time string into milliseconds.
 * Returns null when the input is not a valid time. Mirrors the inverse of
 * {@link formatRaceTime} used by the moderator edit dialogs.
 */
export function parseRaceTime(str: string): number | null {
  const parts = str.trim().split(":").map((p) => Number(p));
  if (parts.length === 0 || parts.some((p) => Number.isNaN(p))) return null;
  if (parts.length === 1) return parts[0]! * 1000;
  if (parts.length === 2) return (parts[0]! * 60 + parts[1]!) * 1000;
  if (parts.length === 3) return (parts[0]! * 3600 + parts[1]! * 60 + parts[2]!) * 1000;
  return null;
}
