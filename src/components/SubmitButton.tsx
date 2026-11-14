"use client";

import { useTranslations } from "next-intl";
import { useFormStatus } from "react-dom";
import { useOnline } from "@/hooks/useOnline";
import { ui } from "@/lib/ui";

type Props = {
  children: React.ReactNode;
  /** Text announced while the form is submitting, e.g. "Reading your scan…". */
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
  /** Forwarded to the button so one form can carry several choices (e.g. vote=confirm). */
  name?: string;
  value?: string;
};

/** Submit button that disables itself while pending or offline and tells screen readers why. */
export function SubmitButton({ children, pendingLabel, variant = "primary", className = "", name, value }: Props) {
  const { pending } = useFormStatus();
  const online = useOnline();
  const t = useTranslations("common");
  const base =
    variant === "primary" ? ui.buttonPrimary : variant === "danger" ? ui.buttonDanger : ui.buttonSecondary;

  return (
    <>
      <button
        type="submit"
        name={name}
        value={value}
        className={`${base} ${className}`}
        disabled={pending || !online}
        aria-disabled={pending || !online}
        aria-describedby={!online ? "offline-hint" : undefined}
      >
        {pending ? (pendingLabel ?? t("saving")) : children}
      </button>
      {!online && (
        <span id="offline-hint" className="text-sm text-amber-900">
          {t("offlineHint")}
        </span>
      )}
      <span className="sr-only" aria-live="polite">
        {pending ? (pendingLabel ?? t("saving")) : ""}
      </span>
    </>
  );
}
