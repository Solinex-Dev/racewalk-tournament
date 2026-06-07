/**
 * Changelog loader for the Root-Admin About page.
 *
 * Source of truth is the repo-tracked CHANGELOG.json (flat array, newest-first).
 * Imported statically (resolveJsonModule) so it ships with the build and reflects
 * the deployed version. Entries are validated/normalised at read time so a
 * malformed hand-edit can't crash the page.
 *
 * To add a release note: prepend an entry to CHANGELOG.json (newest at the top).
 */
import data from "@/CHANGELOG.json";

export const CHANGELOG_TYPES = [
  "feature",
  "fix",
  "perf",
  "security",
  "docs",
  "chore",
  "breaking",
] as const;

export type ChangelogType = (typeof CHANGELOG_TYPES)[number];

export type ChangelogEntry = {
  date: string; // ISO YYYY-MM-DD
  version: string;
  type: ChangelogType;
  title: string;
  details?: string;
};

/** Plain-text label per change type. */
export const CHANGELOG_TYPE_LABEL: Record<ChangelogType, string> = {
  feature: "Feature",
  fix: "Fix",
  perf: "Performance",
  security: "Security",
  docs: "Docs",
  chore: "Chore",
  breaking: "Breaking",
};

function isChangelogType(v: unknown): v is ChangelogType {
  return typeof v === "string" && (CHANGELOG_TYPES as readonly string[]).includes(v);
}

/**
 * Validated, newest-first changelog entries. Skips entries missing a title/date;
 * coerces an unknown `type` to "chore" so it still renders.
 */
export function getChangelog(): ChangelogEntry[] {
  const arr: unknown[] = Array.isArray(data) ? data : [];
  const entries = arr.flatMap((raw): ChangelogEntry[] => {
    if (typeof raw !== "object" || raw === null) return [];
    const o = raw as Record<string, unknown>;
    if (typeof o.title !== "string" || typeof o.date !== "string") return [];
    return [
      {
        date: o.date,
        version: typeof o.version === "string" ? o.version : "",
        type: isChangelogType(o.type) ? o.type : "chore",
        title: o.title,
        details: typeof o.details === "string" ? o.details : undefined,
      },
    ];
  });
  // Stable sort, newest date first (file is authored newest-first; ties keep order).
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}
