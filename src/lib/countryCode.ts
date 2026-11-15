/** Accepts only a two-letter ISO 3166-1 code; anything else means "no country". */
export function parseCountryCode(value: FormDataEntryValue | null): string | null {
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  return /^[A-Z]{2}$/.test(code) ? code : null;
}