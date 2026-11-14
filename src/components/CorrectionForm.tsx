"use client";

import { useTranslations } from "next-intl";
import { useActionState, useId } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { ui } from "@/lib/ui";
import type { CorrectionFormState } from "@/app/[locale]/journeys/[journeyId]/steps/actions";

type Props = { action: (prev: CorrectionFormState, formData: FormData) => Promise<CorrectionFormState> };

export function CorrectionForm({ action }: Props) {
  const t = useTranslations("steps.corrections");
  const [state, formAction] = useActionState(action, {});
  const id = useId();

  return (
    <form key={state.savedAt ?? "new"} action={formAction} className="flex flex-col gap-2" noValidate>
      <label htmlFor={id} className={ui.label}>
        {t("addLabel")}
      </label>
      <textarea
        id={id}
        name="text"
        rows={3}
        maxLength={300}
        required
        className={ui.input}
        aria-invalid={Boolean(state.error)}
        aria-describedby={state.error ? `${id}-error` : `${id}-hint`}
      />
      {state.error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-800">
          {t(`errors.${state.error}`)}
        </p>
      ) : (
        <p id={`${id}-hint`} className="text-sm text-neutral-600">
          {t("addHint")}
        </p>
      )}
      {state.savedAt && (
        <p role="status" className="text-sm text-green-900">
          {t("saved")}
        </p>
      )}
      <div>
        <SubmitButton variant="secondary">{t("addButton")}</SubmitButton>
      </div>
    </form>
  );
}
