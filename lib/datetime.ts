/**
 * Timezone-aware date/time formatting for server-generated output (exports,
 * PDFs, CSV). The app's audience is in Thailand, so wall-clock times must be
 * shown in Asia/Bangkok (+07) regardless of the server's timezone — otherwise a
 * UTC production server prints times 7 hours behind what officials saw on the
 * moderator/judge screens (those render client-side in the browser's timezone).
 *
 * All helpers accept null/undefined and return "" so call sites stay terse.
 */

export const BANGKOK_TZ = "Asia/Bangkok";

type D = Date | null | undefined;

/** HH:MM in Bangkok time (24h). */
export function bangkokTime(dt: D): string {
  if (!dt) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BANGKOK_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(dt);
}

/** HH:MM:SS in Bangkok time (24h). */
export function bangkokTimeSec(dt: D): string {
  if (!dt) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BANGKOK_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(dt);
}

/** Thai long date in Bangkok time, e.g. "15 มีนาคม 2568". */
export function bangkokDateThai(dt: D): string {
  if (!dt) return "";
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: BANGKOK_TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dt);
}

/** Thai date + time in Bangkok, e.g. "15 มี.ค. 2568 08:00:30". */
export function bangkokDateTimeThai(dt: D): string {
  if (!dt) return "";
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: BANGKOK_TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(dt);
}

/** ISO-style date in Bangkok, "YYYY-MM-DD" (for CSV / machine-friendly output). */
export function bangkokDateISO(dt: D): string {
  if (!dt) return "";
  // sv-SE formats as ISO "YYYY-MM-DD".
  return new Intl.DateTimeFormat("sv-SE", { timeZone: BANGKOK_TZ }).format(dt);
}

/** ISO-style date+time in Bangkok, "YYYY-MM-DD HH:MM:SS" (for CSV). */
export function bangkokDateTimeISO(dt: D): string {
  if (!dt) return "";
  // sv-SE yields "YYYY-MM-DD HH:MM:SS".
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: BANGKOK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(dt);
}
