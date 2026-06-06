/**
 * Robust CSV parsing for the admin import flow. Wraps papaparse with the settings
 * we want everywhere: header-keyed rows, BOM stripping, case-insensitive +
 * trimmed header names (so column order/casing doesn't matter and unknown columns
 * are simply ignored by callers), and trimmed cell values. Quoted fields with
 * embedded commas/newlines and Thai UTF-8 text are handled by papaparse.
 *
 * Server-side only (used by import server actions / tests).
 */
import Papa from "papaparse";

export type CsvRow = Record<string, string>;

export type ParseResult = {
  rows: CsvRow[];
  headers: string[];
  /** Set only on a fatal parse failure (malformed quoting); callers should abort. */
  error?: string;
};

export function parseCsv(text: string): ParseResult {
  // Strip a leading UTF-8 BOM if present (Excel adds one on export).
  const clean = text.replace(/^﻿/, "");

  const res = Papa.parse<Record<string, unknown>>(clean, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  // papaparse reports ragged-row issues as non-fatal warnings; only treat genuine
  // structural failures (bad quoting) as fatal.
  const fatal = res.errors.find((e) => e.type === "Quotes" || e.code === "MissingQuotes");
  if (fatal) {
    return { rows: [], headers: res.meta.fields ?? [], error: `อ่านไฟล์ CSV ไม่สำเร็จ: ${fatal.message}` };
  }

  const rows: CsvRow[] = (res.data ?? []).map((raw) => {
    const row: CsvRow = {};
    for (const [k, v] of Object.entries(raw)) {
      if (k === "__parsed_extra") continue; // extra cells beyond the header
      row[k] = typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
    }
    return row;
  });

  return { rows, headers: res.meta.fields ?? [] };
}

/** Trimmed value for a header (empty string when the column is absent). */
export function pick(row: CsvRow, key: string): string {
  const v = row[key];
  return typeof v === "string" ? v.trim() : "";
}
