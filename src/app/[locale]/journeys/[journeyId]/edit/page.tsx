import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { JourneyForm } from "@/components/JourneyForm";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Link } from "@/i18n/navigation";
import { eventTitle } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { ui } from "@/lib/ui";
import { renameJourney } from "../../actions";

/** Screen 10: rename a journey. */
export default function EditJourneyPage(props: PageProps<"/[locale]/journeys/[journeyId]/edit">) {
  return (
    <Suspense fallback={<LoadingSkeleton rows={2} />}>
      <EditJourneyContent {...props} />
    </Suspense>
  );
}

async function EditJourneyContent({ params }: PageProps<"/[locale]/journeys/[journeyId]/edit">) {
  // Read from the database at request time, never at build time.
  await connection();
  const { journeyId } = await params;
  const t = await getTranslations("journeys");
  const tCatalog = await getTranslations("catalog");

  const journey = await prisma.journey.findUnique({
    where: { id: journeyId },
    select: { id: true, title: true, lifeEventId: true },
  });
  if (!journey) notFound();

  return (
    <section className="flex flex-col gap-4">
      <Link href="/journeys" className={ui.link}>
        {t("backToJourneys")}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{t("editTitle")}</h1>
        <p className="text-neutral-700">{eventTitle(tCatalog, journey.lifeEventId)}</p>
      </div>
      <JourneyForm action={renameJourney.bind(null, journey.id)} initialTitle={journey.title ?? ""} />
    </section>
  );
}