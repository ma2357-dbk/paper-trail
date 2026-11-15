import { Suspense } from "react";
import { connection } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { CountrySelect } from "@/components/CountrySelect";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { SubmitButton } from "@/components/SubmitButton";
import { eventTitle } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { getCountries } from "@/lib/restCountries";
import { ui } from "@/lib/ui";
import { startJourney } from "./actions";

/** Screen 03: pick a country and a life event. */
export default function EventsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton rows={2} />}>
      <EventsContent />
    </Suspense>
  );
}

async function EventsContent() {
  // Read from the database and the country service at request time, never at build time.
  await connection();
  const locale = await getLocale();
  const t = await getTranslations("pickEvent");
  const tCatalog = await getTranslations("catalog");

  const [events, { countries, fallback }] = await Promise.all([
    prisma.lifeEvent.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, _count: { select: { steps: true } } },
    }),
    getCountries(locale),
  ]);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-neutral-700">{t("intro")}</p>
      </div>

      {events.length === 0 ? (
        <div className={`${ui.card} flex flex-col gap-2`}>
          <h2 className="font-semibold">{t("empty.title")}</h2>
          <p className="text-neutral-700">{t("empty.body")}</p>
        </div>
      ) : (
        <form action={startJourney} className="flex flex-col gap-4">
          <CountrySelect
            id="country"
            name="countryCode"
            label={t("country.label")}
            hint={t("country.hint")}
            noneLabel={t("country.none")}
            notice={fallback ? t("country.fallbackNotice") : null}
            countries={countries}
            defaultValue="HR"
          />
          <ul className="flex flex-col gap-3">
            {events.map((event) => {
              const title = eventTitle(tCatalog, event.id);
              return (
                <li key={event.id} className={`${ui.card} flex flex-col gap-3`}>
                  <div>
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <p className="text-neutral-700">{tCatalog(`events.${event.id}.summary` as never)}</p>
                    <p className="text-sm text-neutral-700">{t("stepsCount", { count: event._count.steps })}</p>
                  </div>
                  <div>
                    <SubmitButton name="lifeEventId" value={event.id}>
                      {t("start")} <span className="sr-only">{title}</span>
                    </SubmitButton>
                  </div>
                </li>
              );
            })}
          </ul>
        </form>
      )}
    </section>
  );
}