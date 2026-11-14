import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { routing } from "./routing";

export default getRequestConfig(async () => {
  // The [locale] segment is a root param (Next.js 16), so every server
  // component, layout and metadata function reads it from here without
  // threading `params` through. Unknown values (e.g. /de/...) render 404.
  const requested = await rootParams.locale();
  if (!hasLocale(routing.locales, requested)) {
    notFound();
  }
  const locale = requested;

  // Fallback chain: <locale> -> en. A key missing from the locale file is
  // served from English and reported in development (see onError/getMessageFallback).
  const fallback = (await import("../../messages/en.json")).default;
  const messages =
    locale === routing.defaultLocale
      ? fallback
      : deepMerge(fallback, (await import(`../../messages/${locale}.json`)).default);

  return {
    locale,
    messages,
    timeZone: "Europe/Zagreb",
    onError(error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[i18n]", error.message);
      }
    },
    getMessageFallback({ namespace, key }) {
      const path = [namespace, key].filter(Boolean).join(".");
      // Visible in development, never a raw key for a real user: English
      // fallback already covers production because of deepMerge above.
      return process.env.NODE_ENV !== "production" ? `⚠ ${path}` : "";
    },
  };
});

type Messages = Record<string, unknown>;

function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = out[key];
    if (isObject(value) && isObject(baseValue)) {
      out[key] = deepMerge(baseValue, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function isObject(value: unknown): value is Messages {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
