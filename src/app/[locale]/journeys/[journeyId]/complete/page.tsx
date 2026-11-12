import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getFormatter, getTranslations } from "next-intl/server";
import { FocusOnHash } from "@/components/FocusOnHash";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Link } from "@/i18n/navigation";
import { eventTitle } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { now } from "@/lib/time";
import { ui } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("complete");
  return { title: t("title") };
}

/** Screen 20: the path is complete. */
export default function CompletePage(props: PageProps<"/[locale]/journeys/[journeyId]/complete">) {
  // Params of dynamic segments are request data: nothing is awaited here so the
  // skeleton below can be prerendered as the static shell.
  return (
    <Suspense fallback={<LoadingSkeleton rows={2} />}>
      <CompleteContent {...props} />
    </Suspense>
  );
}

async function CompleteContent({ params }: PageProps<"/[locale]/journeys/[journeyId]/complete">) {
  // Read from the database at request time, never at build time (cacheComponents).
  await connection();
  const { journeyId } = await params;
  const t = await getTranslations("complete");
  const tCatalog = await getTranslations("catalog");
  const format = await getFormatter();

  const journey = await prisma.journey.findUnique({
    where: { id: journeyId },
    include: { steps: { select: { status: true, attachments: { select: { documentId: true } } } } },
  });
  if (!journey) notFound();

  const total = journey.steps.length;
  const done = journey.steps.filter((s) => s.status === "DONE").length;
  const documents = new Set(journey.steps.flatMap((s) => s.attachments.map((a) => a.documentId))).size;
  const title = journey.title ?? eventTitle(tCatalog, journey.lifeEventId);

  if (done < total) {
    return (
      <section className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">{t("notYetTitle")}</h1>
        <p className="text-neutral-700">{t("notYetBody", { remaining: total - done })}</p>
        <Link href={`/journeys/${journeyId}/steps`} className={ui.buttonPrimary}>
          {t("backToSteps")}
        </Link>
      </section>
    );
  }

  const days = journey.completedAt
    ? Math.max(0, Math.round((journey.completedAt.getTime() - journey.startedAt.getTime()) / 86_400_000))
    : 0;

  return (
    <section className="flex flex-col items-start gap-4">
      <FocusOnHash key={now()} />
      <p className="text-5xl" aria-hidden="true">
        🎉
      </p>
      <h1 id="complete-title" className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-neutral-700">{t("body", { title })}</p>
      <dl className={`${ui.card} grid w-full grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm`}>
        <dt className="font-medium">{t("stepsDone")}</dt>
        <dd>{t("stepsCount", { count: done })}</dd>
        <dt className="font-medium">{t("documentsUsed")}</dt>
        <dd>{t("documentsCount", { count: documents })}</dd>
        <dt className="font-medium">{t("duration")}</dt>
        <dd>{t("daysCount", { count: days })}</dd>
        {journey.completedAt && (
          <>
            <dt className="font-medium">{t("completedOn")}</dt>
            <dd>{format.dateTime(journey.completedAt, { dateStyle: "long" })}</dd>
          </>
        )}
      </dl>
      <div className="flex flex-wrap gap-2">
        <Link href="/documents" className={ui.buttonPrimary}>
          {t("keepDocuments")}
        </Link>
        <Link href={`/journeys/${journeyId}/steps`} className={ui.buttonSecondary}>
          {t("backToSteps")}
        </Link>
      </div>
    </section>
  );
}
