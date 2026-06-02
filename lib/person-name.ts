/**
 * Person-name helpers. People (Athlete / Judge / admin User) store structured
 * `prefix` / `firstName` / `lastName`, plus a denormalized `name` kept in sync
 * via {@link composeName} so the many existing read sites (scoreboard, reports,
 * exports, logs) keep working unchanged.
 */

/** Preset prefixes; the combobox is creatable so others (ดร., ผศ.ดร. …) are allowed. */
export const PREFIX_OPTIONS = ["นาย", "นาง", "นางสาว"] as const;

export type PersonNameParts = {
  prefix?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

/** Build the denormalized display name from structured parts (space-joined). */
export function composeName(parts: PersonNameParts): string {
  return [parts.prefix, parts.firstName, parts.lastName]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" ");
}
