import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getTranslations, getLocale } from "next-intl/server";
import { DocumentForm } from "@/components/DocumentForm";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Link } from "@/i18n/navigation";
import { documentTypeLabel } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { ui } from "@/lib/ui";
import { createDocument } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("documents");
  return { title: t("newTitle") };
}

/** Screen 12: add a document, optionally scanning it with the phone camera. */
export default function NewDocumentPage(props: PageProps<"/[locale]/documents/new">) {
  // Params of dynamic segments are request data: nothing is awaited here so the
  // skeleton below can be prerendered as the static shell.
  return (
    <Suspense fallback={<LoadingSkeleton rows={4} />}>
      <NewDocumentContent {...props} />
    </Suspense>
  );
}

async function NewDocumentContent({ params }: PageProps<"/[locale]/documents/new">) {
  const locale = await getLocale();
  // Read from the database at request time, never at build time (cacheComponents).
  await connection();
  const t = await getTranslations("documents");
  const tCatalog = await getTranslations("catalog");
  const types = await prisma.documentType.findMany({ select: { id: true } });
  const documentTypes = types
    .map((type) => ({ id: type.id, label: documentTypeLabel(tCatalog, type.id) }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));

  return (
    <section className="flex flex-col gap-4">
      <Link href="/documents" className={ui.link}>
        ← {t("backToWallet")}
      </Link>
      <h1 className="text-2xl font-semibold">{t("newTitle")}</h1>
      <DocumentForm action={createDocument} documentTypes={documentTypes} submitLabel={t("form.create")} />
    </section>
  );
}
