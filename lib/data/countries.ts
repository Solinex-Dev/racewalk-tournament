/**
 * Country reference data — server-side wrapper around `i18n-iso-countries`.
 *
 * Countries are stored across the app as ISO 3166-1 **alpha-2** codes ("TH").
 * This module produces the option list (Thai + English label) for the form
 * comboboxes and resolves a code → Thai label for display. Keep imports of this
 * module on the server (pages/actions/seed) and pass options to client forms as
 * props, so the i18n locale data is not bundled into the client.
 */
import countries from "i18n-iso-countries";
import thLocale from "i18n-iso-countries/langs/th.json";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(thLocale);
countries.registerLocale(enLocale);

export type CountryOption = { value: string; labelTh: string; labelEn: string };

let cachedOptions: CountryOption[] | null = null;

/** All ISO countries as `{ value: alpha2, labelTh, labelEn }`, Thailand first. */
export function getCountryOptions(): CountryOption[] {
  if (cachedOptions) return cachedOptions;
  const th = countries.getNames("th", { select: "official" });
  const en = countries.getNames("en", { select: "official" });
  const options = Object.keys(th).map((alpha2) => ({
    value: alpha2,
    labelTh: th[alpha2] ?? en[alpha2] ?? alpha2,
    labelEn: en[alpha2] ?? alpha2,
  }));
  options.sort((a, b) => {
    if (a.value === "TH") return -1;
    if (b.value === "TH") return 1;
    return a.labelTh.localeCompare(b.labelTh, "th");
  });
  cachedOptions = options;
  return options;
}

/** Country options shaped for the searchable `<Combobox>` (Thai label, EN keyword). */
export function getCountryComboboxOptions(): { value: string; label: string; keywords: string[] }[] {
  return getCountryOptions().map((o) => ({
    value: o.value,
    label: o.labelTh,
    keywords: [o.labelEn, o.value],
  }));
}

/** Resolve an alpha-2 code to its Thai country name (falls back to the code). */
export function countryLabel(code: string | null | undefined): string {
  if (!code) return "";
  return countries.getName(code, "th", { select: "official" }) ?? code;
}

/** Whether an alpha-2 code is a valid ISO country. */
export function isValidCountry(code: string | null | undefined): boolean {
  return Boolean(code && countries.isValid(code));
}
