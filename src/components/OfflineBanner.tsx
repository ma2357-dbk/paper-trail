"use client";

import { useTranslations } from "next-intl";
import { useOnline } from "@/hooks/useOnline";

/** Screen 19: shown at the top of every page while the browser reports no connection. */
export function OfflineBanner() {
  const t = useTranslations("offline");
  const online = useOnline();

  return (
    <div role="status" aria-live="polite" className="contents">
      {!online && (
        <p className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-950">
          <strong>{t("title")}</strong> {t("body")}
        </p>
      )}
    </div>
  );
}
