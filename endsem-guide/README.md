# History endsem study guides

The endsem version of the midsem pipeline in `study-guide/`. It covers **Sessions 12–15 and 17–22** of BMS-01 *World & Indian History* (Session 16 was the midsem).

## What was made

| File | What it is | Pages |
|---|---|---|
| `History_Endsem_Study_Guide.pdf` | **Full guide.** Every reading and PPT, session by session, with priority badges, 8 maps, timelines, tables and an exam corner per session. Ends with a synthesis part: threads, who's who, glossary, 30 MCQs, 10 short-answer plans, 4 essay plans and a last-night sheet. | ~64 |
| `History_Endsem_Exam_Essentials.pdf` | **Simple version.** Every key point in plain words, an e.g. for each idea, a map or diagram per session, and a model answer per session. Ends with a night-before revision sheet. | ~43 |
| `History_Endsem_Model_Answers.pdf` | **All Q&A in one place.** Part A: the professor's own discussion questions from the slides, with plans. Part B: one model answer per session. Part C: extra short-answer and essay plans. | ~13 |

## Sources used

- Readings from the "History endsem" folder: Chakravarti (ch. 8), al-Sharida, H.P. Ray (ch. 11), Wade, Burningham, Nadri (R13), T. Roy ch. 7, Furber ch. 3, Bowen, Barendse (ch. 14), Kosambi & Brush.
- **Not in the folder, so the lecture PPT is the source:** Trocki (S19), Bose & Jalal (S21), Aspengren (S22). Khatun (S13), S. Bhattacharya (S15) and Kooria (S14) come from the extracts and summaries on the slides.
- `notes/` holds the reading notes the guide was written from (one file per reading).
- The PDFs of the readings and the lecture text are **not** committed: this repo is public and they are copyrighted course material. Keep them in your local folder.

## Differences from the midsem pipeline

- `build.js`: new output names and header, new places, and 8 endsem maps (`s12_medieval`, `s12_qusman`, `s13_commodities`, `s14_islam`, `s15_ships`, `s17_surat`, `s19_opium`, `s20_ports`). Maps can now show region labels (`regions`) and custom mark labels (`markLabels`).
- `style.css`: the simple-edition components (idea cards, e.g. strips, comparisons) also work in the full guide. Long boxes, grid columns and answers may now break across pages, which removes most half-empty pages.
- `make_qa.py`: Part A collects the professor's discussion questions from each session's exam corner, because there were no class model answers for the endsem.

## Build

Same as the midsem (Node 18+, Playwright with Chromium, Python 3). Inside `endsem-guide/`:

```bash
node build.js                              # full guide
node build.js --lite                       # Exam Essentials
python3 make_qa.py && node build.js --qa   # Model Answers
```

## Exam format

The course outline gives the final exam a weight of 35%. The midsem pattern (Lecture 16) was 10 MCQs × ½, 3 of 5 short answers × 10, and 1 essay × 15, in 2 hours, closed book. Confirm the endsem pattern with the professor.
