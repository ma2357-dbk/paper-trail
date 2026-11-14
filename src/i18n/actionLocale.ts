import "server-only";
import { headers } from "next/headers";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "./routing";

/**
 * Locale for Server Actions. `next/root-params` (which the request config
 * uses) is only available while rendering a route, so actions read the header
 * that `src/proxy.ts` (next-intl middleware) sets on every localised request.
 */
export async function getActionLocale(): Promise<Locale> {
  const header = (await headers()).get("x-next-intl-locale");
  return hasLocale(routing.locales, header) ? header : routing.defaultLocale;
}
