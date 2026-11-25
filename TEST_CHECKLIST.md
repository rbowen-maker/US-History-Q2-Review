# Prototype release-gate checklist — Q2 Guided Review

**Status legend:** PASS = directly observed; FAIL = reproduced failure; NOT TESTED = not demonstrated. Avoid marking classroom-ready while any critical test remains NOT TESTED or FAIL.

| # | Required gate | Status | Evidence / next action |
|---|---|---|---|
| 1 | Apps Script diagnostic against exact `/exec` endpoint and proper lesson/tab | **PASS** | Teacher supplied the JSONP diagnostic result with `ok:true`, `fieldCount:30`, correct lesson, tab and contract. |
| 2 | Save throwaway alias, get exact verified cloud snapshot, confirm correct Sheet row | **NOT TESTED** | Use fictitious alias, answer a few items, click Save now, verify row and JSON. |
| 3 | Reload / same-browser restore / second browser or device restore across ALL fields | **NOT TESTED** | Include multiple-choice and all six written fields. |
| 4 | Backend unavailable → preserve local answers → retry successfully | **NOT TESTED** | Disconnect network, change text, reconnect, compare exact restored work. |
| 5 | Concurrent/stale revisions reject overwrite; device and cloud backups recoverable | **NOT TESTED** | Two tabs or devices using throwaway alias. |
| 6 | Primary and Emergency PDFs contain top-grade/alias plus all fields, including >1000 chars, correct pagination | **NOT TESTED** | Download/open both PDFs with blank, partial, full, long-text cases. |
| 7 | Published GitHub Pages images, zoom, navigation and local PDF library load correctly | **NOT TESTED** | Inspect published site and browser network/console, not only repository. |
| 8 | Full browser console and network audit incl. correct endpoint, offline/error cases | **NOT TESTED** | Use Chrome DevTools on school Chromebook/network. |
| 9 | District data collection/access approval | **NOT TESTED** | Confirm district authorization. No real student data until approved. |

## Field inventory

Every listed field is required; answers are persisted in `snapshot.responses`, restored from the same field ID, counted for completion if nonblank, and included in both PDF routes.

| Unit | Choice fields (A–D or blank) | Written fields (0–4000 characters) | Required total |
|---|---|---|---:|
| Westward Expansion | `we01`–`we10` | `we11`, `we12` | 12 |
| American Imperialism | `im01`–`im10` | `im11`, `im12` | 12 |
| World War I | `ww01`–`ww04` | `ww05`, `ww06` | 6 |
| **Total** | **24** | **6** | **30** |

## Dependency audit

- Critical JavaScript: inline in `index.html` (no public CDN).
- Primary PDF engine: `assets/jspdf.umd.min.js` (pinned local version 2.5.2).
- PDF license: `assets/jsPDF-LICENSE.txt`.
- Graphics: three local SVGs listed in README.
- Save endpoint: exact teacher-provided Apps Script URL hardcoded in `index.html`; do not change without matching backend deployment and contract check.
- Emergency PDF: separate browser print window; does not call jsPDF.
- Teacher answers: `TEACHER_KEY.md` is **public in this repository**; acceptable for study guide but do not treat it as a secure exam key.

## Suggested teacher tests

1. Open published URL on Chromebook, enter throwaway `TESTBIRD7` alias.
2. Select two choices and write >1000 characters in one text response; navigate away and back to ensure persistence.
3. Check status becomes **Cloud verified** only after saved data can be read back exactly; inspect correct Sheet row.
4. Reload, repeat on another browser, then disconnect and reconnect the network.
5. With the same alias in two browser tabs, change different answers and look for explicit conflict; export each version before choosing.
6. Download and open both PDFs; confirm wrapping, pagination, titles, alias, completion and all 30 responses.
7. Inspect site assets, focus outlines, keyboard/touch controls, and tooltips. Review Chrome console for errors.