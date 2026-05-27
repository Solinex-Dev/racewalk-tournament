"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";

/**
 * Lightweight CSV parser — handles quoted fields and BOM.
 * Returns array of trimmed string-arrays.
 */
function parseCsv(csv: string): string[][] {
  const text = csv.replace(/^﻿/, ""); // strip BOM
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows: string[][] = [];
  for (const line of lines) {
    const fields: string[] = [];
    let i = 0;
    let cur = "";
    let inQuotes = false;
    while (i < line.length) {
      const ch = line[i]!;
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i += 2;
        } else if (ch === '"') {
          inQuotes = false;
          i++;
        } else {
          cur += ch;
          i++;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
          i++;
        } else if (ch === ",") {
          fields.push(cur.trim());
          cur = "";
          i++;
        } else {
          cur += ch;
          i++;
        }
      }
    }
    fields.push(cur.trim());
    rows.push(fields);
  }
  return rows;
}

export type ImportResult = {
  ok: boolean;
  imported: number;
  skipped: number;
  errors: string[];
};

/**
 * Import athletes from CSV. Expected format (header optional):
 *   name,country,affiliation_name
 *
 * - Country defaults to "TH" if blank
 * - Affiliation is auto-created if not exists
 * - Skips rows without a name
 */
export async function bulkImportAthletes(csv: string): Promise<ImportResult> {
  const rows = parseCsv(csv);
  if (rows.length === 0) return { ok: false, imported: 0, skipped: 0, errors: ["CSV ว่างเปล่า"] };

  // Detect & skip header row
  const first = rows[0]!.map((f) => f.toLowerCase());
  const hasHeader = first.includes("name") || first.includes("ชื่อ");
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;

  // Cache affiliations to avoid hitting DB per row
  const affCache = new Map<string, string>();
  const existingAffs = await prisma.affiliation.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
  });
  for (const a of existingAffs) affCache.set(a.name.trim().toLowerCase(), a.id);

  for (const [idx, row] of dataRows.entries()) {
    const rowNum = idx + (hasHeader ? 2 : 1);
    const [name, country, affName] = row;
    if (!name || name.length === 0) {
      skipped++;
      continue;
    }
    try {
      let affiliationId: string | null = null;
      const trimmedAff = affName?.trim();
      if (trimmedAff && trimmedAff.length > 0) {
        const key = trimmedAff.toLowerCase();
        if (affCache.has(key)) {
          affiliationId = affCache.get(key)!;
        } else {
          const created = await prisma.affiliation.create({
            data: { name: trimmedAff },
          });
          affCache.set(key, created.id);
          affiliationId = created.id;
        }
      }
      await prisma.athlete.create({
        data: {
          name: name.trim(),
          country: country?.trim().toUpperCase() || "TH",
          affiliationId,
        },
      });
      imported++;
    } catch (err) {
      errors.push(`แถวที่ ${rowNum}: ${err instanceof Error ? err.message : "เกิดข้อผิดพลาด"}`);
      skipped++;
    }
  }

  await logCurrentAdmin(ActivityLogAction.ATHLETES_BULK_IMPORTED, "Athlete", "bulk", {
    imported,
    skipped,
    errors: errors.slice(0, 5),
  });

  revalidatePath("/admin/athletes");
  revalidatePath("/admin/affiliations");
  return { ok: imported > 0, imported, skipped, errors };
}

/**
 * Import judges from CSV. Expected format (header optional):
 *   name
 */
export async function bulkImportJudges(csv: string): Promise<ImportResult> {
  const rows = parseCsv(csv);
  if (rows.length === 0) return { ok: false, imported: 0, skipped: 0, errors: ["CSV ว่างเปล่า"] };

  const first = rows[0]!.map((f) => f.toLowerCase());
  const hasHeader = first.includes("name") || first.includes("ชื่อ");
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;

  for (const [idx, row] of dataRows.entries()) {
    const rowNum = idx + (hasHeader ? 2 : 1);
    const name = row[0];
    if (!name || name.length === 0) {
      skipped++;
      continue;
    }
    try {
      await prisma.judge.create({ data: { name: name.trim() } });
      imported++;
    } catch (err) {
      errors.push(`แถวที่ ${rowNum}: ${err instanceof Error ? err.message : "เกิดข้อผิดพลาด"}`);
      skipped++;
    }
  }

  await logCurrentAdmin(ActivityLogAction.JUDGES_BULK_IMPORTED, "Judge", "bulk", {
    imported,
    skipped,
    errors: errors.slice(0, 5),
  });

  revalidatePath("/admin/judges");
  return { ok: imported > 0, imported, skipped, errors };
}
