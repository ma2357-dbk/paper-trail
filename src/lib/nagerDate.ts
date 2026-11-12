import "server-only";
import { addWorkingDays, countWorkingDays } from "./workingDays";

/**
 * Nager.Date public-holiday API (https://date.nager.at), used to turn
 * "5–10 working days" into real dates for the waiting screen and reminders.
 *
 * Server-only. Responses are cached by Next.js for a day per (year, country).
 * Every failure mode is mapped to a `reason` so screens can explain the
 * fallback (weekends only) instead of crashing.
 */

// Overridable so a reviewer can demonstrate the failure states without
// cutting the network (e.g. NAGER_DATE_BASE_URL=http://127.0.0.1:9/api/v3).
const BASE_URL = process.env.NAGER_DATE_BASE_URL ?? "https://date.nager.at/api/v3";
const TIMEOUT_MS = 5000;

export type HolidayFailure =
  | "offline"
  | "timeout"
  | "rate-limited"
  | "unsupported-country"
  | "server-error"
  | "malformed";

export type Holiday = { date: string; localName: string; name: string };

export type HolidayResult =
  | { ok: true; holidays: Holiday[] }
  | { ok: false; reason: HolidayFailure };

function isHoliday(value: unknown): value is Holiday & { global?: boolean; counties?: string[] | null } {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.date) &&
    typeof v.localName === "string" &&
    typeof v.name === "string"
  );
}

/** Public holidays of one country for one year. Regional holidays (counties set) are excluded. */
export async function getPublicHolidays(
  year: number,
  countryCode: string,
): Promise<HolidayResult> {
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return { ok: false, reason: "unsupported-country" };
  }
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/PublicHolidays/${year}/${countryCode}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 60 * 60 * 24 },
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    return { ok: false, reason: name === "TimeoutError" || name === "AbortError" ? "timeout" : "offline" };
  }

  if (response.status === 404) return { ok: false, reason: "unsupported-country" };
  if (response.status === 429) return { ok: false, reason: "rate-limited" };
  if (!response.ok) return { ok: false, reason: "server-error" };

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!Array.isArray(body) || !body.every(isHoliday)) {
    return { ok: false, reason: "malformed" };
  }
  const holidays = body
    .filter((h) => h.global !== false || !h.counties)
    .map(({ date, localName, name }) => ({ date, localName, name }));
  return { ok: true, holidays };
}

export type WaitEstimate = {
  earliest: Date;
  latest: Date;
  /** Working days elapsed since submission, for the progress bar. */
  elapsedWorkingDays: number;
  /** Null when Nager.Date answered; otherwise why the estimate ignores holidays. */
  fallback: HolidayFailure | null;
  /** Holidays that fall inside the waiting window, to show on the screen. */
  holidaysInWindow: Holiday[];
};

/**
 * Expected reply window for a step submitted on `submittedAt`. Falls back to
 * weekends-only when holidays cannot be loaded; the caller shows `fallback`.
 */
export async function estimateReplyWindow(
  submittedAt: Date,
  minWorkingDays: number,
  maxWorkingDays: number,
  countryCode: string | null,
  now = new Date(),
): Promise<WaitEstimate> {
  const years = new Set([submittedAt.getUTCFullYear(), submittedAt.getUTCFullYear() + 1]);
  const holidays: Holiday[] = [];
  let fallback: HolidayFailure | null = null;

  if (!countryCode) {
    fallback = "unsupported-country";
  } else {
    for (const year of years) {
      const result = await getPublicHolidays(year, countryCode);
      if (result.ok) {
        holidays.push(...result.holidays);
      } else {
        fallback = result.reason;
        break;
      }
    }
  }

  const holidaySet = new Set(fallback ? [] : holidays.map((h) => h.date));
  const earliest = addWorkingDays(submittedAt, minWorkingDays, holidaySet);
  const latest = addWorkingDays(submittedAt, maxWorkingDays, holidaySet);
  const latestKey = latest.toISOString().slice(0, 10);
  const submittedKey = submittedAt.toISOString().slice(0, 10);

  return {
    earliest,
    latest,
    elapsedWorkingDays: countWorkingDays(submittedAt, now, holidaySet),
    fallback,
    holidaysInWindow: holidays.filter((h) => h.date > submittedKey && h.date <= latestKey),
  };
}
