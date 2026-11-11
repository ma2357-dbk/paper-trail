/** Step.status values. Kept as a string column because the app also needs them as i18n keys. */
export const STEP_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "SUBMITTED",
  "REJECTED",
  "DONE",
] as const;

export type StepStatus = (typeof STEP_STATUSES)[number];

export function isStepStatus(value: string): value is StepStatus {
  return (STEP_STATUSES as readonly string[]).includes(value);
}
