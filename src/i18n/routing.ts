import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "hr", "ru"],
  defaultLocale: "en",
  // Locale lives in the URL (/en, /hr, /ru) and is also remembered in the
  // NEXT_LOCALE cookie by the proxy, so it survives a reload.
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

/** Right-to-left locales. Add "ar" or "he" here if the team adds one. */
const RTL_LOCALES: ReadonlySet<string> = new Set([]);

export function getDirection(locale: string): "ltr" | "rtl" {
  return RTL_LOCALES.has(locale) ? "rtl" : "ltr";
}
