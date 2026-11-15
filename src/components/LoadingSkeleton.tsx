import { useTranslations } from "next-intl";

/** Screen 13: Suspense fallback while a page reads from the database. */
export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  const t = useTranslations("common");
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <p className="text-neutral-700">{t("loading")}</p>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} aria-hidden="true" className="h-16 animate-pulse motion-reduce:animate-none rounded-lg bg-neutral-200" />
      ))}
    </div>
  );
}
