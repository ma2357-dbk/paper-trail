import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { SubmitButton } from "@/components/SubmitButton";
import { eventTitle } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { ui } from "@/lib/ui";
import { startJourney } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pickEvent");
  return { title: t("title") };
}

/** Screen 03: pick a life event. */
export default function EventsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton rows={2} />}>
      <EventsContent />
    </Suspense>
  );
}

async function EventsContent() {
  // Read from the database at request time, never at build time.
  await connection();
  const t = await getTranslations("pickEvent");
  const tCatalog = await getTranslations("catalog");

  const events = await prisma.lifeEvent.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, _count: { select: { steps: true } } },
  });

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
        <ul className="flex flex-col gap-3">
          {events.map((event) => (
            <li key={event.id} className={`${ui.card} flex flex-col gap-3`}>
              <div>
                <h2 className="text-lg font-semibold">{eventTitle(tCatalog, event.id)}</h2>
                <p className="text-neutral-700">{tCatalog(`events.${event.id}.summary` as never)}</p>
                <p className="text-sm text-neutral-700">{t("stepsCount", { count: event._count.steps })}</p>
              </div>
              <form action={startJourney}>
                <input type="hidden" name="lifeEventId" value={event.id} />
                <SubmitButton>{t("start")}</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}