import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getFormatter, getTranslations } from "next-intl/server";
import { FocusOnHash } from "@/components/FocusOnHash";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Link } from "@/i18n/navigation";
import { documentTypeLabel } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { now } from "@/lib/time";
import { ui } from "@/lib/ui";

const SOON_DAYS = 30;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("documents");
  return { title: t("title") };
}

/** Screen 11: the documents wallet. */
export default function DocumentsPage(props: PageProps<"/[locale]/documents">) {
  // Params of dynamic segments are request data: nothing is awaited here so the
  // skeleton below can be prerendered as the static shell.
  return (
    <Suspense fallback={<LoadingSkeleton rows={3} />}>
      <DocumentsContent {...props} />
    </Suspense>
  );
}

async function DocumentsContent({ params }: PageProps<"/[locale]/documents">) {
  // Read from the database at request time, never at build time (cacheComponents).
  await connection();
  const t = await getTranslations("documents");
  const tCatalog = await getTranslations("catalog");
  const format = await getFormatter();

  const documents = await prisma.document.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      documentTypeId: true,
      validUntil: true,
      fileName: true,
      _count: { select: { attachments: true } },
    },
  });
  const nowMs = now();

  return (
    <section className="flex flex-col gap-4">
      <FocusOnHash key={nowMs} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 id="documents-title" className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-neutral-700">{t("count", { count: documents.length })}</p>
        </div>
        <Link href="/documents/new" className={ui.buttonPrimary}>
          {t("add")}
        </Link>
      </div>

      {documents.length === 0 ? (
        <div className={`${ui.card} flex flex-col items-start gap-3`}>
          <h2 className="font-semibold">{t("empty.title")}</h2>
          <p className="text-neutral-700">{t("empty.body")}</p>
          <Link href="/documents/new" className={ui.buttonSecondary}>
            {t("empty.cta")}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {documents.map((doc) => {
            const expiry = doc.validUntil ? doc.validUntil.getTime() : null;
            const expired = expiry !== null && expiry < nowMs;
            const expiringSoon = expiry !== null && !expired && expiry - nowMs < SOON_DAYS * 86_400_000;
            return (
              <li key={doc.id}>
                <Link
                  href={`/documents/${doc.id}`}
                  className={`${ui.card} flex min-h-16 flex-col gap-1 hover:border-neutral-400 ${ui.focus}`}
                >
                  <span className="font-medium">{doc.name}</span>
                  <span className="text-sm text-neutral-700">
                    {doc.documentTypeId ? documentTypeLabel(tCatalog, doc.documentTypeId) : t("noType")}
                    {" · "}
                    {doc.fileName ? t("hasFile") : t("noFile")}
                    {doc._count.attachments > 0 && <> · {t("attachedTo", { count: doc._count.attachments })}</>}
                  </span>
                  {doc.validUntil && (
                    <span className={`text-sm ${expired ? "text-red-800" : expiringSoon ? "text-amber-900" : "text-neutral-700"}`}>
                      {expired
                        ? t("expired", { date: format.dateTime(doc.validUntil, { dateStyle: "medium" }) })
                        : t("validUntil", { date: format.dateTime(doc.validUntil, { dateStyle: "medium" }) })}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
