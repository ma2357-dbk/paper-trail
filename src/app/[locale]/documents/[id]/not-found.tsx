import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ui } from "@/lib/ui";

export default function DocumentNotFound() {
  // Translations are request data; the boundary lets the static shell prerender.
  return (
    <Suspense fallback={null}>
      <NotFoundContent />
    </Suspense>
  );
}

function NotFoundContent() {
  const t = useTranslations("documents");
  return (
    <section className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-semibold">{t("notFound.title")}</h1>
      <p className="text-neutral-700">{t("notFound.body")}</p>
      <Link href="/documents" className={ui.buttonPrimary}>
        {t("backToWallet")}
      </Link>
    </section>
  );
}
