"""Fill Hlib's Part B sections of the UX Deliverable 2 template from docs/part-b/*.md.

Usage: python fill_docx.py <template.docx> <docs/part-b dir> <out.docx>
Template tables are addressed by their index in the document body (T15 = 2.1 Stack, ...),
which was read off the template with python-docx; the script asserts the first-row text so a
changed template fails loudly instead of filling the wrong table.
"""
import copy
import re
import sys
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt
from docx.table import Table
from docx.text.paragraph import Paragraph

TEMPLATE, DOCS, OUT = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
FIG = DOCS / "figures"
doc = Document(str(TEMPLATE))

# ----------------------------------------------------------------------------- markdown bits
def md_tables(text: str):
    """All pipe tables in a markdown text, as lists of rows (header included, separator dropped)."""
    tables, cur = [], []
    for line in text.splitlines():
        if line.startswith("|"):
            if re.fullmatch(r"\|?[\s:\-|]+\|?", line.strip()):
                continue  # header separator
            cells = [c.strip() for c in line.strip().strip("|").split(" | ")]
            cur.append(cells)
        elif cur:
            tables.append(cur); cur = []
    if cur:
        tables.append(cur)
    return tables


def md_section(text: str, heading: str) -> str:
    """Body of a '## heading' section up to the next '## '."""
    m = re.search(rf"^## {re.escape(heading)}.*?$\n(.*?)(?=^## |\Z)", text, re.S | re.M)
    assert m, heading
    return m.group(1)


TOKEN = re.compile(r"(\*\*.+?\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*\n]+\*)")


def add_hyperlink(paragraph: Paragraph, url: str, text: str):
    part = paragraph.part
    r_id = part.relate_to(url, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", is_external=True)
    link = OxmlElement("w:hyperlink"); link.set(qn("r:id"), r_id)
    run = OxmlElement("w:r"); rpr = OxmlElement("w:rPr")
    color = OxmlElement("w:color"); color.set(qn("w:val"), "1155CC"); rpr.append(color)
    u = OxmlElement("w:u"); u.set(qn("w:val"), "single"); rpr.append(u)
    run.append(rpr)
    t = OxmlElement("w:t"); t.text = text; t.set(qn("xml:space"), "preserve"); run.append(t)
    link.append(run); paragraph._p.append(link)


def inline(paragraph: Paragraph, md: str, size: float | None = None):
    """Render inline markdown (bold, code, links, italics) into runs of a paragraph."""
    md = md.replace("<br>", "\n")
    for tok in TOKEN.split(md):
        if not tok:
            continue
        if tok.startswith("**") and tok.endswith("**"):
            r = paragraph.add_run(tok[2:-2]); r.bold = True
        elif tok.startswith("`") and tok.endswith("`"):
            r = paragraph.add_run(tok[1:-1]); r.font.name = "Consolas"; r.font.size = Pt((size or 10) - 0.5)
            r._element.rPr.rFonts.set(qn("w:hAnsi"), "Consolas"); r._element.rPr.rFonts.set(qn("w:cs"), "Consolas")
        elif tok.startswith("[") and "](" in tok:
            text, url = re.match(r"\[([^\]]+)\]\(([^)]+)\)", tok).groups()
            if url.startswith("http"):
                add_hyperlink(paragraph, url, text)
            else:
                paragraph.add_run(text)
        elif tok.startswith("*") and tok.endswith("*") and len(tok) > 2:
            r = paragraph.add_run(tok[1:-1]); r.italic = True
        else:
            r = paragraph.add_run(tok)
        if size and tok and not (tok.startswith("`")):
            try:
                r.font.size = Pt(size)
            except NameError:
                pass


def clear_cell(cell):
    for p in cell.paragraphs[1:]:
        p._p.getparent().remove(p._p)
    p = cell.paragraphs[0]
    for r in list(p.runs):
        r._r.getparent().remove(r._r)
    for h in p._p.findall(qn("w:hyperlink")):
        p._p.remove(h)
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    return p


def set_cell(cell, md: str, size: float | None = 10):
    """Write markdown into a cell: paragraphs split on blank lines, '- ' bullets, '1. ' numbers."""
    p = clear_cell(cell)
    first = True
    for block in re.split(r"\n\s*\n", md.strip()):
        lines = block.split("\n")
        # bullet / numbered lists: one paragraph per item, continuation lines joined
        items, buf = [], None
        for ln in lines:
            if re.match(r"^\s*(-|\d+\.)\s+", ln):
                if buf is not None:
                    items.append(buf)
                buf = ln.strip()
            elif buf is not None:
                buf += " " + ln.strip()
            else:
                buf = ln.strip() if buf is None else buf + " " + ln.strip()
        if buf is not None:
            items.append(buf)
        for item in items:
            para = p if first else cell.add_paragraph()
            first = False
            m = re.match(r"^(-|\d+\.)\s+(.*)$", item)
            if m:
                prefix = "– " if m.group(1) == "-" else m.group(1) + " "
                para.paragraph_format.left_indent = Cm(0.5); para.paragraph_format.first_line_indent = Cm(-0.5)
                r = para.add_run(prefix)
                if size: r.font.size = Pt(size)
                inline(para, m.group(2), size)
            else:
                inline(para, item, size)
            para.paragraph_format.space_after = Pt(3)


def set_image(cell, path: Path, width_cm: float, caption: str | None = None):
    p = clear_cell(cell)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(str(path), width=Cm(width_cm))
    if caption:
        c = cell.add_paragraph(); c.alignment = WD_ALIGN_PARAGRAPH.CENTER
        inline(c, caption, 9)


def body_tables():
    return [Table(t, doc) for t in doc.element.body.iterchildren() if t.tag == qn("w:tbl")]


ORIG_TBLS = [t._tbl for t in body_tables()]  # captured once: inserted tables must not shift indices


def table(idx: int, first_cell_starts: str) -> Table:
    t = Table(ORIG_TBLS[idx], doc)
    got = t.rows[0].cells[0].text.strip()
    assert got.startswith(first_cell_starts), f"T{idx}: expected {first_cell_starts!r}, got {got!r}"
    return t


def fit_rows(t: Table, needed: int, header_rows: int = 1):
    """Make the table have exactly header_rows + needed rows (add copies of the last row or remove)."""
    while len(t.rows) < header_rows + needed:
        new_tr = copy.deepcopy(t.rows[-1]._tr)
        t._tbl.append(new_tr)
    while len(t.rows) > header_rows + needed:
        t._tbl.remove(t.rows[-1]._tr)


def fill_rows(t: Table, rows, start_col=0, header_rows=1, size=9.5):
    fit_rows(t, len(rows), header_rows)
    for r, md_row in zip(t.rows[header_rows:], rows):
        for c, md in zip(r.cells[start_col:], md_row[start_col:]):
            set_cell(c, md, size)


def fill_kv(t: Table, rows, size=10):
    """Key/value table: the template already has the keys in column 0; fill column 1 in order."""
    assert len(t.rows) == len(rows), f"{len(t.rows)} template rows vs {len(rows)} md rows: {[r[0][:20] for r in rows]}"
    for r, md_row in zip(t.rows, rows):
        key_t = re.sub(r"\W+", " ", r.cells[0].text.lower()).strip()[:14]
        key_m = re.sub(r"\W+", " ", md_row[0].strip("* ").lower()).strip()[:14]
        assert key_t[:8] == key_m[:8], f"key mismatch: template {key_t!r} vs md {key_m!r}"
        set_cell(r.cells[1], md_row[1], size)


def para_after(anchor, md: str, size=10, style=None) -> Paragraph:
    """Insert a new paragraph after an element (paragraph or table) and render markdown into it."""
    new = OxmlElement("w:p")
    el = anchor._p if isinstance(anchor, Paragraph) else anchor._tbl
    el.addnext(new)
    p = Paragraph(new, anchor._parent if isinstance(anchor, Paragraph) else doc._body)
    if style:
        p.style = style
    inline(p, md, size)
    p.paragraph_format.space_before = Pt(4); p.paragraph_format.space_after = Pt(6)
    return p


def para_before(t: Table, md: str, size=10) -> Paragraph:
    new = OxmlElement("w:p"); t._tbl.addprevious(new)
    p = Paragraph(new, doc._body); inline(p, md, size)
    p.paragraph_format.space_after = Pt(6)
    return p


def find_paragraph(prefix: str) -> Paragraph:
    for p in doc.paragraphs:
        if p.text.strip().startswith(prefix):
            return p
    raise KeyError(prefix)


def md_prose(text: str) -> str:
    """Strip images and figure captions from a markdown chunk, keep prose."""
    out = []
    for line in text.splitlines():
        if line.startswith("![") or line.startswith("*Figure") or line.startswith("|") or line.startswith("```") or line.startswith("# "):
            continue
        out.append(line)
    return "\n".join(out).strip()


FULL = 15.5  # cm, text width of the template page
HALF = 7.4

# ============================================================================= 2. Architecture
a = (DOCS / "02-architecture.md").read_text()
t15 = table(15, "Layer")
fill_rows(t15, md_tables(md_section(a, "2.1 Stack"))[0][1:], size=9.5)

t16 = table(16, "[ Insert architect")
set_image(t16.rows[0].cells[0], FIG / "fig-2-1-architecture.png", FULL)
cap = find_paragraph("Figure 2.1")
flow = md_section(a, "2.2 Architecture diagram")
flow_prose = md_prose(flow.split("```")[-1])  # the paragraph after the mermaid block
para_after(cap, flow_prose)

t17 = table(17, "")
rows = md_tables(md_section(a, "2.3 Repository structure"))[0][1:]
set_cell(t17.rows[0].cells[0], "\n\n".join(f"**{r[0]}** — {r[1]}" for r in rows), 9.5)

# ============================================================================= 4. Database
dbm = (DOCS / "04-database.md").read_text()
fill_kv(table(23, "Database engine"), md_tables(md_section(dbm, "4.1 Engine and justification"))[0])
set_image(table(24, "[ Insert the ERD").rows[0].cells[0], FIG / "fig-4-1-erd.png", FULL)
erd_sec = md_section(dbm, "4.2 Entity-relationship diagram")
para_after(find_paragraph("Figure 4.1"), md_prose(erd_sec.split("```")[-1]))
fill_rows(table(25, "Entity / table"), md_tables(md_section(dbm, "4.3 Entities"))[0][1:], size=9)
t26 = table(26, "In the database")
set_image(t26.rows[1].cells[0], FIG / "fig-4-2-database-rows.png", HALF)
set_image(t26.rows[1].cells[1], FIG / "fig-4-2-steps-screen.png", HALF)
ev = md_section(dbm, "4.4 Evidence that it works")
op = ev.split("**One non-trivial operation.**", 1)[1]
set_cell(table(27, "").rows[0].cells[0], "**One non-trivial operation.**" + op, 10)

# ============================================================================= 5. External API
api = (DOCS / "05-external-api.md").read_text()
fill_kv(table(28, "API name"), md_tables(md_section(api, "5.1 The service"))[0])
t29 = table(29, "Endpoint")
sec52 = md_section(api, "5.2 Endpoints used")
fill_rows(t29, md_tables(sec52)[0][1:], size=9)
para_after(t29, md_prose(sec52.split("|")[-1]))
t30 = table(30, "Failure mode")
sec53 = md_section(api, "5.3 Failure handling")
intro53 = md_prose(sec53.split("|")[0])
para_before(t30, intro53)
fill_rows(t30, md_tables(sec53)[0][1:], size=9)
set_cell(table(31, "What you cache").rows[0].cells[0], md_prose(md_section(api, "5.4 Caching and data volume")), 10)
t32 = table(32, "Working state")
set_image(t32.rows[1].cells[0], FIG / "fig-5-1-api-working.png", HALF)
set_image(t32.rows[1].cells[1], FIG / "fig-5-1-api-failure.png", HALF)
cap51 = find_paragraph("Figure 5.1")
sec55 = md_section(api, "5.5 Evidence")
for p in reversed([x for x in sec55.split("\n") if x.startswith("*Figure")]):
    pass
fig_note = re.search(r"\*Figure 5\.1 — (.*?)\*", sec55, re.S)
if fig_note:
    para_after(cap51, fig_note.group(1).replace("\n", " "), 9)

# ============================================================================= 6. i18n (6.2, 6.3, 6.4, 6.7)
i18n = (DOCS / "06-i18n.md").read_text()
sec62 = md_section(i18n, "6.2 How i18n is implemented")
t34 = table(34, "Library / framework")
fill_kv(t34, md_tables(sec62)[0], size=9.5)
rules = sec62.split("Other engineering rules", 1)[1]
para_after(t34, "Other engineering rules from 6.2 of the brief, as implemented:", 10)
anchor = Paragraph(t34._tbl.getnext(), doc._body)
for item in reversed(re.findall(r"^- (.*?)(?=^- |\Z)", rules, re.S | re.M)):
    anchor_p = para_after(anchor, "– " + " ".join(item.split()), 10)
    # keep list order: insert each new item right after the intro, in reverse
sec63 = md_section(i18n, "6.3 Plural rules")
t35 = table(35, "[ paste the messag")
intro63 = md_prose(sec63.split("```json")[0])
code63 = sec63.split("```json")[1].split("```")[0].strip()
cell = t35.rows[0].cells[0]
p = clear_cell(cell); inline(p, intro63, 9.5)
for ln in code63.split("\n"):
    cp = cell.add_paragraph(); r = cp.add_run(ln); r.font.name = "Consolas"; r.font.size = Pt(8.5)
    r._element.rPr.rFonts.set(qn("w:hAnsi"), "Consolas"); r._element.rPr.rFonts.set(qn("w:cs"), "Consolas")
    cp.paragraph_format.space_after = Pt(0)
tail63 = sec63.split("```", 2)[2]
cp = cell.add_paragraph(); inline(cp, md_prose(tail63.split("|")[0]), 9.5)
# rendered plural table as a real table after the message cell
plural_rows = md_tables(sec63)[0]
pt = doc.add_table(rows=len(plural_rows), cols=4)
pt.style = table(37, "What").style
for r, mr in zip(pt.rows, plural_rows):
    for c, md in zip(r.cells, mr):
        cp = c.paragraphs[0]; cp.text = ""; run = cp.add_run(md.strip("*")); run.font.size = Pt(9.5)
        if r is pt.rows[0]:
            run.bold = True
t35._tbl.addnext(pt._tbl)
explain = md_prose(tail63.split("|")[-1])
para_after(pt, explain, 10)
set_image(table(36, "[ Insert screensho").rows[0].cells[0], FIG / "fig-6-1-plurals-hr.png", 12)

sec64 = md_section(i18n, "6.4 Locale-aware formatting")
t37 = table(37, "What")
hdr = t37.rows[0].cells
hp = clear_cell(hdr[3]); r = hp.add_run("Third locale: ru"); r.bold = True
fill_rows(t37, md_tables(sec64)[0][1:], size=8.5)
para_before(t37, md_prose(sec64.split("|")[0]))
para_after(t37, md_prose(sec64.split("|")[-1]))

sec67 = md_section(i18n, "6.7 Direction and script")
t42 = table(42, "Right-to-left")
fill_kv(t42, md_tables(sec67)[0], size=9.5)
t43 = table(43, "[ Insert screensho")
c = t43.rows[0].cells[0]; p = clear_cell(c); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
for name in ("en", "hr", "ru"):
    p.add_run().add_picture(str(FIG / f"fig-6-5-script-{name}.png"), width=Cm(4.9)); p.add_run("  ")
fig65 = re.search(r"\*Figure 6\.5 — (.*?)\*", sec67, re.S)
para_after(find_paragraph("Figure 6.5"), fig65.group(1).replace("\n", " "), 9)

# ============================================================================= 7. Accessibility
acc_path = DOCS / "07-accessibility.md"
if acc_path.exists() and "--with-7" in sys.argv:
    acc = acc_path.read_text()
    intro7 = md_prose(acc.split("## 7.1")[0].split("\n", 1)[1])
    para_after(find_paragraph("7. Accessibility report"), intro7, 10)
    t45 = table(45, "#")
    rows71 = md_tables(md_section(acc, "7.1 The ten-minute check"))[0][1:]
    assert len(rows71) == 10
    for r, mr in zip(t45.rows[1:], rows71):
        for c, md in zip(r.cells[2:], mr[2:]):
            set_cell(c, md, 8.5)
    fill_rows(table(46, "Tool"), md_tables(md_section(acc, "7.2 Tools used"))[0][1:], size=9)
    set_cell(table(47, "").rows[0].cells[0], md_prose(md_section(acc, "7.3 Screen reader walkthrough")), 9.5)
    t48 = table(48, "Measured")
    r74 = md_tables(md_section(acc, "7.4 Contrast evidence"))[0]
    measured, fixed = r74[1]
    set_cell(t48.rows[1].cells[0], measured, 9); set_cell(t48.rows[1].cells[1], fixed, 9)
    t48.rows[1].cells[0].add_paragraph().add_run().add_picture(str(FIG / "fig-7-focus-ring.png"), width=Cm(6.5))
    t48.rows[1].cells[1].add_paragraph().add_run().add_picture(str(FIG / "fig-7-form-error.png"), width=Cm(6.5))
    sec74 = md_section(acc, "7.4 Contrast evidence")
    fig71 = re.search(r"\*Figure 7\.1 — (.*?)\*", sec74, re.S)
    extra = para_after(find_paragraph("Figure 7.1"), fig71.group(1).replace("\n", " "), 9)
    more = para_after(extra, "Further evidence — 320 px viewport, 200 % zoom and the delete dialog:", 9)
    pic = para_after(more, "", 9); pic.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for f in ("fig-7-320px.png", "fig-7-zoom200.png", "fig-7-delete-dialog.png"):
        pic.add_run().add_picture(str(FIG / f), width=Cm(4.9)); pic.add_run("  ")
    fill_rows(table(49, "Issue"), md_tables(md_section(acc, "7.5 Known accessibility issues we did not fix"))[0][1:], size=9)
    set_cell(table(50, "").rows[0].cells[0], md_prose(md_section(acc, "7.6 Inclusive design decisions")), 9.5)

doc.save(str(OUT))
print("saved", OUT)
