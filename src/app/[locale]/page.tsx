import { getTranslations, setRequestLocale } from "next-intl/server";
import { resolveLocale } from "@/i18n/locale";
import { Link } from "@/i18n/navigation";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-neutral-700">{t("intro")}</p>
      <Link
        className="inline-flex min-h-11 items-center rounded bg-neutral-900 px-4 text-white"
        href="/dev/i18n"
      >
        {t("i18nDemoLink")}
      </Link>
    </section>
  );
}
