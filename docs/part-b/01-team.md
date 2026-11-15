# 1. Team, product and repository

## 1.1 Identification

| | |
|---|---|
| **Team name / number** | Maroje and Hlib (two-member team; no team number was assigned) |
| **Project topic (number and title)** | 1. Paper Trail (Additional Set) |
| **Application name** | Paper Trail |
| **Platform (web / mobile / both)** | The topic says mobile; built as a mobile-first responsive web application, demonstrated at 375 px (and checked at 320 px) |
| **Repository URL** | [https://github.com/ma2357-dbk/paper-trail](https://github.com/ma2357-dbk/paper-trail) (public) |
| **Release tag submitted** | `v1.0-deliverable2` |
| **Live deployment URL (if any)** | None (runs locally, see the README) |
| **Date of submission** | 15.11.2026 |

## 1.2 Team members

| Name | GitHub username | Feature area owned (from Deliverable 1) | Main responsibility in the build |
|---|---|---|---|
| Hlib Ukhovskyi | hlibukh-coder | Screens 11–20: documents wallet, scan, reading state, step requirements, step status, rejected, waiting for a reply, recent corrections, offline mode, path complete | Project scaffold, i18n infrastructure (next-intl, en/hr/ru), Prisma data model, migrations and seed, Nager.Date integration, screens 11–20, accessibility checks and fixes, Russian locale, Croatian draft, Part B sections 2, 4, 5, 6, 7, 8, 10 and the document build |
| Maroje Alamat | ma2357-dbk | Screens 01–10: onboarding, life event, path, step details, find office, journeys | Repository owner and branch protection, review of every pull request from Hlib, Croatian native-speaker review of all strings, screens 03 (pick a life event), 09 (journeys list) and 10 (rename a journey), issues for his screens |

## 1.3 The product in three sentences

Paper Trail is a life-event guide through bureaucracy: when someone moves to another country or
starts university it shows every administrative step, document and deadline that applies to them,
in order, in one place. It is for people who have to deal with offices in a language or a system
they do not know yet, first of all international students in Croatia. Unlike government portals,
which list services, it keeps the user's own documents in a wallet, reuses them across steps,
turns "5–10 working days" into real dates using the public-holiday calendar of the country, and
lets users correct the guide for the next person.

## 1.4 Elevator demo path

Run `npm run db:reset && npm run dev` first (seed data: one journey "Selidba u Zagreb" with step 2
submitted, three documents in the wallet), then open `http://localhost:3000`.

| Step | Screen | What the reviewer should see | Which requirement it demonstrates |
|---|---|---|---|
| 1 | 01 Home (`/en`) | The product in one sentence, "Start a new journey", "My documents", and the seeded journey as a shortcut. Switch the language selector to Hrvatski and to Русский: the whole interface, including dates and plurals, changes and the choice survives a reload. | F5 locales |
| 2 | 03 Pick a life event (`/en/events`) | Two life events with their step count ("5 steps"). Press *Start* on "Moving to another country": a journey with five steps is created in the database. | F1 start of the journey, F3 create |
| 3 | 16 Steps of the journey | The new journey's title gets keyboard focus, the progress bar says "0 of 5 steps done", every step is a link with a status badge and a deadline. Open step 2, "Register your new address". | F1, F6 loading skeleton while the data streams |
| 4 | 15 Step requirements | "What to bring": required documents with *Missing* / *Ready*, a wallet picker to attach an existing document, and a link to add a missing one. Attach "Dokaz o adresi" from the wallet. | F3 (join table write), F1 |
| 5 | 12 → 14 Add a document | From the wallet, add a document with a name in any script (e.g. "Potvrda · Іван"), a type, a valid-until date and a scan; the loading state "Reading your scan…" appears, then the document page with its image. Edit it, then delete it: the confirmation dialog must be confirmed. | F2 persistence (restart the server, it is still there), F3 read / update / delete with confirmation, F6 |
| 6 | 15 → 17 Waiting for a reply | Press *I submitted it*: the waiting section shows the expected reply window computed with the Croatian public holidays from Nager.Date ("1 public holiday in this window: Dan sjećanja na žrtve Domovinskog rata (Nov 18, 2026)") and a progress bar of working days. Set `NAGER_DATE_BASE_URL` in `.env` to the dead address from `.env.example` and reload: the screen says the holiday service is unavailable and counts weekends only. | F4 external API used for a calculation, F6 unavailable state |
| 7 | 18, 19 Rejected and corrections | Press *It was rejected*, write what to fix; then vote on a correction and send one ("Office moved to Savska 41"). | F1, F3 |
| 8 | 09, 10 Journeys | Rename the journey (Cyrillic and Croatian letters survive), then delete it: the dialog opens on *Cancel*, Esc closes it, confirming removes the journey and the empty state appears. | F3 update and delete with confirmation, F6 empty state |
| 9 | 20 Path complete | Mark the remaining steps of "Selidba u Zagreb" done and open *Path complete*: summary with step and day counts in the locale's plural forms. | F1 end of the journey, F5 plurals |
| 10 | Any screen, keyboard only | Tab through a screen: skip link, visible focus ring on every control, 44 px targets; disconnect the network: the offline banner appears and submit buttons are disabled with an explanation. | F7 accessibility baseline, F6 offline state |
