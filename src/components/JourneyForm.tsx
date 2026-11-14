"use client";

import { useTranslations } from "next-intl";
import { useActionState, useId } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { ui } from "@/lib/ui";
import type { JourneyFormState } from "@/app/[locale]/journeys/actions";

type Props = {
  action: (prev: JourneyFormState, formData: FormData) => Promise<JourneyFormState>;
  initialTitle: string;
};

/** Edit form for a journey (F3 update). Client-side so the typed name survives an error. */
export function JourneyForm({ action, initialTitle }: Props) {
  const t = useTranslations("journeys.form");
  const [state, formAction] = useActionState(action, {});
  const baseId = useId();
  const errorId = `${baseId}-error`;
  const invalid = state.error === "nameTooLong";
  const value = state.values?.title ?? initialTitle;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state.error && (
        <p id={errorId} role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-red-900">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor={`${baseId}-title`} className={ui.label}>
          {t("title")}
        </label>
        <input
          id={`${baseId}-title`}
          name="title"
          type="text"
          maxLength={80}
          autoComplete="off"
          defaultValue={value}
          className={ui.input}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : `${baseId}-hint`}
        />
        <p id={`${baseId}-hint`} className="text-sm text-neutral-600">
          {t("hint")}
        </p>
      </div>
      <SubmitButton>{t("save")}</SubmitButton>
    </form>
  );
}