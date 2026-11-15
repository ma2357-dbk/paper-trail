import type { Country } from "@/lib/restCountries";
import { ui } from "@/lib/ui";

type Props = {
  id: string;
  name: string;
  label: string;
  hint: string;
  noneLabel: string;
  countries: Country[];
  /** Explains that a short list is shown because the country service could not be used. */
  notice: string | null;
  defaultValue?: string;
};

/** Country picker. A native <select> so it works with keyboard and screen readers, in server and client components. */
export function CountrySelect({ id, name, label, hint, noneLabel, countries, notice, defaultValue = "" }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {notice && (
        <p role="status" className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900">
          {notice}
        </p>
      )}
      <label htmlFor={id} className={ui.label}>
        {label}
      </label>
      <select id={id} name={name} defaultValue={defaultValue} className={ui.input} aria-describedby={`${id}-hint`}>
        <option value="">{noneLabel}</option>
        {countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </select>
      <p id={`${id}-hint`} className="text-sm text-neutral-600">
        {hint}
      </p>
    </div>
  );
}