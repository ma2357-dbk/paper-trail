"use client";

import { useTranslations } from "next-intl";
import { useId, useRef } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { ui } from "@/lib/ui";

type Props = {
  /** Server action that performs the delete; the hidden `id` field is passed through. */
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  title: string;
  body: string;
  triggerLabel: string;
};

/** F3: destructive actions need a confirmation. Native <dialog> gives focus trap and Escape for free. */
export function ConfirmDelete({ action, id, title, body, triggerLabel }: Props) {
  const t = useTranslations("common");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const bodyId = useId();

  return (
    <>
      <button type="button" className={ui.buttonDanger} onClick={() => dialogRef.current?.showModal()}>
        {triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={headingId}
        aria-describedby={bodyId}
        className="m-auto w-[min(92vw,24rem)] rounded-lg border border-neutral-300 p-5 text-neutral-900 backdrop:bg-black/50"
      >
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={id} />
          <h2 id={headingId} className="text-lg font-semibold">
            {title}
          </h2>
          <p id={bodyId} className="text-neutral-700">
            {body}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className={ui.buttonSecondary}
              onClick={() => dialogRef.current?.close()}
              autoFocus
            >
              {t("cancel")}
            </button>
            <SubmitButton variant="danger">{t("delete")}</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
