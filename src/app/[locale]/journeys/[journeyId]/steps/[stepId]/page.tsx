import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getFormatter, getTranslations } from "next-intl/server";
import { CorrectionForm } from "@/components/CorrectionForm";
import { StatusBadge } from "@/components/StatusBadge";
import { SubmitButton } from "@/components/SubmitButton";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Link } from "@/i18n/navigation";
import { documentTypeLabel, stepOffice, stepSummary, stepTitle } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { now } from "@/lib/time";
import { estimateReplyWindow } from "@/lib/nagerDate";
import { isStepStatus } from "@/lib/stepStatus";
import { ui } from "@/lib/ui";
import { addCorrection, attachDocument, detachDocument, setStepStatus, voteCorrection } from "../actions";

/** Screens 15–19: requirements, status, waiting for a reply, rejected, corrections. */
export default function StepPage(props: PageProps<"/[locale]/journeys/[journeyId]/steps/[stepId]">) {
  // Params of dynamic segments are request data: nothing is awaited here so the
  // skeleton below can be prerendered as the static shell.
  return (
    <Suspense fallback={<LoadingSkeleton rows={5} />}>
      <StepContent {...props} />
    </Suspense>
  );
}

async function StepContent({ params }: PageProps<"/[locale]/journeys/[journeyId]/steps/[stepId]">) {
  // Read from the database at request time, never at build time (cacheComponents).
  await connection();
  const { journeyId, stepId } = await params;
  const t = await getTranslations("steps");
  const tCatalog = await getTranslations("catalog");
  const format = await getFormatter();
  const nowMs = now();

  const step = await prisma.step.findFirst({
    where: { id: stepId, journeyId },
    include: {
      journey: { select: { id: true, countryCode: true, startedAt: true } },
      stepTemplate: {
        include: {
          requirements: { select: { documentTypeId: true } },
          dependsOn: { select: { id: true } },
          corrections: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      },
      attachments: { include: { document: { select: { id: true, name: true, documentTypeId: true, validUntil: true } } } },
    },
  });
  if (!step) notFound();

  const status = isStepStatus(step.status) ? step.status : "NOT_STARTED";
  const template = step.stepTemplate;
  const requiredTypes = template.requirements.map((r) => r.documentTypeId);

  const [blocker, wallet] = await Promise.all([
    template.dependsOn
      ? prisma.step.findFirst({ where: { journeyId, stepTemplateId: template.dependsOn.id }, select: { id: true, status: true, stepTemplateId: true } })
      : null,
    prisma.document.findMany({
      where: requiredTypes.length ? { documentTypeId: { in: requiredTypes } } : { id: "" },
      select: { id: true, name: true, documentTypeId: true, validUntil: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const blocked = blocker !== null && blocker.status !== "DONE";
  const attachedIds = new Set(step.attachments.map((a) => a.documentId));
  const readyTypes = requiredTypes.filter((typeId) => step.attachments.some((a) => a.document.documentTypeId === typeId));

  const estimate =
    status === "SUBMITTED" && step.submittedAt && template.waitWorkingDaysMax
      ? await estimateReplyWindow(step.submittedAt, template.waitWorkingDaysMin ?? template.waitWorkingDaysMax, template.waitWorkingDaysMax, step.journey.countryCode)
      : null;
  const deadline = template.deadlineDaysAfterStart
    ? new Date(step.journey.startedAt.getTime() + template.deadlineDaysAfterStart * 86_400_000)
    : null;
  const date = (d: Date) => format.dateTime(d, { dateStyle: "medium" });

  return (
    <article className="flex flex-col gap-6">
      <Link href={`/journeys/${journeyId}/steps`} className={ui.link}>
        ← {t("backToSteps")}
      </Link>

      <header className="flex flex-col gap-2">
        <StatusBadge status={status} />
        <h1 className="text-2xl font-semibold">{stepTitle(tCatalog, template.id)}</h1>
        <p className="text-neutral-700">{stepSummary(tCatalog, template.id)}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="font-medium">{t("office")}</dt>
          <dd>{stepOffice(tCatalog, template.id)}</dd>
          {deadline && (
            <>
              <dt className="font-medium">{t("deadlineLabel")}</dt>
              <dd className={deadline.getTime() < nowMs && status !== "DONE" ? "text-red-800" : ""}>{date(deadline)}</dd>
            </>
          )}
          {template.feeCents !== null && (
            <>
              <dt className="font-medium">{t("fee")}</dt>
              <dd>{format.number(template.feeCents / 100, { style: "currency", currency: template.currency })}</dd>
            </>
          )}
          {template.waitWorkingDaysMax && (
            <>
              <dt className="font-medium">{t("typicalWait")}</dt>
              <dd>{t("workingDaysRange", { min: template.waitWorkingDaysMin ?? template.waitWorkingDaysMax, max: template.waitWorkingDaysMax })}</dd>
            </>
          )}
        </dl>
      </header>

      {blocked && blocker && (
        <p role="status" className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-amber-950">
          {t("blockedBy")}{" "}
          <Link href={`/journeys/${journeyId}/steps/${blocker.id}`} className="underline">
            {stepTitle(tCatalog, blocker.stepTemplateId)}
          </Link>
        </p>
      )}

      {/* Screen 15: requirements */}
      <section aria-labelledby="req-heading" className="flex flex-col gap-3">
        <h2 id="req-heading" className="text-lg font-semibold">
          {t("requirements.heading")}{" "}
          <span className="text-base font-normal text-neutral-700">{t("requirements.ready", { ready: readyTypes.length, total: requiredTypes.length })}</span>
        </h2>
        {requiredTypes.length === 0 ? (
          <p className="text-neutral-700">{t("requirements.none")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {requiredTypes.map((typeId) => {
              const attached = step.attachments.filter((a) => a.document.documentTypeId === typeId);
              const candidates = wallet.filter((d) => d.documentTypeId === typeId && !attachedIds.has(d.id));
              const ready = attached.length > 0;
              return (
                <li key={typeId} className={`${ui.card} flex flex-col gap-2`}>
                  <p className="flex items-center justify-between gap-2 font-medium">
                    <span>{documentTypeLabel(tCatalog, typeId)}</span>
                    <span className={`text-sm ${ready ? "text-green-900" : "text-amber-900"}`}>{ready ? t("requirements.readyLabel") : t("requirements.missingLabel")}</span>
                  </p>
                  {attached.map((a) => (
                    <form key={a.documentId} action={detachDocument} className="flex items-center justify-between gap-2 text-sm">
                      <input type="hidden" name="stepId" value={step.id} />
                      <input type="hidden" name="documentId" value={a.documentId} />
                      <Link href={`/documents/${a.documentId}`} className={ui.link}>
                        {a.document.name}
                      </Link>
                      <SubmitButton variant="secondary">{t("requirements.detach")}</SubmitButton>
                    </form>
                  ))}
                  {candidates.length > 0 && (
                    <form action={attachDocument} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="stepId" value={step.id} />
                      <label className="flex flex-1 flex-col gap-1 text-sm">
                        {t("requirements.attachLabel")}
                        <select name="documentId" className={ui.input} defaultValue={candidates[0].id}>
                          {candidates.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <SubmitButton variant="secondary">{t("requirements.attach")}</SubmitButton>
                    </form>
                  )}
                  {!ready && candidates.length === 0 && (
                    <Link href="/documents/new" className={ui.link}>
                      {t("requirements.addToWallet")}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Screen 17: waiting for a reply */}
      {status === "SUBMITTED" && step.submittedAt && (
        <section aria-labelledby="wait-heading" className={`${ui.card} flex flex-col gap-2 border-amber-300 bg-amber-50`}>
          <h2 id="wait-heading" className="text-lg font-semibold">
            {t("waiting.heading")}
          </h2>
          <p>{t("waiting.submittedOn", { date: date(step.submittedAt) })}</p>
          {estimate ? (
            <>
              <p>{t("waiting.window", { from: date(estimate.earliest), to: date(estimate.latest) })}</p>
              <progress
                value={Math.min(estimate.elapsedWorkingDays, template.waitWorkingDaysMax ?? 0)}
                max={template.waitWorkingDaysMax ?? 1}
                className="h-2 w-full"
                aria-label={t("waiting.elapsed", { days: estimate.elapsedWorkingDays, max: template.waitWorkingDaysMax ?? 0 })}
              />
              <p className="text-sm text-neutral-700">{t("waiting.elapsed", { days: estimate.elapsedWorkingDays, max: template.waitWorkingDaysMax ?? 0 })}</p>
              {estimate.holidaysInWindow.length > 0 && (
                <p className="text-sm text-neutral-700">
                  {t("waiting.holidays", { count: estimate.holidaysInWindow.length })}{" "}
                  {format.list(estimate.holidaysInWindow.map((h) => `${h.localName} (${date(new Date(`${h.date}T00:00:00Z`))})`))}
                </p>
              )}
              {estimate.fallback && (
                <p role="status" className="text-sm text-amber-950">
                  {t(`waiting.fallback.${estimate.fallback}`)}
                </p>
              )}
              {estimate.elapsedWorkingDays > (template.waitWorkingDaysMax ?? 0) && <p className="font-medium">{t("waiting.overdue")}</p>}
            </>
          ) : (
            <p>{t("waiting.noEstimate")}</p>
          )}
        </section>
      )}

      {/* Screen 18: rejected */}
      {status === "REJECTED" && (
        <section aria-labelledby="rej-heading" className={`${ui.card} flex flex-col gap-2 border-red-300 bg-red-50`}>
          <h2 id="rej-heading" className="text-lg font-semibold">
            {t("rejected.heading")}
          </h2>
          {step.rejectionNote ? <p>{t("rejected.reason", { note: step.rejectionNote })}</p> : <p>{t("rejected.noReason")}</p>}
          <ol className="list-decimal pl-5 text-sm">
            <li>{t("rejected.tip1")}</li>
            <li>{t("rejected.tip2")}</li>
            <li>{t("rejected.tip3")}</li>
          </ol>
        </section>
      )}

      {/* Screen 16: status actions */}
      <section aria-labelledby="status-heading" className="flex flex-col gap-3">
        <h2 id="status-heading" className="text-lg font-semibold">
          {t("actions.heading")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {status === "NOT_STARTED" && (
            <StatusForm stepId={step.id} status="IN_PROGRESS" label={t("actions.start")} disabled={blocked} />
          )}
          {(status === "IN_PROGRESS" || status === "REJECTED") && (
            <>
              <StatusForm stepId={step.id} status="SUBMITTED" label={status === "REJECTED" ? t("actions.resubmit") : t("actions.submitted")} />
              <StatusForm stepId={step.id} status="DONE" label={t("actions.done")} variant="secondary" />
            </>
          )}
          {status === "SUBMITTED" && <StatusForm stepId={step.id} status="DONE" label={t("actions.approved")} />}
          {status === "DONE" && <StatusForm stepId={step.id} status="IN_PROGRESS" label={t("actions.reopen")} variant="secondary" />}
          {status !== "NOT_STARTED" && status !== "DONE" && (
            <StatusForm stepId={step.id} status="NOT_STARTED" label={t("actions.reset")} variant="secondary" />
          )}
        </div>
        {status === "SUBMITTED" && (
          <form action={setStepStatus} className={`${ui.card} flex flex-col gap-2`}>
            <input type="hidden" name="stepId" value={step.id} />
            <input type="hidden" name="status" value="REJECTED" />
            <label htmlFor="rejection-note" className={ui.label}>
              {t("actions.rejectedLabel")}
            </label>
            <textarea id="rejection-note" name="note" rows={2} maxLength={500} className={ui.input} placeholder={t("actions.rejectedPlaceholder")} />
            <div>
              <SubmitButton variant="danger">{t("actions.rejected")}</SubmitButton>
            </div>
          </form>
        )}
      </section>

      {/* Screen 19: recent corrections */}
      <section aria-labelledby="corr-heading" className="flex flex-col gap-3">
        <h2 id="corr-heading" className="text-lg font-semibold">
          {t("corrections.heading")}
        </h2>
        <p className="text-sm text-neutral-700">{t("corrections.intro")}</p>
        {template.corrections.length === 0 ? (
          <p className="text-neutral-700">{t("corrections.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {template.corrections.map((c) => (
              <li key={c.id} className={`${ui.card} flex flex-col gap-2`}>
                <p>{c.text}</p>
                <p className="text-sm text-neutral-700">
                  {format.relativeTime(c.createdAt)} · {t("corrections.votes", { confirmations: c.confirmations, disputes: c.disputes })}
                </p>
                <form action={voteCorrection} className="flex gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <SubmitButton variant="secondary" name="vote" value="confirm">
                    {t("corrections.confirm")}
                  </SubmitButton>
                  <SubmitButton variant="secondary" name="vote" value="dispute">
                    {t("corrections.dispute")}
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
        <CorrectionForm action={addCorrection.bind(null, step.id)} />
      </section>
    </article>
  );
}

function StatusForm({
  stepId,
  status,
  label,
  variant = "primary",
  disabled = false,
}: {
  stepId: string;
  status: string;
  label: string;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  return (
    <form action={setStepStatus}>
      <input type="hidden" name="stepId" value={stepId} />
      <input type="hidden" name="status" value={status} />
      {disabled ? (
        <button type="button" className={variant === "primary" ? ui.buttonPrimary : ui.buttonSecondary} disabled aria-disabled="true">
          {label}
        </button>
      ) : (
        <SubmitButton variant={variant}>{label}</SubmitButton>
      )}
    </form>
  );
}
