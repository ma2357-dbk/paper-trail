import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// Redirects / -> /<locale>, validates the locale segment and persists the
// choice in the NEXT_LOCALE cookie.
export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals and static files (anything with a dot).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
