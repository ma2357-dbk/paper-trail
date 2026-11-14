import assert from "node:assert/strict";
import { test } from "node:test";
import { addWorkingDays, countWorkingDays, isWorkingDay, toDateKey } from "./workingDays";

const none = new Set<string>();

test("skips the weekend", () => {
  // Friday 2026-11-13 + 1 working day = Monday 2026-11-16
  const result = addWorkingDays(new Date("2026-11-13T10:00:00Z"), 1, none);
  assert.equal(toDateKey(result), "2026-11-16");
});

test("skips public holidays", () => {
  // Wednesday 2026-11-18 is a Croatian holiday (Remembrance Day).
  const holidays = new Set(["2026-11-18"]);
  const result = addWorkingDays(new Date("2026-11-17T00:00:00Z"), 1, holidays);
  assert.equal(toDateKey(result), "2026-11-19");
});

test("zero working days returns the same calendar day", () => {
  const result = addWorkingDays(new Date("2026-11-13T23:59:00Z"), 0, none);
  assert.equal(toDateKey(result), "2026-11-13");
});

test("counts working days between two dates", () => {
  // Mon 2026-11-16 → Mon 2026-11-23 spans five working days.
  const count = countWorkingDays(
    new Date("2026-11-16T00:00:00Z"),
    new Date("2026-11-23T00:00:00Z"),
    none,
  );
  assert.equal(count, 5);
});

test("rejects negative counts", () => {
  assert.throws(() => addWorkingDays(new Date(), -1, none), RangeError);
});

test("isWorkingDay treats Sunday and holidays alike", () => {
  assert.equal(isWorkingDay(new Date("2026-11-15T00:00:00Z"), none), false);
  assert.equal(isWorkingDay(new Date("2026-11-16T00:00:00Z"), none), true);
  assert.equal(isWorkingDay(new Date("2026-11-16T00:00:00Z"), new Set(["2026-11-16"])), false);
});
