/**
 * Content-based duplicate detection for CSV import. Pure + client-safe (no server
 * deps) so it's unit-testable. A "duplicate" is a CREATE row whose content key
 * equals another create row in the file or a live existing record — i.e. EVERY
 * imported field matches (name-only matches are NOT duplicates).
 */
import type { RowVerdict, DupGroup } from "@/lib/csv/import-types";

export type Dup = { kind: "file" | "db"; group?: number };

// Control char unlikely to appear in data — keeps "ab"+"c" ≠ "a"+"bc".
const KEY_SEP = "";

/** Build a content key from imported field values (trimmed, lowercased, joined). */
export function keyOf(parts: (string | null | undefined)[]): string {
  return parts.map((v) => (v ?? "").toString().trim().toLowerCase()).join(KEY_SEP);
}

export type Dupable = { rowNumber: number; verdict: RowVerdict; key: string | null; dup?: Dup };

/** Anything with a `.has(key)` membership check — a Set of keys or a key→label Map. */
type KeyLookup = { has(key: string): boolean };

/**
 * Flag CREATE rows whose content key repeats in the file ("file", `group` = first
 * row of the group) or matches a live existing record ("db", takes precedence).
 * Mutates each row's `dup` in place.
 */
export function markDuplicates(rows: Dupable[], existingKeys: KeyLookup): void {
  const groups = new Map<string, number[]>();
  for (const r of rows) {
    if (r.verdict === "create" && r.key) {
      groups.set(r.key, [...(groups.get(r.key) ?? []), r.rowNumber]);
    }
  }
  for (const r of rows) {
    if (r.verdict !== "create" || !r.key) continue;
    if (existingKeys.has(r.key)) {
      r.dup = { kind: "db" };
      continue;
    }
    const g = groups.get(r.key);
    if (g && g.length > 1) r.dup = { kind: "file", group: g[0] };
  }
}

type Labeled = { rowNumber: number; verdict: RowVerdict; label: string; key: string | null };

/**
 * Build the detail list of duplicate groups for the preview's secondary table.
 * A CREATE row's content key that matches a live record yields a "db" group (with
 * the existing record's label); otherwise ≥2 create rows sharing a key yield an
 * "file" group. Each group lists every incoming row that shares the content.
 */
export function collectDupGroups(rows: Labeled[], existingByKey: Map<string, string>): DupGroup[] {
  const byKey = new Map<string, Labeled[]>();
  for (const r of rows) {
    if (r.verdict === "create" && r.key) byKey.set(r.key, [...(byKey.get(r.key) ?? []), r]);
  }
  const groups: DupGroup[] = [];
  for (const [key, group] of byKey) {
    const existingLabel = existingByKey.get(key);
    const incoming = group.map((r) => ({ rowNumber: r.rowNumber, label: r.label }));
    if (existingLabel !== undefined) groups.push({ kind: "db", existingLabel, incoming });
    else if (group.length > 1) groups.push({ kind: "file", incoming });
  }
  return groups;
}
