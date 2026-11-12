# Part B — submission document, Hlib's sections

Draft text for the Part B template (`UX_Deliverable2_Implementation_Template.docx`), one file per
section that Hlib owns. Maroje pastes these into the shared .docx next to his sections; the
figures are in `figures/`. Everything here is copied from the running product or the code, not
from documentation — the repository is the evidence, this is the guided tour.

| Section | File | Owner |
|---|---|---|
| 2 Architecture and technology | [02-architecture.md](02-architecture.md) | Hlib |
| 4 Database | [04-database.md](04-database.md) | Hlib |
| 5 External REST API integration | [05-external-api.md](05-external-api.md) | Hlib |
| 6.2 How i18n is implemented, 6.3 Plural rules, 6.4 Locale-aware formatting, 6.7 Direction and script | [06-i18n.md](06-i18n.md) | Hlib |
| 7 Accessibility report, screens 11–20 | [07-accessibility.md](07-accessibility.md) | Hlib (Maroje adds screens 01–10) |
| 1, 3, 6.1, 6.5, 6.6, 6.8, 8, 9, 12 | — | Maroje |

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

`UX_Deliverable2_PartB_Hlib-sections.docx` is the official template with sections 2, 4, 5, 6.2–6.4,
6.7 and 7 filled in from the Markdown files above (figures embedded). It is generated, not edited by
hand: `python fill-template.py <template.docx> docs/part-b <out.docx> --with-7` (needs
`python-docx`). Maroje fills sections 1, 3, 6.1, 6.5, 6.6, 6.8, 8, 9, 12 and his part of 7 in the
same file and exports the PDF.
