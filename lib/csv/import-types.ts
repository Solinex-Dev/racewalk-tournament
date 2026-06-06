/**
 * Shared types for the two-phase CSV import (preview → confirm). These are safe to
 * import from client components (the import dialog) — they carry NO server-only
 * deps and NO row payloads (the commit re-parses the file server-side).
 */

export type ImportEntity = "athlete" | "judge" | "affiliation";

export type RowVerdict = "create" | "update" | "error";

export type PreviewRow = {
  /** 1-based data row number (matches the spreadsheet row minus the header). */
  rowNumber: number;
  verdict: RowVerdict;
  /** Human label for the row (e.g. the person/affiliation name) for the table. */
  label: string;
  /** Why it errored, or notes (e.g. "จะสร้างองค์กรใหม่"). */
  reasons: string[];
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
  /** Set on a whole-file failure (bad CSV, missing required header, empty, too big). */
  topError?: string;
};

export type CommitResult = { created: number; updated: number };
