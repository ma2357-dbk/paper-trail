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
npx prisma migrate dev      # creates prisma/dev.db and applies migrations
npx prisma db seed          # loads seed data (TBD)
npm run dev                 # http://localhost:3000
```

## External API

TBD. Candidates: [Nager.Date](https://date.nager.at) (public holidays, to keep deadlines off non-working days) and [REST Countries](https://restcountries.com). No key required. Called from the server side only.

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

TBD, including accessibility issues not fixed.

## Third-party code and attribution

Libraries are listed in `package.json`. Any copied snippets will be attributed here.
