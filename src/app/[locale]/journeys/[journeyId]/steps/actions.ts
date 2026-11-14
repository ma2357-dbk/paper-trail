"use server";

import { revalidatePath } from "next/cache";
import { getActionLocale } from "@/i18n/actionLocale";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { estimateReplyWindow } from "@/lib/nagerDate";
import { isStepStatus } from "@/lib/stepStatus";

/**
 * Every action redirects back to the step with a `#section` hash so that
 * `FocusOnHash` moves focus to the part of the screen that changed; a screen
 * reader then announces the result instead of restarting at the top.
 */
function stepHref(journeyId: string, stepId: string, section: string) {
  return `/journeys/${journeyId}/steps/${stepId}#${section}`;
}

/** Screens 16–18: move a step between statuses. */
export async function setStepStatus(formData: FormData) {
  const stepId = String(formData.get("stepId") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  if (!stepId || !isStepStatus(status)) return;

  const step = await prisma.step.findUnique({
    where: { id: stepId },
    include: { journey: { select: { id: true, countryCode: true } }, stepTemplate: true },
  });
  if (!step) return;

  const now = new Date();
  let submittedAt: Date | null = step.submittedAt;
  let reminderAt: Date | null = step.reminderAt;
  let rejectionNote: string | null = step.rejectionNote;

  if (status === "SUBMITTED") {
    submittedAt = now;
    rejectionNote = null;
    const max = step.stepTemplate.waitWorkingDaysMax;
    if (max) {
      const estimate = await estimateReplyWindow(now, step.stepTemplate.waitWorkingDaysMin ?? max, max, step.journey.countryCode, now);
      reminderAt = estimate.latest;
    } else {
      reminderAt = null;
    }
  } else if (status === "REJECTED") {
    rejectionNote = note || null;
    reminderAt = null;
  } else if (status === "DONE") {
    reminderAt = null;
  } else {
    submittedAt = null;
    reminderAt = null;
    rejectionNote = null;
  }

  await prisma.step.update({
    where: { id: stepId },
    data: { status, submittedAt, reminderAt, rejectionNote },
  });

  // Screen 20: the journey is complete when every step is done.
  const remaining = await prisma.step.count({ where: { journeyId: step.journeyId, status: { not: "DONE" } } });
  await prisma.journey.update({
    where: { id: step.journeyId },
    data: { completedAt: remaining === 0 ? now : null },
  });

  revalidatePath("/", "layout");
  const locale = await getActionLocale();
  if (remaining === 0) {
    redirect({ href: `/journeys/${step.journeyId}/complete#complete-title`, locale });
  }
  redirect({ href: stepHref(step.journeyId, stepId, status === "SUBMITTED" ? "wait-heading" : status === "REJECTED" ? "rej-heading" : "status-heading"), locale });
}

/** Screen 15: attach a wallet document to a step. */
export async function attachDocument(formData: FormData) {
  const stepId = String(formData.get("stepId") ?? "");
  const documentId = String(formData.get("documentId") ?? "");
  if (!stepId || !documentId) return;
  const [step, document] = await Promise.all([
    prisma.step.findUnique({ where: { id: stepId }, select: { journeyId: true } }),
    prisma.document.findUnique({ where: { id: documentId }, select: { id: true } }),
  ]);
  if (!step || !document) return;
  await prisma.stepDocument.upsert({
    where: { stepId_documentId: { stepId, documentId } },
    update: {},
    create: { stepId, documentId },
  });
  revalidatePath("/", "layout");
  redirect({ href: stepHref(step.journeyId, stepId, "req-heading"), locale: await getActionLocale() });
}

export async function detachDocument(formData: FormData) {
  const stepId = String(formData.get("stepId") ?? "");
  const documentId = String(formData.get("documentId") ?? "");
  if (!stepId || !documentId) return;
  const step = await prisma.step.findUnique({ where: { id: stepId }, select: { journeyId: true } });
  if (!step) return;
  await prisma.stepDocument.deleteMany({ where: { stepId, documentId } });
  revalidatePath("/", "layout");
  redirect({ href: stepHref(step.journeyId, stepId, "req-heading"), locale: await getActionLocale() });
}

export type CorrectionFormState = { error?: "textRequired" | "textTooLong"; savedAt?: number };

/** Screen 19: report a change other users should know about. */
export async function addCorrection(
  stepId: string,
  _prev: CorrectionFormState,
  formData: FormData,
): Promise<CorrectionFormState> {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "textRequired" };
  if (text.length > 300) return { error: "textTooLong" };
  const step = await prisma.step.findUnique({ where: { id: stepId }, select: { stepTemplateId: true } });
  if (!step) return { error: "textRequired" };
  await prisma.correction.create({ data: { stepTemplateId: step.stepTemplateId, text } });
  revalidatePath("/", "layout");
  return { savedAt: Date.now() };
}

export async function voteCorrection(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const vote = String(formData.get("vote") ?? "");
  if (!id || (vote !== "confirm" && vote !== "dispute")) return;
  await prisma.correction.updateMany({
    where: { id },
    data: vote === "confirm" ? { confirmations: { increment: 1 } } : { disputes: { increment: 1 } },
  });
  revalidatePath("/", "layout");
}
