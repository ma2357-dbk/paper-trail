import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getDirection, routing } from "@/i18n/routing";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ui } from "@/lib/ui";
import "../globals.css";

// Inter ships Latin Extended (č ć đ š ž) and Cyrillic glyphs in every weight.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return { title: { default: t("name"), template: `%s · ${t("name")}` }, description: t("tagline") };
}

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();
  const t = await getTranslations("nav");

  return (
    <html
      lang={locale}
      dir={getDirection(locale)}
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:outline-2 focus:outline-blue-700"
          >
            {t("skipToContent")}
          </a>
          {/* flex-wrap: at 320 px the locale switcher drops to a second line instead of overflowing. */}
          <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-neutral-200 px-4 py-2">
            <nav aria-label={t("mainNav")} className="flex items-center gap-4">
              <Link href="/" className={`min-h-11 inline-flex items-center font-semibold ${ui.focus}`}>
                Paper Trail
              </Link>
              <Link href="/documents" className={`min-h-11 inline-flex items-center text-sm underline underline-offset-2 ${ui.focus}`}>
                {t("documents")}
              </Link>
              <Link href="/journeys" className="min-h-11 inline-flex items-center text-sm underline underline-offset-2">
                {t("journeys")}
              </Link>
            </nav>
            {/* usePathname() is runtime data; the boundary keeps the layout shell static. */}
            <Suspense fallback={null}>
              <LocaleSwitcher />
            </Suspense>
          </header>
          <OfflineBanner />
          <main id="main" tabIndex={-1} className="flex-1 px-4 py-6 max-w-screen-sm w-full mx-auto">
            {children}
          </main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
