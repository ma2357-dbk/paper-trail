import { useTranslations } from "next-intl";
import type { StepStatus } from "@/lib/stepStatus";

const tone: Record<StepStatus, string> = {
  NOT_STARTED: "bg-neutral-100 text-neutral-800 border-neutral-300",
  IN_PROGRESS: "bg-blue-50 text-blue-900 border-blue-300",
  SUBMITTED: "bg-amber-50 text-amber-900 border-amber-300",
  REJECTED: "bg-red-50 text-red-900 border-red-300",
  DONE: "bg-green-50 text-green-900 border-green-300",
};

/** Status is conveyed by text, not only colour (accessibility check 6.7). */
export function StatusBadge({ status }: { status: StepStatus }) {
  const t = useTranslations("catalog.status");
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${tone[status]}`}>
      {t(status)}
    </span>
  );
}
