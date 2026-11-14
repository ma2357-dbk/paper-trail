import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { JourneyShortcuts } from "@/components/JourneyShortcuts";
import { Link } from "@/i18n/navigation";
import { ui } from "@/lib/ui";

export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-neutral-700">{t("intro")}</p>
        <div className="flex flex-wrap gap-2">
          <Link className={ui.buttonPrimary} href="/events">
            {t("startLink")}
          </Link>
          <Link className={ui.buttonSecondary} href="/documents">
            {t("documentsLink")}
          </Link>
          <Link className={ui.buttonSecondary} href="/dev/i18n">
            {t("i18nDemoLink")}
          </Link>
        </div>
      </div>
      <Suspense fallback={<p className="text-neutral-700">{t("loadingJourneys")}</p>}>
        <JourneyShortcuts />
      </Suspense>
    </section>
  );
}