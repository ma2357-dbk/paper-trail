import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { eventTitle } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { ui } from "@/lib/ui";

/** Temporary entry point to the step screens until the journeys list (screens 01–10) lands. */
export async function JourneyShortcuts() {
  await connection();
  const t = await getTranslations("home");
  const tCatalog = await getTranslations("catalog");
  const journeys = await prisma.journey.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, lifeEventId: true, _count: { select: { steps: true } } },
  });
  if (journeys.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{t("journeysHeading")}</h2>
      <ul className="flex flex-col gap-2">
        {journeys.map((journey) => (
          <li key={journey.id}>
            <Link href={`/journeys/${journey.id}/steps`} className={`${ui.card} block hover:border-neutral-400 ${ui.focus}`}>
              <span className="font-medium">{journey.title ?? eventTitle(tCatalog, journey.lifeEventId)}</span>
              <span className="block text-sm text-neutral-700">{t("stepsCount", { count: journey._count.steps })}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
