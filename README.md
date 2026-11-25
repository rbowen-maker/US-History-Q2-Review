# U.S. History Quarter 2 Guided Review

> **PROTOTYPE — NOT CLASSROOM-READY.** The deployed backend diagnostic passed, but cloud save/restore, conflicts, and both PDF routes require end-to-end testing and district review before real student use.

**Lesson ID:** `ush_q2_review_2026_v1`  
**Contract:** `USH_Q2_REVIEW_V1`  
**Sheet tab:** `USH_Q2_Review_2026`  
**Backend URL:** The exact teacher-provided Apps Script `/exec` endpoint is embedded in `index.html`. Do not substitute or reuse a different URL.

This student-facing prototype covers 30 responses: 12 Westward Expansion, 12 American Imperialism, and 6 World War I. It provides immediate feedback for 24 choice questions, two sentence frames for each of 6 written-response fields, an alias gate, local autosave, serialized cloud-save attempts with revision checks, cloud read-after-write verification, explicit offline mode and conflict recovery, completion display and two PDF mechanisms.

## Files

- `index.html`: student-facing page; the questions and answer feedback are embedded for offline usability.
- `assets/westward-impacts.svg`, `assets/imperialism-perspectives.svg`, `assets/wwi-tensions.svg`: original diagrams; click to enlarge.
- `assets/jspdf.umd.min.js`: pinned local jsPDF v2.5.2, required for Download Assignment PDF.
- `assets/jsPDF-LICENSE.txt`: upstream MIT license.
- `TEACHER_KEY.md`: teacher answer key (not linked from the student page; repository is public).
- `TEST_CHECKLIST.md`: required release-gate checklist and manual browser/device tests.

## Publish on GitHub Pages

GitHub repository **Settings → Pages → Build and deployment → Deploy from a branch → Branch `main` → Folder `/ (root)` → Save**. Published path is normally `https://rbowen-maker.github.io/US-History-Q2-Review/` once GitHub Pages finishes deployment. Do not claim publication until that URL loads.

## Setup and privacy

The Apps Script code is maintained in the teacher's existing Apps Script project under `Code.gs`. The **`SHEET_ID`** is stored only as a Script Property there; it is not committed to this public repository. Maintain the existing active backend deployment and its exact contract. Backend changes require backup and regression tests. 

**Aliases are not authentication.** A public script endpoint may allow anyone with the URL and an alias to access responses under that alias. No sensitive data or actual student responses should be used without school/district authorization. Use only fictitious aliases and test answers until all checks pass. Do not share real student records in GitHub or bug reports.

## Student workflow

1. Enter a 3–24 character fictional alias that begins with a letter; use the same alias to return.
2. The page attempts to restore from the backend. Editing remains locked until the restore attempt is completed or the offline path is explicitly chosen.
3. Each response change is immediately stored in localStorage if available; autosave queues cloud verification. The screen distinguishes **Saved on this device**, **Saving to cloud**, **Cloud verified**, **Cloud unavailable** and **Conflict**.
4. **Save now** tries to verify that the exact saved snapshot appears in the cloud. **Download Assignment PDF** creates a structured PDF with locally bundled jsPDF. **Emergency PDF** opens a separate print-friendly document for browser Print → Save as PDF.
5. A completion percentage is **not** an assessment of answer correctness.

## Reuse in Global Studies and with colleagues

Do not copy this endpoint into another course. Each new lesson needs a unique lesson ID, distinct response tab, matching version/field inventory, new teacher-controlled spreadsheet/back-end deployment and an independent tested front-end. Colleagues must use their **own** district-approved Sheet and Apps Script project, not this teacher's live response store.

## Source attributions

Original diagrams and instructional text: teacher classroom prototype (2026). Background reference links are provided in the student page and teacher key. jsPDF: © upstream contributors, MIT licensed; see `assets/jsPDF-LICENSE.txt`.