/**
 * Working-day arithmetic. Pure functions, no I/O: dates are compared by their
 * UTC calendar day ("YYYY-MM-DD"), which is how Nager.Date reports holidays.
 */

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/** True when the UTC calendar day is Saturday, Sunday or one of the given holidays. */
export function isWorkingDay(date: Date, holidays: ReadonlySet<string>): boolean {
  return !isWeekend(date) && !holidays.has(toDateKey(date));
}

/**
 * Returns the date `count` working days after `start` (start itself does not
 * count). Time of day is reset to 00:00 UTC so the result is a plain day.
 */
export function addWorkingDays(
  start: Date,
  count: number,
  holidays: ReadonlySet<string>,
): Date {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(`count must be a non-negative integer, got ${count}`);
  }
  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );
  let remaining = count;
  while (remaining > 0) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (isWorkingDay(cursor, holidays)) {
      remaining -= 1;
    }
  }
  return cursor;
}

/** Number of working days strictly after `from` up to and including `to`; 0 when `to` is not later. */
export function countWorkingDays(
  from: Date,
  to: Date,
  holidays: ReadonlySet<string>,
): number {
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  let total = 0;
  while (cursor < end) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (isWorkingDay(cursor, holidays)) {
      total += 1;
    }
  }
  return total;
}
