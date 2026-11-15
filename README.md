# Paper Trail

A life-event guide through bureaucracy. When someone moves to another country, starts university, starts a job or changes their legal address, Paper Trail shows every administrative step, document and deadline that applies to them in one place, so they finish on time without missed appointments or rejected applications. It implements the ISTE.260 team topic "Paper Trail".

## Team

| Name | GitHub | Feature area (Deliverable 1) |
|------|--------|------------------------------|
| Hlib Ukhovskyi | @hlibukh-coder | Screens 11–20: documents wallet, step requirements, step status, waiting, rejected, offline, path complete |
| Maroje Alamat | @ma2357-dbk | Screens 01–10: onboarding, life event, path, step details, find office, journeys |

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend + backend | Next.js 16 (App Router, TypeScript) |
| i18n | next-intl (ICU messages, `Intl.*` formatting) |
| Database | SQLite via Prisma 7 (Postgres for deployment) |
| Styling | Tailwind CSS 4 |
| Lint | ESLint (eslint-config-next) |

Prerequisites: Node.js 22+, npm 10+.

## Setup

```bash
git clone https://github.com/ma2357-dbk/paper-trail.git
cd paper-trail
npm install
cp .env.example .env
npm run db:migrate          # creates prisma/dev.db and applies prisma/migrations
npm run db:seed             # loads the catalogue + an example journey and wallet
npm run dev                 # http://localhost:3000
npm test                    # unit tests (working-day arithmetic)
```

## Database

SQLite through Prisma 7 (`prisma/schema.prisma`, migrations in `prisma/migrations`, seed in `prisma/seed.ts`). The Prisma client is generated into `src/generated/prisma` on `npm install` (not committed). Timestamps are stored in UTC and converted for display. Text columns are UTF-8, so names like "Ивана Šimunić" round-trip unchanged.

Two layers: the **catalogue** (`LifeEvent`, `StepTemplate`, `DocumentType`, `StepRequirement`) is seeded and its user-visible text lives in `messages/<locale>.json` under `catalog.*`, keyed by row id; **user data** (`Journey`, `Step`, `Document`, `StepDocument`, `Correction`) is created through the interface.

`npm run db:reset` drops the database, re-applies migrations and re-seeds. `npm run db:studio` opens Prisma Studio to inspect the data.

## External API

[Nager.Date](https://date.nager.at) public-holiday API, no key required, called from the server only (`src/lib/nagerDate.ts`). It turns a step's typical waiting time ("5–10 working days") into real dates on the *Waiting for a reply* screen and sets the reminder date when a step is submitted. Responses are cached for a day per country and year. Every failure (offline, timeout, HTTP 429, unknown country, 5xx, malformed body) is mapped to a reason; the screen then falls back to weekends-only arithmetic and says so. The pure date logic is in `src/lib/workingDays.ts` with tests.

[REST Countries](https://restcountries.com) is planned for the *find office* screen.

## Screens

| Route | Screens |
|---|---|
| `/[locale]` | 01: home with the current journeys and the entry points |
| `/[locale]/events` | 03: pick a life event and start a journey |
| `/[locale]/journeys`, `/journeys/[id]/edit` | 09, 10: all journeys with progress, rename, delete with confirmation |
| `/[locale]/documents`, `/documents/new`, `/documents/[id]` | 11–14: documents wallet, add/scan, reading state, edit and delete with confirmation |
| `/[locale]/journeys/[id]/steps` | 16: status of every step |
| `/[locale]/journeys/[id]/steps/[stepId]` | 15, 17, 18, 19: requirements, waiting for a reply, rejected, recent corrections |
| `/[locale]/journeys/[id]/complete` | 20: path complete |
| every page | offline banner (screen 19), loading skeletons, error boundary with retry, 404 |

Uploaded scans (JPEG/PNG/WebP/PDF, 2 MB max) are stored in the database and served from `/api/documents/[id]/file`.

## Locales

- `en` English (source)
- `hr` Croatian
- `ru` Russian (different plural system; checked by a native speaker)

Translations live in `messages/<locale>.json`. To add a locale: copy `messages/en.json`, translate every key, and add the locale code to the i18n config.

## Ways of working

- `main` is always runnable and protected. Nobody pushes to it directly.
- One branch per feature or fix: `feature/<name>`, `fix/<name>`, `chore/<name>`.
- Every change goes through a pull request reviewed by another team member. The PR description says what changed, why, which issue it closes and which definition-of-done items are met.
- Commit messages in the imperative with a conventional prefix: `feat: add plural rules for Croatian`.
- Each member commits under their own GitHub account with their real name in git config.

## Known limitations

- Journeys started from screen 03 are always Croatian (`countryCode: "HR"`) until the country picker (#17) exists.
- Unknown document or journey ids render the not-found screen but, because the page streams, with HTTP status 200.
- Offline mode is read-only: pages already loaded stay readable and forms are disabled; there is no service worker, so a cold load without a connection fails.
- Server Actions resolve the locale with `getLocale()`; next-intl notes root params are not yet supported there, so a future upgrade may need an explicit locale.

## Third-party code and attribution

Libraries are listed in `package.json`. Any copied snippets will be attributed here.
