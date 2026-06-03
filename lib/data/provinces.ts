/**
 * Thai province reference data — server-side wrapper around `geothai`.
 *
 * Provinces are stored as their canonical **Thai name** (e.g. "กรุงเทพมหานคร"),
 * chosen from this list so values stay consistent (no free-text typos). Keep
 * imports server-side (pages/actions/seed) and pass options to client forms as
 * props — `geothai` bundles full district/subdistrict data we don't want on the
 * client.
 */
import { getAllProvinces } from "geothai";

export type ProvinceOption = { value: string; labelTh: string; labelEn: string };

let cachedOptions: ProvinceOption[] | null = null;
let cachedNames: Set<string> | null = null;

/** All 77 Thai provinces as `{ value: thaiName, labelTh, labelEn }`. */
export function getProvinceOptions(): ProvinceOption[] {
  if (cachedOptions) return cachedOptions;
  cachedOptions = getAllProvinces()
    .map((p) => ({ value: p.name_th, labelTh: p.name_th, labelEn: p.name_en }))
    .sort((a, b) => a.labelTh.localeCompare(b.labelTh, "th"));
  return cachedOptions;
}

/** Province options shaped for the searchable `<Combobox>` (Thai label, EN keyword). */
export function getProvinceComboboxOptions(): { value: string; label: string; keywords: string[] }[] {
  return getProvinceOptions().map((o) => ({
    value: o.value,
    label: o.labelTh,
    keywords: [o.labelEn],
  }));
}

/** Whether a string is a canonical Thai province name. */
export function isValidProvince(name: string | null | undefined): boolean {
  if (!name) return false;
  cachedNames ??= new Set(getAllProvinces().map((p) => p.name_th));
  return cachedNames.has(name);
}
