"use client";

import { useTranslations } from "next-intl";
import { useActionState, useId } from "react";
import { CountrySelect } from "@/components/CountrySelect";
import { SubmitButton } from "@/components/SubmitButton";
import type { Country } from "@/lib/restCountries";
import { ui } from "@/lib/ui";
import type { JourneyFormState } from "@/app/[locale]/journeys/actions";

type Props = {
  action: (prev: JourneyFormState, formData: FormData) => Promise<JourneyFormState>;
  initialTitle: string;
  initialCountry: string;
  countries: Country[];
  /** True when the short built-in country list is shown because the country service failed. */
  countriesFallback: boolean;
};

/** Edit form for a journey (F3 update): name and country. Client-side so typed values survive an error. */
export function JourneyForm({ action, initialTitle, initialCountry, countries, countriesFallback }: Props) {
  const t = useTranslations("journeys.form");
  const [state, formAction] = useActionState(action, {});
  const baseId = useId();
  const errorId = `${baseId}-error`;
  const invalid = state.error === "nameTooLong";
  const title = state.values?.title ?? initialTitle;
  const country = state.values?.countryCode ?? initialCountry;

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
          defaultValue={title}
          className={ui.input}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : `${baseId}-hint`}
        />
        <p id={`${baseId}-hint`} className="text-sm text-neutral-600">
          {t("hint")}
        </p>
      </div>
      <CountrySelect
        id={`${baseId}-country`}
        name="countryCode"
        label={t("country")}
        hint={t("countryHint")}
        noneLabel={t("countryNone")}
        notice={countriesFallback ? t("countryFallbackNotice") : null}
        countries={countries}
        defaultValue={country}
      />
      <SubmitButton>{t("save")}</SubmitButton>
    </form>
  );
}