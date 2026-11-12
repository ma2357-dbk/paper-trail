"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useId, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { ui } from "@/lib/ui";
import type { DocumentFormState } from "@/app/[locale]/documents/actions";

type Props = {
  action: (prev: DocumentFormState, formData: FormData) => Promise<DocumentFormState>;
  documentTypes: Array<{ id: string; label: string }>;
  initial?: { name: string; documentTypeId: string; validUntil: string };
  currentFile?: { fileName: string; sizeLabel: string } | null;
  submitLabel: string;
};

/** Screens 11–13: add / edit a wallet document, optionally with a scan. Client-side so typed values survive errors. */
export function DocumentForm({ action, documentTypes, initial, currentFile, submitLabel }: Props) {
  const t = useTranslations("documents.form");
  const [state, formAction] = useActionState(action, {});
  const [hasFile, setHasFile] = useState(false);
  const baseId = useId();
  const values = state.values ?? initial ?? { name: "", documentTypeId: "", validUntil: "" };
  const errorId = `${baseId}-error`;
  const nameInvalid = state.error === "nameRequired" || state.error === "nameTooLong";
  const dateInvalid = state.error === "invalidDate";
  const fileInvalid = state.error === "fileTooLarge" || state.error === "fileType";

  // After a failed submit, focus the field that needs fixing: the alert is
  // announced and the field reads its message through aria-describedby.
  useEffect(() => {
    if (!state.error) return;
    const field = nameInvalid ? "name" : dateInvalid ? "valid" : fileInvalid ? "file" : "name";
    document.getElementById(`${baseId}-${field}`)?.focus();
  }, [state, baseId, nameInvalid, dateInvalid, fileInvalid]);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state.error && (
        <p id={errorId} role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-red-900">
          {t(`errors.${state.error}`)}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor={`${baseId}-name`} className={ui.label}>
          {t("name")} <span aria-hidden="true">*</span>
        </label>
        <input
          id={`${baseId}-name`}
          name="name"
          type="text"
          required
          maxLength={120}
          autoComplete="off"
          defaultValue={values.name}
          className={ui.input}
          aria-invalid={nameInvalid}
          aria-describedby={nameInvalid ? errorId : `${baseId}-name-hint`}
        />
        <p id={`${baseId}-name-hint`} className="text-sm text-neutral-600">
          {t("nameHint")}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${baseId}-type`} className={ui.label}>
          {t("type")}
        </label>
        <select id={`${baseId}-type`} name="documentTypeId" defaultValue={values.documentTypeId} className={ui.input}>
          <option value="">{t("typeNone")}</option>
          {documentTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${baseId}-valid`} className={ui.label}>
          {t("validUntil")}
        </label>
        <input
          id={`${baseId}-valid`}
          name="validUntil"
          type="date"
          defaultValue={values.validUntil}
          className={ui.input}
          aria-invalid={dateInvalid}
          aria-describedby={dateInvalid ? errorId : undefined}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${baseId}-file`} className={ui.label}>
          {currentFile ? t("replaceFile") : t("file")}
        </label>
        {currentFile && (
          <p className="text-sm text-neutral-700">
            {t("currentFile", { name: currentFile.fileName, size: currentFile.sizeLabel })}
          </p>
        )}
        <input
          id={`${baseId}-file`}
          name="file"
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          className={`${ui.input} file:mr-3 file:min-h-9 file:rounded file:border-0 file:bg-neutral-200 file:px-3`}
          aria-invalid={fileInvalid}
          aria-describedby={fileInvalid ? errorId : `${baseId}-file-hint`}
          onChange={(event) => setHasFile((event.target.files?.length ?? 0) > 0)}
        />
        <p id={`${baseId}-file-hint`} className="text-sm text-neutral-600">
          {t("fileHint")}
        </p>
        {currentFile && (
          <label className="mt-1 flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name="removeFile" className="size-5" />
            {t("removeFile")}
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingLabel={hasFile ? t("readingScan") : undefined}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
