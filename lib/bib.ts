/**
 * BIB number helpers.
 *
 * Each athlete's BIB encodes their 5-year age band:
 *   BIB = [age-band lower bound][3-digit sequence]
 *   e.g. "65001" → age band 65-69, athlete #1
 *        "105001" → age band 105-109, athlete #1   (note: 6 digits!)
 *
 * The age prefix is 2 digits for bands 10-95 and 3 digits for 100+, so a BIB is
 * 5 OR 6 characters — it must NOT be locked to a fixed length. The trailing 3
 * digits are always the in-band sequence.
 */

export type BibAgeGroup = {
  /** Lower bound of the 5-year band, e.g. 65. */
  ageStart: number;
  /** Display label, e.g. "65-69". */
  label: string;
  /** In-band sequence number (the trailing 3 digits), e.g. 1. */
  sequence: number;
};

/**
 * Parse a BIB into its age band + sequence. Returns null when the value does not
 * match the expected `[age][3-digit seq]` shape or the age band is not a valid
 * 5-year band (multiple of 5, ≥ 10).
 */
export function parseBibAgeGroup(bib: string | null | undefined): BibAgeGroup | null {
  if (!bib) return null;
  const m = /^(\d{2,3})(\d{3})$/.exec(bib.trim());
  if (!m) return null;
  const ageStart = Number(m[1]);
  if (ageStart < 10 || ageStart % 5 !== 0) return null;
  return { ageStart, label: `${ageStart}-${ageStart + 4}`, sequence: Number(m[2]) };
}

/** Just the age-band lower bound encoded in the BIB (e.g. 65), or null. */
export function bibAgeStart(bib: string | null | undefined): number | null {
  return parseBibAgeGroup(bib)?.ageStart ?? null;
}

/** Display label for an age band lower bound, e.g. 65 → "65-69". */
export function ageGroupLabel(ageStart: number): string {
  return `${ageStart}-${ageStart + 4}`;
}

/**
 * Distinct age bands present across a set of BIBs, sorted ascending. BIBs that do
 * not parse as a masters BIB are ignored.
 */
export function ageGroupsFromBibs(bibs: Iterable<string | null | undefined>): number[] {
  const set = new Set<number>();
  for (const b of bibs) {
    const start = bibAgeStart(b);
    if (start !== null) set.add(start);
  }
  return [...set].sort((a, b) => a - b);
}

/**
 * Parse a comma-separated `ageGroups` query value (e.g. "50,55,60") into a sorted
 * list of valid masters age-band lower bounds. Returns [] when nothing valid is
 * selected — callers treat an empty result as "no age filter".
 */
export function parseAgeGroupsParam(raw: string | null | undefined): number[] {
  if (!raw) return [];
  const set = new Set<number>();
  for (const part of raw.split(",")) {
    const n = Number(part.trim());
    if (Number.isInteger(n) && n >= 10 && n % 5 === 0) set.add(n);
  }
  return [...set].sort((a, b) => a - b);
}

/**
 * True when the BIB's age band is in the selected set. An empty/undefined set
 * means "no filter" → always true.
 */
export function bibMatchesAgeGroups(
  bib: string | null | undefined,
  ageGroups: number[] | null | undefined,
): boolean {
  if (!ageGroups || ageGroups.length === 0) return true;
  const start = bibAgeStart(bib);
  return start !== null && ageGroups.includes(start);
}
