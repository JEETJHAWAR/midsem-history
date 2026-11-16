# History study guides: how they were made (and how to reuse them for the endsem)

This folder turns the course readings and lecture PPTs into printable study PDFs.
It was built for the BMS-01 *World & Indian History* midsem (Sessions 1–4 and 6–11).
The same pipeline can be reused for the endsem.

## 1. What was made

| File | What it is | Pages |
|---|---|---|
| `History_Midsem_Study_Guide.pdf` | **Full guide.** Everything from the readings and PPTs, session by session, with priority badges (Must know / Supporting / Background / Prof: may skip), maps, timelines, tables, exam corners, and a synthesis part (themes, who's who, glossary, 30 MCQs, answer plans). | ~110 |
| `History_Midsem_Exam_Essentials.pdf` | **Simple version.** Every key point in plain language, an e.g. for each idea, a diagram or map per session, and a model answer per session. Side details are marked "Skip". Ends with a night-before revision sheet. | ~69 |
| `History_Midsem_Model_Answers.pdf` | **All sample Q&A in one place.** The professor's two models from class, one model answer per session, and 6 short-answer plus 4 essay plans. | ~11 |

Each PDF also has a matching `.html` file you can open in a browser.

## 2. Folder layout

```
study-guide/
├── build.js          # builds HTML + PDF; also draws the SVG maps
├── style.css         # styles for all editions
├── style-lite.css    # extra styles for the simple edition and model answers
├── make_qa.py        # collects model answers into src-qa/01-qa.html
├── src/              # full guide: one HTML file per session (sorted by filename)
├── src-lite/         # simple edition: one HTML file per session
└── src-qa/           # generated model-answer file (don't edit by hand)
```

Files in each `src*` folder are joined **in filename order**, so name them
`00-front.html`, `01-s1.html`, `02-s2.html` and so on.

## 3. How the pipeline works

1. **Get the text out of the PDFs.** Use `pdftotext -layout file.pdf out.txt`. One reading (Madan) was a scanned PDF with no text, so its pages were rendered as images (`pdftoppm -r 100 -png file.pdf page`) and read from those.
2. **Write each session as an HTML file** in `src/` or `src-lite/`, using the ready-made boxes and components (section 6 below).
3. **Add maps** by putting `<!--MAP:map_id-->` in the HTML. Maps are defined in `build.js`:
   - `PLACES`: place name → [longitude, latitude]
   - `MAPS`: which routes and points each map shows
   - `OFFSETS`: label positions, if labels overlap
4. **Build.** `build.js` joins the files, swaps in the maps, writes the `.html`, and prints the PDF with headless Chromium (Playwright).
5. **Check the pages visually** before sharing. Render them with `pdftoppm -r 40 -png guide.pdf p`, optionally make one contact sheet with `montage p-*.png -tile 8x3 sheet.png`, and look for overlaps, orphaned headings or empty half-pages.

## 4. Run it on your own computer

You need:
- **Node.js 18+**
- **Playwright** (prints the PDF):
  ```bash
  cd study-guide
  npm init -y
  npm install playwright
  npx playwright install chromium
  ```
- **Python 3**: only for `make_qa.py`.
- **Optional:** `poppler-utils` (for `pdftotext` and `pdftoppm`) and ImageMagick (for `montage`), for extracting text and previewing pages.
  - Mac: `brew install poppler imagemagick`
  - Ubuntu: `sudo apt install poppler-utils imagemagick`
  - Windows: use WSL, or install Poppler for Windows.

Build commands (run inside `study-guide/`):

```bash
node build.js                              # full guide    -> History_Midsem_Study_Guide.pdf
node build.js --lite                       # simple guide  -> History_Midsem_Exam_Essentials.pdf
python3 make_qa.py && node build.js --qa   # model answers -> History_Midsem_Model_Answers.pdf
node build.js --html-only                  # HTML only, no PDF (fast preview in a browser)
```

Fonts: the pages ask for **Inter** for headings and **Charter / Caladea / Liberation Serif** for body text, falling back to Arial and Georgia. Install Inter from Google Fonts if you want the same look.

## 5. Reusing this for the endsem

1. Make a new folder in the repo, for example `endsem-guide/`. Copy `build.js`, `style.css`, `style-lite.css` and `make_qa.py` into it, and create empty `src/` and `src-lite/` folders.
2. In `build.js`, rename the output files (`OUT_BASE`) and the header text, e.g. "Endsem Study Guide" and "Sessions 12–20".
3. Put the endsem readings, PPTs and course outline in the repo, then extract their text (section 3).
4. Write the session files, or ask Claude to (section 7 has a ready prompt).
5. If the endsem has new places to map, add them to `PLACES` and a new entry to `MAPS` in `build.js`. You can delete the midsem maps you don't need.
6. Build, check the pages, then commit and push.

## 6. Building blocks you can use in the HTML

| Write this | You get |
|---|---|
| `<section class="session">` … `</section>` | A new session that starts on a new page |
| `<div class="session-head">` with `session-num` and `session-title` | The big session header |
| `<span class="badge b-hi">Must know</span>` | Priority badge; other levels are `b-mid` (Supporting), `b-lo` (Background) and `b-skip` (Prof: may skip) |
| `<div class="box key">` | Coloured box; other types are `why`, `simple`, `support`, `summary`, `exam` and `low` |
| `<div class="oneline">` | The dark "In one line" summary (simple edition) |
| `<div class="ideas">` with `<div class="idea">` cards | Two-column keyword cards; card colours are `red`, `green`, `gold`, `purple` and `teal` |
| `<span class="eg">…</span>` | An "e.g." example strip |
| `<span class="like">…</span>` | A "Think of it like…" analogy strip |
| `<div class="vs">` with `side a`, `mid`, `side b` | A side-by-side comparison, e.g. strengths vs limits |
| `<div class="flow">` with `node n1`…`n5` and `arrow` | A flow diagram |
| `<div class="timeline">` with `<div class="tl">` (or `tl hi` to highlight) | A timeline |
| `<div class="answer">` with a `box-title`, a `q` line and paragraphs | A model answer. `make_qa.py` collects every one of these from `src-lite/` |
| `<p class="skipnote">` | A "Skip:" note for side details |
| `<div class="avoid">` | Keeps its contents together on one page |
| `<!--MAP:id-->` | A map defined in `build.js` |

## 7. Ready-to-paste prompt for Claude (endsem)

> I have my History endsem soon. All the readings, class PPTs and the course outline are in this repo in `<folder>`. The syllabus is Sessions X–Y (excluding Z). Reuse the pipeline in `study-guide/` (see its README) to make an `endsem-guide/` with three PDFs:
> 1. A **full guide** covering every topic, concept and important detail from the readings, with the PPTs giving the structure.
> 2. A **simple Exam Essentials** version. It must keep **every key point** (do not cut key points to save space), explain them in simple language with keywords in bold, give an e.g. for each idea, include a diagram or map per session, and end each session with a ready model answer.
> 3. A **Model Answers** PDF with all sample questions and answers in one place. Put any model answers the professor gave in class first.
>
> Organise everything session-wise and mark Must know / Supporting / Skip. Mark any parts the professor said we may leave out. Avoid crowded pages. Check every page visually before sending, then commit and push.

## 8. What I learned from the midsem (keep these in mind)

- **Don't drop key points to make it shorter.** The first simple version cut real exam points (how traditional societies change, the 3 problems with Zapata's restoration, chronology). "Simple" should mean easier words, not less content.
- **The professor's own model answers matter most.** Put them first and follow their structure. For example, the doctrine vs lived-religion answer goes: Islam → Kashmir's Rishi order → Hinduism → Christianity → conclusion.
- **Exam format (Lecture 16):** 10 MCQs × ½ mark, 3 of 5 short answers × 10 marks, 1 essay × 15 marks. Write paragraphs, not bullets. Name scholars, and give examples and dates.
- **Answer shape:** thesis → 2–3 points, each with a scholar and an example → one "but" (criticism) → conclusion linked to the course's big idea.
- **Check scanned PDFs.** If `pdftotext` returns empty text, the PDF is a scan; render the pages as images and read those.
