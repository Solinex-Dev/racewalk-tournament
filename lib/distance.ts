/**
 * Distance is STORED in the database in kilometres (the `distanceKm` columns),
 * but the whole UI now presents and accepts METRES. These helpers convert at the
 * boundary. The rounding kills floating-point drift — e.g. 0.4005 * 1000 would
 * otherwise be 400.49999999999994.
 *
 * Keeping storage in km means scheduling (pace = 5 min/km) and the seed data stay
 * untouched; only presentation/input changes.
 */

/** Stored km string → metres string, for display and form inputs. "" if empty/invalid. */
export function metersFromKm(km: string | null | undefined): string {
  if (km == null || km === "") return "";
  const n = Number(km);
  if (!Number.isFinite(n)) return "";
  return String(Math.round(n * 1000 * 1000) / 1000); // round to 0.001 m
}

/** Metres string (from a form) → km string, for storage. "" if empty/invalid. */
export function kmFromMeters(meters: string | null | undefined): string {
  if (meters == null || meters === "") return "";
  const n = Number(meters);
  if (!Number.isFinite(n)) return "";
  return String(Math.round((n / 1000) * 1_000_000) / 1_000_000); // 0.001 m precision
}

/** Stored km value → "20000 ม." label (empty string if no distance). */
export function metersLabelFromKm(km: string | null | undefined): string {
  const m = metersFromKm(km);
  return m === "" ? "" : `${m} ม.`;
}
