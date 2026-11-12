"use server";

import { revalidatePath } from "next/cache";
import { getActionLocale } from "@/i18n/actionLocale";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/db";

import { ALLOWED_MIME, MAX_FILE_BYTES } from "@/lib/documentFiles";

export type DocumentFormState = {
  error?: "nameRequired" | "nameTooLong" | "invalidDate" | "fileTooLarge" | "fileType" | "notFound";
  /** Echoed back so the user does not lose typed input on a validation error. */
  values?: { name: string; documentTypeId: string; validUntil: string };
};

type Parsed =
  | { ok: true; name: string; documentTypeId: string | null; validUntil: Date | null; file: File | null }
  | { ok: false; state: DocumentFormState };

function parse(formData: FormData): Parsed {
  const name = String(formData.get("name") ?? "").trim();
  const documentTypeId = String(formData.get("documentTypeId") ?? "");
  const validUntilRaw = String(formData.get("validUntil") ?? "");
  const values = { name, documentTypeId, validUntil: validUntilRaw };

  if (!name) return { ok: false, state: { error: "nameRequired", values } };
  if (name.length > 120) return { ok: false, state: { error: "nameTooLong", values } };

  let validUntil: Date | null = null;
  if (validUntilRaw) {
    validUntil = new Date(`${validUntilRaw}T00:00:00Z`);
    if (Number.isNaN(validUntil.getTime())) return { ok: false, state: { error: "invalidDate", values } };
  }

  const fileEntry = formData.get("file");
  let file: File | null = null;
  if (fileEntry instanceof File && fileEntry.size > 0) {
    if (fileEntry.size > MAX_FILE_BYTES) return { ok: false, state: { error: "fileTooLarge", values } };
    if (!ALLOWED_MIME.includes(fileEntry.type)) return { ok: false, state: { error: "fileType", values } };
    file = fileEntry;
  }

  return { ok: true, name, documentTypeId: documentTypeId || null, validUntil, file };
}

async function fileColumns(file: File) {
  return {
    fileName: file.name.slice(0, 200),
    mimeType: file.type,
    sizeBytes: file.size,
    data: new Uint8Array(await file.arrayBuffer()),
  };
}

export async function createDocument(
  _prev: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const parsed = parse(formData);
  if (!parsed.ok) return parsed.state;

  const document = await prisma.document.create({
    data: {
      name: parsed.name,
      documentTypeId: parsed.documentTypeId,
      validUntil: parsed.validUntil,
      ...(parsed.file ? await fileColumns(parsed.file) : {}),
    },
  });

  revalidatePath("/", "layout");
  redirect({ href: `/documents/${document.id}#document-title`, locale: await getActionLocale() });
  return {};
}

export async function updateDocument(
  id: string,
  _prev: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const parsed = parse(formData);
  if (!parsed.ok) return parsed.state;

  const existing = await prisma.document.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { error: "notFound" };

  const removeFile = formData.get("removeFile") === "on";
  await prisma.document.update({
    where: { id },
    data: {
      name: parsed.name,
      documentTypeId: parsed.documentTypeId,
      validUntil: parsed.validUntil,
      ...(parsed.file
        ? await fileColumns(parsed.file)
        : removeFile
          ? { fileName: null, mimeType: null, sizeBytes: null, data: null }
          : {}),
    },
  });

  revalidatePath("/", "layout");
  redirect({ href: `/documents/${id}#document-title`, locale: await getActionLocale() });
  return {};
}

/** Called from the confirmation dialog only (F3). Attachments cascade in the schema. */
export async function deleteDocument(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.document.deleteMany({ where: { id } });
  }
  revalidatePath("/", "layout");
  redirect({ href: "/documents#documents-title", locale: await getActionLocale() });
}
