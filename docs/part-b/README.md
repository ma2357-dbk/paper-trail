# Part B — submission document

Text for every section of the Part B template (`UX_Deliverable2_Implementation_Template.docx`), one
Markdown file per section; the figures are in `figures/`. Everything here is copied from the
running product, the code or the GitHub record, not from documentation — the repository is the
evidence, this is the guided tour. The generated `Team00_UX_Deliverable2.docx` / `.pdf` are the
submission.

| Section | File | Written by |
|---|---|---|
| 1 Team, product and repository | [01-team.md](01-team.md) | Hlib |
| 2 Architecture and technology | [02-architecture.md](02-architecture.md) | Hlib |
| 3 From wireframes to screens | [03-screens.md](03-screens.md) | Hlib (Maroje confirms the names of his dropped screens 02, 04–08) |
| 4 Database | [04-database.md](04-database.md) | Hlib |
| 5 External REST API integration | [05-external-api.md](05-external-api.md) | Hlib |
| 6 Internationalization and localization (6.1–6.8) | [06-i18n.md](06-i18n.md) | Hlib; Croatian checked by Maroje |
| 7 Accessibility report, screens 01–20 | [07-accessibility.md](07-accessibility.md) | Hlib |
| 8 Git history and teamwork | [08-git.md](08-git.md) | Hlib |
| 9 Weekly progress log | [09-weekly-log.md](09-weekly-log.md) | Hlib (Maroje adds his reasons for the empty weeks) |
| 10 Testing, quality and known issues | [10-testing.md](10-testing.md) | Hlib |
| 11 Individual contribution statements | [11-contributions.md](11-contributions.md) | Hlib; Maroje's block drafted from the repository, to be confirmed and signed by him |
| 12 AI usage declaration | [12-ai.md](12-ai.md) | Hlib; Maroje names his assistant and signs |
| 13 Submission checklist | [13-checklist.md](13-checklist.md) | Hlib |

## How the evidence was produced

- Screenshots: Chrome driven by Playwright at 375 × 740 CSS px (2× scale), 320 px wide for the
  narrow-viewport check and 1280 px with CSS zoom 200 % for the zoom check, against
  `npm run dev` on 2026-11-12 with the seed database.
- Automated accessibility scan: axe-core 4.14 (rules `wcag2a`, `wcag2aa`, `wcag22aa`,
  `best-practice`) injected into every screen 11–20.
- Contrast ratios: computed from the colours the browser actually rendered
  (`getComputedStyle`, resolved through a canvas so Tailwind's `oklch` colours are measured, not
  the palette names).
- Failure state of the external API: `NAGER_DATE_BASE_URL=http://127.0.0.1:9/api/v3` in `.env`
  (see `.env.example`), which makes every holiday request fail with a connection error.
- Diagrams: Mermaid sources `figures/erd.mmd` and `figures/architecture.mmd`, rendered with
  Mermaid 11. GitHub renders the same sources inline in the Markdown files.

## Filled template

`Team00_UX_Deliverable2.docx` is the official template with every section filled from the Markdown
files above (figures embedded). It is generated, not edited by hand:

```bash
python docs/part-b/fill-template.py <UX_Deliverable2_Implementation_Template.docx> docs/part-b docs/part-b/Team00_UX_Deliverable2.docx --with-7 --team
```

(needs `python-docx`). `Team00_UX_Deliverable2.pdf` is the PDF export of that file. Three things
in it are Maroje's to finish before it is final: his contribution statement and signature (11, 12),
the name of the AI assistant he used (12), and the reasons for the weeks without commits (9).
`UX_Deliverable2_PartB_Hlib-sections.docx` is the earlier partial build (Hlib's sections only) and
can be deleted once the full one is reviewed.
