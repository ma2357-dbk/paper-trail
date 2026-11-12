import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getFormatter, getTranslations, getLocale } from "next-intl/server";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { DocumentForm } from "@/components/DocumentForm";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Link } from "@/i18n/navigation";
import { documentTypeLabel, stepTitle } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { ui } from "@/lib/ui";
import { deleteDocument, updateDocument } from "../actions";

/** Screen 14: document details, edit and delete with confirmation. */
export default function DocumentPage(props: PageProps<"/[locale]/documents/[id]">) {
  // Params of dynamic segments are request data: nothing is awaited here so the
  // skeleton below can be prerendered as the static shell.
  return (
    <Suspense fallback={<LoadingSkeleton rows={4} />}>
      <DocumentContent {...props} />
    </Suspense>
  );
}

async function DocumentContent({ params }: PageProps<"/[locale]/documents/[id]">) {
  const locale = await getLocale();
  // Read from the database at request time, never at build time (cacheComponents).
  await connection();
  const { id } = await params;
  const t = await getTranslations("documents");
  const tCatalog = await getTranslations("catalog");
  const format = await getFormatter();

  const [document, types] = await Promise.all([
    prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        documentTypeId: true,
        validUntil: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        updatedAt: true,
        attachments: {
          select: { step: { select: { id: true, journeyId: true, stepTemplateId: true } } },
        },
      },
    }),
    prisma.documentType.findMany({ select: { id: true } }),
  ]);
  if (!document) notFound();

  const documentTypes = types
    .map((type) => ({ id: type.id, label: documentTypeLabel(tCatalog, type.id) }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
  const fileUrl = `/api/documents/${document.id}/file`;
  const isImage = document.mimeType?.startsWith("image/") ?? false;
  const sizeLabel = document.sizeBytes
    ? format.number(Math.max(1, Math.ceil(document.sizeBytes / 1024))) + " KB"
    : "";

  return (
    <section className="flex flex-col gap-6">
      <Link href="/documents" className={ui.link}>
        ← {t("backToWallet")}
      </Link>
      <div>
        <h1 className="break-words text-2xl font-semibold">{document.name}</h1>
        <p className="text-sm text-neutral-700">
          {t("updatedAt", { date: format.dateTime(document.updatedAt, { dateStyle: "medium", timeStyle: "short" }) })}
        </p>
      </div>

      {document.fileName && (
        <figure className={`${ui.card} flex flex-col gap-2`}>
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- bytes come from our own API route, not a remote host
            <img src={fileUrl} alt={t("scanAlt", { name: document.name })} className="max-h-80 w-full rounded object-contain" />
          ) : (
            <a href={fileUrl} target="_blank" rel="noopener" className={ui.link}>
              {t("openFile", { name: document.fileName })}
            </a>
          )}
          <figcaption className="text-sm text-neutral-700">
            {document.fileName} · {sizeLabel}
          </figcaption>
        </figure>
      )}

      {document.attachments.length > 0 && (
        <div className={ui.card}>
          <h2 className="mb-2 font-semibold">{t("attachedHeading", { count: document.attachments.length })}</h2>
          <ul className="flex flex-col gap-1">
            {document.attachments.map(({ step }) => (
              <li key={step.id}>
                <Link
                  href={`/journeys/${step.journeyId}/steps/${step.id}`}
                  className={ui.link}
                >
                  {stepTitle(tCatalog, step.stepTemplateId)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("editHeading")}</h2>
        <DocumentForm
          action={updateDocument.bind(null, document.id)}
          documentTypes={documentTypes}
          initial={{
            name: document.name,
            documentTypeId: document.documentTypeId ?? "",
            validUntil: document.validUntil ? document.validUntil.toISOString().slice(0, 10) : "",
          }}
          currentFile={document.fileName ? { fileName: document.fileName, sizeLabel } : null}
          submitLabel={t("form.save")}
        />
      </div>

      <div className={`${ui.card} flex flex-col items-start gap-2 border-red-200`}>
        <h2 className="font-semibold">{t("dangerHeading")}</h2>
        <p className="text-sm text-neutral-700">{t("dangerBody", { count: document.attachments.length })}</p>
        <ConfirmDelete
          action={deleteDocument}
          id={document.id}
          triggerLabel={t("delete")}
          title={t("confirmDelete.title", { name: document.name })}
          body={t("confirmDelete.body", { count: document.attachments.length })}
        />
      </div>
    </section>
  );
}
