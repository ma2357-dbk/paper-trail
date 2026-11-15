"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { ui } from "@/lib/ui";

export function LocaleSwitcher() {
  const t = useTranslations("locale");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as Locale;
    startTransition(() => {
      // Keep the current page, swap only the locale segment.
      router.replace(
        // @ts-expect-error -- params are forwarded for dynamic segments
        { pathname, params },
        { locale: next },
      );
    });
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span>{t("label")}</span>
      <select
        className={`min-h-11 min-w-11 rounded border border-neutral-500 bg-white px-2 py-1 text-neutral-900 ${ui.focus}`}
        value={locale}
        onChange={onChange}
        disabled={isPending}
      >
        {routing.locales.map((code) => (
          <option key={code} value={code} lang={code}>
            {t(code)}
          </option>
        ))}
      </select>
    </label>
  );
}
