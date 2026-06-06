/**
 * CSV serialization shared by the admin data-export routes (athletes / judges /
 * affiliations). Mirrors the proven approach in the event export route: RFC-4180
 * quoting + a leading UTF-8 BOM so Excel opens Thai text correctly + CRLF rows.
 */

/** Quote a field if it contains a comma, quote, or newline; double interior quotes. */
export function escapeCsv(field: string | number | null | undefined): string {
  if (field === null || field === undefined) return "";
  const s = String(field);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

/** Build a full CSV document (BOM + header row + data rows, CRLF-joined). */
export function toCsv(
  headers: readonly string[],
  rows: readonly (readonly (string | number | null | undefined)[])[],
): string {
  const lines = [
    headers.map(escapeCsv).join(","),
    ...rows.map((r) => r.map(escapeCsv).join(",")),
  ];
  // U+FEFF BOM so Excel detects UTF-8.
  return "﻿" + lines.join("\r\n");
}
