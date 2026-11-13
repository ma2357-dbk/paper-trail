import { Suspense } from "react";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Link } from "@/i18n/navigation";
import { eventTitle } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { ui } from "@/lib/ui";
import { deleteJourney } from "./actions";

/** Screen 09: all journeys. */
export default function JourneysPage() {
  return (
    <Suspense fallback={<LoadingSkeleton rows={3} />}>
      <JourneysContent />
    </Suspense>
  );
}

async function JourneysContent() {
  // Read from the database at request time, never at build time.
  await connection();
  const t = await getTranslations("journeys");
  const tCatalog = await getTranslations("catalog");

  const journeys = await prisma.journey.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, lifeEventId: true, steps: { select: { status: true } } },
  });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-neutral-700">{t("count", { count: journeys.length })}</p>
        </div>
        <Link href="/events" className={ui.buttonPrimary}>
          {t("add")}
        </Link>
      </div>

      {journeys.length === 0 ? (
        <div className={`${ui.card} flex flex-col items-start gap-3`}>
          <h2 className="font-semibold">{t("empty.title")}</h2>
          <p className="text-neutral-700">{t("empty.body")}</p>
          <Link href="/events" className={ui.buttonSecondary}>
            {t("empty.cta")}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {journeys.map((journey) => {
            const name = journey.title ?? eventTitle(tCatalog, journey.lifeEventId);
            const done = journey.steps.filter((step) => step.status === "DONE").length;
            return (
              <li key={journey.id} className={`${ui.card} flex flex-col gap-3`}>
                <Link href={`/journeys/${journey.id}/steps`} className={`flex flex-col gap-1 ${ui.focus}`}>
                  <span className="text-lg font-semibold">{name}</span>
                  <span className="text-sm text-neutral-700">
                    {t("progress", { done, total: journey.steps.length })}
                  </span>
                </Link>
                <div>
                  <ConfirmDelete
                    action={deleteJourney}
                    id={journey.id}
                    title={t("confirmDelete.title", { name })}
                    body={t("confirmDelete.body")}
                    triggerLabel={t("delete")}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}