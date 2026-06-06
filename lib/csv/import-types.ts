/**
 * Shared types for the two-phase CSV import (preview → confirm). These are safe to
 * import from client components (the import dialog) — they carry NO server-only
 * deps and NO row payloads (the commit re-parses the file server-side).
 */

export type ImportEntity = "athlete" | "judge" | "affiliation";

/**
 * CSV column order per entity — the single source of truth shared by the export
 * routes, the import template download, and (implicitly) the importer. Client-safe
 * (no server deps), so the import dialog can build a header-only template offline.
 */
export const CSV_HEADERS: Record<ImportEntity, readonly string[]> = {
  athlete: [
    "id", "prefix", "first_name", "middle_name", "last_name",
    "country", "province", "club", "affiliation_id", "affiliation_name", "note",
  ],
  judge: [
    "id", "prefix", "first_name", "middle_name", "last_name",
    "country", "province", "status",
    "organization_id", "organization_name", "department_id", "department_name", "note",
  ],
  affiliation: [
    "id", "name", "country", "province",
    "head_judge_id", "head_judge_name", "joined_at", "note",
  ],
};

export type RowVerdict = "create" | "update" | "error";

export type PreviewRow = {
  /** 1-based data row number (matches the spreadsheet row minus the header). */
  rowNumber: number;
  verdict: RowVerdict;
  /** Human label for the row (e.g. the person/affiliation name) for the table. */
  label: string;
  /** Why it errored, or notes (e.g. "จะสร้างองค์กรใหม่"). */
  reasons: string[];
  /**
   * Set on a CREATE row whose every imported field is identical to another row
   * ("file", `group` = the first row number of the group) or to a live existing
   * record ("db"). A warning the operator resolves by (de)selecting rows.
   */
  dup?: { kind: "file" | "db"; group?: number };
};

/**
 * One group of content-identical records, surfaced in the preview's "duplicates"
 * table. `existingLabel` is set when the group matches a live record already in the
 * system (kind "db"); `incoming` lists the import rows that share the same content.
 */
export type DupGroup = {
  kind: "file" | "db";
  existingLabel?: string;
  incoming: { rowNumber: number; label: string }[];
};

export type ImportCounts = {
  create: number;
  update: number;
  error: number;
  total: number;
};

export type ImportPreview = {
  entity: ImportEntity;
  counts: ImportCounts;
  rows: PreviewRow[];
  /** Content-duplicate groups (in-file + vs existing DB records) for the detail table. */
  dupGroups?: DupGroup[];
  /** Set on a whole-file failure (bad CSV, missing required header, empty, too big). */
  topError?: string;
};

export type CommitResult = { created: number; updated: number };
