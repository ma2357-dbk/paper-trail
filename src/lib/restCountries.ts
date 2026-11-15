import "server-only";

/**
 * REST Countries API v5 (https://restcountries.com/docs/countries), used for the country picker.
 * The chosen ISO code is stored on the journey and passed to Nager.Date for holidays.
 *
 * v5 needs a free API key (RESTCOUNTRIES_API_KEY), so this runs on the server only and the key
 * never reaches the browser. Nothing about the user is sent. The free plan allows pages of 100,
 * so the ~250 countries take three requests; the result is cached by Next.js for a day.
 * Every failure mode is mapped to a `reason`; the screen then shows a short built-in list of
 * European countries (names still localised) so the picker keeps working.
 */

const BASE_URL = "https://api.restcountries.com/countries/v5";
const PAGE_SIZE = 100; // maximum on the free plan
const MAX_PAGES = 5;
const TIMEOUT_MS = 5000;

/** Shown when the API cannot be used: European countries, names come from Intl.DisplayNames. */
const FALLBACK_CODES = [
  "AL", "AT", "BA", "BE", "BG", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GB", "GR", "HR",
  "HU", "IE", "IS", "IT", "LI", "LT", "LU", "LV", "ME", "MK", "MT", "NL", "NO", "PL", "PT", "RO", "RS",
  "SE", "SI", "SK", "UA",
];

export type CountryFailure =
  | "not-configured"
  | "offline"
  | "timeout"
  | "unauthorized"
  | "quota"
  | "rate-limited"
  | "server-error"
  | "malformed"
  | "empty";

export type Country = { code: string; name: string };

export type CountriesResult = {
  countries: Country[];
  /** Null when the API answered; otherwise why the short built-in list is shown instead. */
  fallback: CountryFailure | null;
};

type RawCountry = { names: { common: string }; codes: { alpha_2: string } };

type Page = { ok: true; objects: RawCountry[]; more: boolean } | { ok: false; reason: CountryFailure };

function isRawCountry(value: unknown): value is RawCountry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as { names?: { common?: unknown }; codes?: { alpha_2?: unknown } };
  return (
    typeof v.names?.common === "string" &&
    typeof v.codes?.alpha_2 === "string" &&
    /^[A-Z]{2}$/.test(v.codes.alpha_2)
  );
}

async function fetchPage(offset: number, apiKey: string): Promise<Page> {
  const url = `${BASE_URL}?response_fields=names.common,codes.alpha_2&limit=${PAGE_SIZE}&offset=${offset}`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { accept: "application/json", authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 60 * 60 * 24 },
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    return { ok: false, reason: name === "TimeoutError" || name === "AbortError" ? "timeout" : "offline" };
  }

  if (response.status === 401) return { ok: false, reason: "unauthorized" };
  if (response.status === 403) return { ok: false, reason: "quota" };
  if (response.status === 429) return { ok: false, reason: "rate-limited" };
  if (!response.ok) return { ok: false, reason: "server-error" };

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, reason: "malformed" };
  }
  const data = (body as { data?: { objects?: unknown; meta?: { more?: unknown } } } | null)?.data;
  if (!data || !Array.isArray(data.objects)) return { ok: false, reason: "malformed" };
  return { ok: true, objects: data.objects.filter(isRawCountry), more: data.meta?.more === true };
}

/** Names in the user's language from the platform's own data; falls back to the given name. */
function toCountries(entries: { code: string; fallbackName: string }[], locale: string): Country[] {
  let displayNames: Intl.DisplayNames | null = null;
  try {
    displayNames = new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    // unknown locale: keep the fallback names
  }
  return entries
    .map(({ code, fallbackName }) => {
      let name = fallbackName;
      try {
        name = displayNames?.of(code) ?? fallbackName;
      } catch {
        // unknown region code: keep the fallback name
      }
      return { code, name };
    })
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

function fallbackList(locale: string, reason: CountryFailure): CountriesResult {
  const entries = FALLBACK_CODES.map((code) => ({ code, fallbackName: code }));
  return { countries: toCountries(entries, locale), fallback: reason };
}

/** All countries with names in `locale`, or the short built-in list with the reason why. */
export async function getCountries(locale: string): Promise<CountriesResult> {
  const apiKey = process.env.RESTCOUNTRIES_API_KEY?.trim();
  if (!apiKey) return fallbackList(locale, "not-configured");

  const all: RawCountry[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await fetchPage(page * PAGE_SIZE, apiKey);
    if (!result.ok) return fallbackList(locale, result.reason);
    all.push(...result.objects);
    if (!result.more) break;
  }
  if (all.length === 0) return fallbackList(locale, "empty");

  const entries = all.map((country) => ({ code: country.codes.alpha_2, fallbackName: country.names.common }));
  return { countries: toCountries(entries, locale), fallback: null };
}