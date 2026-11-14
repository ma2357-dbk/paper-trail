"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { ui } from "@/lib/ui";

/** Error state with a retry (F6). */
export default function DocumentsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className={`${ui.card} flex flex-col items-start gap-3 border-red-300`}>
      <h1 className="text-lg font-semibold">{t("errorTitle")}</h1>
      <p className="text-neutral-700">{t("errorBody")}</p>
      <button type="button" className={ui.buttonPrimary} onClick={reset}>
        {t("retry")}
      </button>
    </div>
  );
}
