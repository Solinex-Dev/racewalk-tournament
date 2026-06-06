/**
 * Field coercion + validation shared by CSV import. Each function returns a
 * discriminated Result so the import preview can attach a precise per-row reason.
 *
 * Storage forms (must match what the app stores):
 *   country  → ISO 3166-1 alpha-2 code ("TH"); import accepts a code OR a Thai/
 *              English country name and normalizes to the code (default "TH").
 *   province → canonical Thai name; import accepts the Thai name OR the English
 *              name; only allowed when country === "TH".
 *
 * Server-side only (pulls in i18n-iso-countries / geothai data).
 */
import { getCountryOptions, isValidCountry } from "@/lib/data/countries";
import { getProvinceOptions, isValidProvince } from "@/lib/data/provinces";

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

let countryNameMap: Map<string, string> | null = null;
function countryCodeByName(name: string): string | null {
  if (!countryNameMap) {
    countryNameMap = new Map();
    for (const o of getCountryOptions()) {
      countryNameMap.set(o.labelTh.toLowerCase(), o.value);
      countryNameMap.set(o.labelEn.toLowerCase(), o.value);
    }
  }
  return countryNameMap.get(name.toLowerCase()) ?? null;
}

/** Code ("TH"), Thai/English name → alpha-2. Empty → default "TH". */
export function normalizeCountry(input: string): Result<string> {
  const raw = input.trim();
  if (!raw) return { ok: true, value: "TH" };
  const code = raw.toUpperCase();
  if (code.length === 2 && isValidCountry(code)) return { ok: true, value: code };
  const byName = countryCodeByName(raw);
  if (byName) return { ok: true, value: byName };
  return { ok: false, error: `ประเทศไม่ถูกต้อง: "${raw}"` };
}

let provinceEnMap: Map<string, string> | null = null;
function provinceByEn(name: string): string | null {
  if (!provinceEnMap) {
    provinceEnMap = new Map();
    for (const o of getProvinceOptions()) provinceEnMap.set(o.labelEn.toLowerCase(), o.value);
  }
  return provinceEnMap.get(name.toLowerCase()) ?? null;
}

/** Thai/English province name → canonical Thai name. Non-TH country must be empty. */
export function normalizeProvince(input: string, countryCode: string): Result<string | null> {
  const raw = input.trim();
  if (countryCode !== "TH") {
    if (raw) return { ok: false, error: "ระบุจังหวัดได้เฉพาะประเทศไทย (TH)" };
    return { ok: true, value: null };
  }
  if (!raw) return { ok: true, value: null };
  if (isValidProvince(raw)) return { ok: true, value: raw };
  const en = provinceByEn(raw);
  if (en) return { ok: true, value: en };
  return { ok: false, error: `จังหวัดไม่ถูกต้อง: "${raw}"` };
}

/** Accept YYYY-MM-DD (date-only). Empty → null. */
export function parseDateOnly(input: string): Result<Date | null> {
  const raw = input.trim();
  if (!raw) return { ok: true, value: null };
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!m) return { ok: false, error: `วันที่ต้องเป็นรูปแบบ YYYY-MM-DD: "${raw}"` };
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return { ok: false, error: `วันที่ไม่ถูกต้อง: "${raw}"` };
  return { ok: true, value: d };
}

/** ACTIVE | INACTIVE (case-insensitive). Empty → ACTIVE. */
export function normalizeJudgeStatus(input: string): Result<"ACTIVE" | "INACTIVE"> {
  const raw = input.trim().toUpperCase();
  if (!raw) return { ok: true, value: "ACTIVE" };
  if (raw === "ACTIVE" || raw === "INACTIVE") return { ok: true, value: raw };
  return { ok: false, error: `สถานะต้องเป็น ACTIVE หรือ INACTIVE: "${input.trim()}"` };
}
