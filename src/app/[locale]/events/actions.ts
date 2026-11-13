"use server";

import { revalidatePath } from "next/cache";
import { getActionLocale } from "@/i18n/actionLocale";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/db";

/** Creates a journey for the chosen life event, with one step per step template (F1, F3 create). */
export async function startJourney(formData: FormData) {
  const lifeEventId = String(formData.get("lifeEventId") ?? "");
  const locale = await getActionLocale();

  const event = await prisma.lifeEvent.findUnique({
    where: { id: lifeEventId },
    select: { id: true, steps: { orderBy: { sortOrder: "asc" }, select: { id: true } } },
  });
  if (!event) {
    redirect({ href: "/events", locale });
    return;
  }

  const journey = await prisma.journey.create({
    data: {
      lifeEventId: event.id,
      steps: { create: event.steps.map((step) => ({ stepTemplateId: step.id })) },
    },
  });

  revalidatePath("/", "layout");
  redirect({ href: `/journeys/${journey.id}/steps`, locale });
}