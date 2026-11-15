"use server";

import { revalidatePath } from "next/cache";
import { getActionLocale } from "@/i18n/actionLocale";
import { redirect } from "@/i18n/navigation";
import { parseCountryCode } from "@/lib/countryCode";
import { prisma } from "@/lib/db";

export type JourneyFormState = {
  error?: "nameTooLong" | "notFound";
  /** Echoed back so what the user typed survives a validation error. */
  values?: { title: string; countryCode: string };
};

/** F3 update: give a journey your own name and country. Empty name means "use the life event's name". */
export async function renameJourney(
  id: string,
  _prev: JourneyFormState,
  formData: FormData,
): Promise<JourneyFormState> {
  const title = String(formData.get("title") ?? "").trim();
  // The country field is missing when the country list could not be loaded: keep the saved country then.
  const hasCountry = formData.has("countryCode");
  const countryCode = parseCountryCode(formData.get("countryCode"));
  const values = { title, countryCode: countryCode ?? "" };

  if (title.length > 80) return { error: "nameTooLong", values };

  const existing = await prisma.journey.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { error: "notFound", values };

  await prisma.journey.update({
    where: { id },
    data: { title: title || null, ...(hasCountry ? { countryCode } : {}) },
  });

  revalidatePath("/", "layout");
  redirect({ href: "/journeys", locale: await getActionLocale() });
  return {};
}

/** Called from the confirmation dialog only (F3). Steps and their attachments cascade in the schema. */
export async function deleteJourney(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.journey.deleteMany({ where: { id } });
  }
  revalidatePath("/", "layout");
  redirect({ href: "/journeys", locale: await getActionLocale() });
}