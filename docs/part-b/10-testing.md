# 10. Testing, quality and known issues

## 10.1 How the product was tested

| Type | What was covered | Where it lives / how to run it |
|---|---|---|
| **Automated tests (if any)** | Unit tests for the working-day arithmetic behind screen 17: counting working days across weekends, a public holiday inside the window, zero and negative input, the reply window from a "5–10 working days" template (6 tests, all passing). Type checking of every message key (`t("documents.fom.title")` is a compile error) and of every route (`PageProps<"/[locale]/documents/[id]">`). | `src/lib/workingDays.test.ts`; `npm test` (Node.js test runner through `tsx`), `npx tsc --noEmit`, `npm run lint`, `npm run build`. Run before every pull request; no hosted CI (8.5). |
| **Manual test pass** | The demo path in 1.4 end to end in all three locales after every merge to `main`: start a journey, attach and add documents, each status transition, the rejection note, corrections and votes, rename and delete with the dialogs, path complete, restart of the server (F2), the holiday service switched off (`NAGER_DATE_BASE_URL` dead address), offline (DevTools → Offline). Plus the review of each other's pull requests (8.4). | Described in the PR descriptions ("Checked") and reviews. Seed: `npm run db:reset`. |
| **Cross-browser / device check** | Chrome 157 (desktop and the 375 px / 320 px mobile emulation with touch) is the reference and the only browser the scripted checks ran in; Safari 18 on macOS and iOS Safari were used by hand for the demo path. Not tested: Firefox, Android Chrome on a real device. | Playwright scripts for the 375 / 320 / 1280 px runs are the ones listed in 7.2; screenshots in `docs/part-b/figures/`. |
| **Locale check** | Key parity script (240/240 in en, hr, ru), the `/dev/i18n` evidence page (plurals 0/1/2/5/21/25, dates, numbers, currency, lists, collation) copied into 6.3–6.4, the missing-key marker in development, Maroje's native-speaker review of Croatian (#10), Hlib's of Russian, screen 03 and 16 in all three locales (6.5, 6.6), 320 px in all three locales. | `messages/*.json`, `src/app/[locale]/dev/i18n/page.tsx`. |
| **Accessibility check** | The ten-minute check of Section 7 on every implemented screen (01, 03, 09, 10, 11–20) with axe-core 4.14, scripted keyboard / focus / target-size / contrast / zoom probes and an accessibility-tree walkthrough of two complete tasks; findings fixed in PRs #9 and #20 or logged (#5, #6, #7 and 7.5). | Section 7; transcripts in `docs/part-b/figures/sr-walkthrough-*.txt`. |

## 10.2 Known bugs and limitations

| Issue | Impact on the user | Workaround | Issue link |
|---|---|---|---|
| Find-office screen with REST Countries is not built; every journey started from screen 03 is Croatian | Users outside Croatia get the Croatian holiday calendar on screen 17, and the office finder from the wireframes does not exist | None in the interface; the `countryCode` column exists, so a journey can be re-pointed in Prisma Studio | [#17](https://github.com/ma2357-dbk/paper-trail/issues/17) |
| No service worker: a cold load without a connection shows the browser's error page | Someone opening the app for the first time inside a building without signal sees nothing | Open the documents before entering; pages already loaded stay readable and the offline banner explains what works | [#7](https://github.com/ma2357-dbk/paper-trail/issues/7) |
| Unknown document or journey id returns the not-found page with HTTP status 200 | Search engines and link checkers see a valid page; users see the correct "Not found" screen | None needed for users | [#5](https://github.com/ma2357-dbk/paper-trail/issues/5) |
| Disabled submit buttons (offline, or while saving) have 2.6:1 label contrast | Low-vision users may not read the label of a disabled button; the state is also explained in text next to it | The explanatory hint is always present | [#6](https://github.com/ma2357-dbk/paper-trail/issues/6) |
| Croatian strings on screens 01–10 were drafted by Hlib after Maroje's review of the file | A few of the newest strings have not had a second native-speaker pass | — | [#13](https://github.com/ma2357-dbk/paper-trail/issues/13) (closed; re-open for the second pass) |
| The screen-reader walkthrough was recorded through the accessibility tree, not listened to with VoiceOver | Verbosity and voice switching could differ from what the transcript shows | — | [#8](https://github.com/ma2357-dbk/paper-trail/issues/8) |
| Uploaded scans are stored in SQLite (2 MB limit) and served through the app | Fine locally; a deployment with many users would need object storage | Keep scans small; PDF uploads are allowed | — |

## 10.3 What we would do next

1. **Country picker with REST Countries (#17).** It completes Maroje's feature area, makes the
   holiday calculation correct for every user, and it is the one thing from the merged screen map
   that is still missing; everything else in the list depends on knowing the country.
2. **Offline support with a service worker and an offline page (#7).** The "no signal in the
   office" scenario is the reason the wallet exists; today it only works if the page was opened
   before the signal dropped.
3. **Step details from Maroje's wireframes (06) and the find-office map (08)** as real screens on
   top of the step page: office address, opening hours and fee per step, fed by the country from
   step 1, with the corrections mechanism from screen 19 attached to each office.
