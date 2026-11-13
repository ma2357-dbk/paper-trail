"use server";

import { revalidatePath } from "next/cache";
import { getActionLocale } from "@/i18n/actionLocale";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/db";

/** Called from the confirmation dialog only (F3). Steps and their attachments cascade in the schema. */
export async function deleteJourney(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.journey.deleteMany({ where: { id } });
  }
  revalidatePath("/", "layout");
  redirect({ href: "/journeys", locale: await getActionLocale() });
}