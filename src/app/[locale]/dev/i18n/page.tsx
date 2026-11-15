import { getFormatter, getLocale, getTranslations } from "next-intl/server";

/**
 * Developer page that proves the i18n layer works. It is the evidence for
 * Part B sections 6.3 (plural rules) and 6.4 (locale-aware formatting):
 * every value here comes from Intl.* through next-intl, never from string
 * concatenation.
 */
export default async function I18nDemoPage() {
  const locale = await getLocale();
  const t = await getTranslations("i18nDemo");
  const tTypes = await getTranslations("catalog.documentTypes");
  const format = await getFormatter();

  const now = new Date("2026-11-11T14:05:00Z");
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const names = ["Šimun", "Ana", "Ćiril", "Čedo", "Zoran", "Đuro", "Cvita"];
  const sorted = [...names].sort(new Intl.Collator(locale).compare);

  const rows: Array<[string, string]> = [
    [t("shortDate"), format.dateTime(now, { dateStyle: "short" })],
    [t("longDate"), format.dateTime(now, { dateStyle: "full" })],
    [t("time"), format.dateTime(now, { timeStyle: "short" })],
    [t("relativeTime"), format.relativeTime(threeDaysAgo, now)],
    [t("largeNumber"), format.number(1234567)],
    [t("decimalNumber"), format.number(1234.56)],
    [t("percentage"), format.number(0.256, { style: "percent" })],
    [t("currency"), format.number(49.9, { style: "currency", currency: "EUR" })],
    [t("list"), format.list(["id-card", "lease-contract", "proof-of-address"].map((id) => tTypes(id as never)))],
    [t("sortedNames"), sorted.join(", ")],
  ];

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <div>
        <h2 className="text-lg font-medium">{t("pluralsHeading")}</h2>
        <ul className="list-disc ps-6">
          {[0, 1, 2, 5, 21, 25].map((count) => (
            <li key={count}>{t("documentsCount", { count })}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-medium">{t("formattingHeading")}</h2>
        <table className="w-full text-sm">
          <caption className="sr-only">{t("formattingHeading")}</caption>
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label} className="border-b border-neutral-200">
                <th scope="row" className="py-2 pe-4 text-start font-normal text-neutral-600">
                  {label}
                </th>
                <td className="py-2">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
