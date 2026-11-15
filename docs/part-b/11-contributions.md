# 11. Individual contribution statements

One block per member. Maroje's block was drafted by Hlib from the repository record and must be
confirmed, edited and signed by Maroje before submission.

### Member 1

| | |
|---|---|
| **Name** | Hlib Ukhovskyi |
| **GitHub username** | hlibukh-coder |
| **What I built (features, files, modules)** | Project scaffold (Next.js 16, Tailwind, Prisma 7, next-intl); the i18n infrastructure (`src/i18n/*`, `src/proxy.ts`, `messages/en.json`, the Croatian draft and the Russian locale, 240 keys each, the `/dev/i18n` evidence page); the data model, migration and seed (`prisma/`); the Nager.Date client and working-day logic with tests (`src/lib/nagerDate.ts`, `src/lib/workingDays.ts`); screens 11–20 (`src/app/[locale]/documents/**`, `journeys/[journeyId]/steps/**`, `journeys/[journeyId]/complete`, the file route) with their Server Actions, loading, error, not-found and offline states; shared components (`DocumentForm`, `ConfirmDelete`, `SubmitButton`, `OfflineBanner`, `StatusBadge`, `LocaleSwitcher`, `FocusOnHash`); the ten-minute accessibility check and the screen-reader walkthrough with the fixes on all implemented screens; the README; Part B sections 2, 4, 5, 6, 7, 8, 10, 12 and the script that fills the template (`docs/part-b/`). |
| **My commits / PRs that show it** | PRs #1, #2, #3, #4, #9, #19, #20 (author); reviews of #10, #11, #12, #18; 17 commits, e.g. `feat: add Nager.Date holiday service and working-day arithmetic`, `feat: add documents wallet with upload, edit and confirmed delete (screens 11–14)`, `fix(a11y): act on the screen reader walkthrough of screens 11–20`. |
| **What I learned that I did not know before** | That a screen reader is silent after a form action unless focus is moved on purpose — the `redirect("#heading")` + focus pattern came from the walkthrough, not from a checklist. How CLDR plural categories work in practice (21 is "one" in Croatian and Russian) and why `Intl.ListFormat` and `Intl.Collator` exist. How Next.js 16 `cacheComponents` forces the split between the static shell and request-time data (`connection()`), and how to work with stacked pull requests and branch protection without losing a PR. |
| **Weeks I could not contribute, and why** | Weeks 1–3 of the period (19.10–8.11): no commits from anyone; the team started the build on 11.11. |
| **Signature / date** | Hlib Ukhovskyi, 15.11.2026 |

### Member 2

| | |
|---|---|
| **Name** | Maroje Alamat |
| **GitHub username** | ma2357-dbk |
| **What I built (features, files, modules)** | Created the repository, protected `main` and set up the collaboration; reviewed and approved the four infrastructure pull requests (#1–#4); native-speaker review and correction of the Croatian locale (`messages/hr.json`, #10, issue #13); screen 03 pick a life event with the `startJourney` Server Action (`src/app/[locale]/events/**`, #11); screen 09 journeys list with confirmed delete and empty state (`src/app/[locale]/journeys/page.tsx`, #12); screen 10 rename a journey with validation (`journeys/[journeyId]/edit`, `JourneyForm`, `renameJourney`, #18); the issues for his screens (#14–#17). |
| **My commits / PRs that show it** | PRs #10, #11, #12, #18 (author); reviews of #1, #2, #3, #4; 9 commits, e.g. `fix(i18n): correct Croatian wording for journeys`, `feat(journeys): add journeys list with confirmed delete and empty state`. |
| **What I learned that I did not know before** | *(to be written by Maroje)* |
| **Weeks I could not contribute, and why** | Weeks 1–3 of the period (19.10–8.11): no commits from anyone; the team started the build on 11.11. *(reason to be stated by Maroje)* |
| **Signature / date** | *(Maroje Alamat, date)* |
