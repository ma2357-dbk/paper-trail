import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getFormatter, getTranslations } from "next-intl/server";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Link } from "@/i18n/navigation";
import { eventTitle, stepTitle } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { now } from "@/lib/time";
import { isStepStatus } from "@/lib/stepStatus";
import { ui } from "@/lib/ui";

export async function generateMetadata({ params }: PageProps<"/[locale]/journeys/[journeyId]/steps">): Promise<Metadata> {
  const { journeyId } = await params;
  const tCatalog = await getTranslations("catalog");
  const journey = await prisma.journey.findUnique({ where: { id: journeyId }, select: { title: true, lifeEventId: true } });
  return { title: journey ? (journey.title ?? eventTitle(tCatalog, journey.lifeEventId)) : undefined };
}

/** Screen 16: status of every step in a journey. */
export default function StepsPage(props: PageProps<"/[locale]/journeys/[journeyId]/steps">) {
  // Params of dynamic segments are request data: nothing is awaited here so the
  // skeleton below can be prerendered as the static shell.
  return (
    <Suspense fallback={<LoadingSkeleton rows={5} />}>
      <StepsContent {...props} />
    </Suspense>
  );
}

async function StepsContent({ params }: PageProps<"/[locale]/journeys/[journeyId]/steps">) {
  // Read from the database at request time, never at build time (cacheComponents).
  await connection();
  const { journeyId } = await params;
  const t = await getTranslations("steps");
  const tCatalog = await getTranslations("catalog");
  const format = await getFormatter();
  const nowMs = now();

  const journey = await prisma.journey.findUnique({
    where: { id: journeyId },
    include: {
      steps: { include: { stepTemplate: { select: { id: true, sortOrder: true, deadlineDaysAfterStart: true } } } },
    },
  });
  if (!journey) notFound();

  const steps = [...journey.steps].sort((a, b) => a.stepTemplate.sortOrder - b.stepTemplate.sortOrder);
  const done = steps.filter((s) => s.status === "DONE").length;
  const title = journey.title ?? eventTitle(tCatalog, journey.lifeEventId);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-neutral-700">{t("progress", { done, total: steps.length })}</p>
        <progress value={done} max={steps.length} className="mt-2 h-2 w-full" aria-label={t("progress", { done, total: steps.length })} />
      </div>

      {done === steps.length && (
        <Link href={`/journeys/${journeyId}/complete`} className={ui.buttonPrimary}>
          {t("allDoneCta")}
        </Link>
      )}

      <ol className="flex flex-col gap-2">
        {steps.map((step, index) => {
          const status = isStepStatus(step.status) ? step.status : "NOT_STARTED";
          const deadline = step.stepTemplate.deadlineDaysAfterStart
            ? new Date(journey.startedAt.getTime() + step.stepTemplate.deadlineDaysAfterStart * 86_400_000)
            : null;
          return (
            <li key={step.id}>
              <Link
                href={`/journeys/${journeyId}/steps/${step.id}`}
                className={`${ui.card} flex min-h-16 flex-col gap-1 hover:border-neutral-400 ${ui.focus}`}
                aria-current={status === "IN_PROGRESS" ? "step" : undefined}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="font-medium">
                    {index + 1}. {stepTitle(tCatalog, step.stepTemplate.id)}
                  </span>
                  <StatusBadge status={status} />
                </span>
                {step.reminderAt && status === "SUBMITTED" && (
                  <span className="text-sm text-neutral-700">
                    {t("replyBy", { date: format.dateTime(step.reminderAt, { dateStyle: "medium" }) })}
                  </span>
                )}
                {deadline && status !== "DONE" && (
                  <span className={`text-sm ${deadline.getTime() < nowMs ? "text-red-800" : "text-neutral-700"}`}>
                    {t("deadline", { date: format.dateTime(deadline, { dateStyle: "medium" }) })}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
