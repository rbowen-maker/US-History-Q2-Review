/**
 * US History Quarter 2 Review — Classroom Response Backend
 * Contract: USH_Q2_REVIEW_V1
 * Lesson ID: ush_q2_review_2026_v1
 * Sheet tab: USH_Q2_Review_2026
 * REQUIRED Script Property: SHEET_ID
 *
 * GET ?action=diagnostic|load&lessonId=...&alias=...&callback=...
 * POST form: action=save, lessonId, alias, requestId, baseRevision,
 *            snapshot (JSON string), clientOrigin (origin only).
 * A write is verified by a matching Sheet read, not mere iframe load.
 * Aliases are not authentication; do not store sensitive student information.
 */
const CONTRACT_VERSION = 'USH_Q2_REVIEW_V1';
const LESSON_ID = 'ush_q2_review_2026_v1';
const TAB_NAME = 'USH_Q2_Review_2026';
const TITLE = 'U.S. History Quarter 2 Review';
const FIELD_IDS = [
  'we01', 'we02', 'we03', 'we04',
  'we05', 'we06', 'we07', 'we08',
  'we09', 'we10', 'we11', 'we12',
  'im01', 'im02', 'im03', 'im04',
  'im05', 'im06', 'im07', 'im08',
  'im09', 'im10', 'im11', 'im12',
  'ww01', 'ww02', 'ww03',
  'ww04', 'ww05', 'ww06'
];
const WRITTEN_IDS = [
  'we11', 'we12', 'im11', 'im12', 'ww05', 'ww06'
];
const HEADERS = [
  'Alias', 'Revision', 'Request ID', 'Updated UTC',
  'Snapshot JSON', 'Lesson ID', 'Contract Version',
  'Completed Responses', 'Total Responses', 'Completion Percent'
];
const MAX_SNAPSHOT_CHARS = 45000;
const MAX_FIELD_CHARS = 4000;

function doGet(e) {
  const p = (e && e.parameter) || {};
  let result;
  try {
    validateCallback_(p.callback);
    checkLesson_(p);
    if (p.action === 'diagnostic') {
      result = withLock_(function () {
        const sheet = getSheet_();
        return {
          ok: true, action: 'diagnostic', title: TITLE,
          tab: sheet.getName(), sheetReady: true,
          fieldCount: FIELD_IDS.length
        };
      });
    } else if (p.action === 'load') {
      const alias = normalizeAlias_(p.alias);
      result = withLock_(function () {
        const sheet = getSheet_();
        const found = findAliasRow_(sheet, alias);
        if (!found) {
          return {ok: true, action: 'load', found: false,
            alias: alias, revision: 0, snapshot: null};
        }
        const snapshot = JSON.parse(found.values[4]);
        validateSnapshot_(snapshot);
        return {ok: true, action: 'load', found: true,
          alias: alias, revision: Number(found.values[1]),
          requestId: String(found.values[2]),
          updatedAt: String(found.values[3]), snapshot: snapshot};
      });
    } else throw new Error('UNKNOWN_ACTION');
  } catch (err) {
    result = {ok: false, error: String(err.message || err)};
  }
  return jsonp_(safeCallback_(p.callback), result);
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  const requestId = String(p.requestId || '');
  let result;
  try {
    if (p.action !== 'save') throw new Error('UNKNOWN_ACTION');
    checkLesson_(p);
    const alias = normalizeAlias_(p.alias);
    if (!/^[A-Za-z0-9_-]{8,100}$/.test(requestId))
      throw new Error('INVALID_REQUEST_ID');
    if (!/^\d+$/.test(String(p.baseRevision || '')))
      throw new Error('INVALID_REVISION');
    const baseRevision = Number(p.baseRevision);
    if (!Number.isSafeInteger(baseRevision) || baseRevision < 0)
      throw new Error('INVALID_REVISION');
    const raw = String(p.snapshot || '');
    if (!raw || raw.length > MAX_SNAPSHOT_CHARS)
      throw new Error('INVALID_SNAPSHOT_SIZE');
    const snapshot = JSON.parse(raw);
    validateSnapshot_(snapshot);
    const completion = completion_(snapshot.responses);
    result = withLock_(function () {
      const sheet = getSheet_();
      const found = findAliasRow_(sheet, alias);
      const currentRevision = found ? Number(found.values[1]) : 0;
      const lastRequestId = found ? String(found.values[2]) : '';
      if (found && lastRequestId === requestId) {
        if (String(found.values[4]) !== raw)
          throw new Error('REQUEST_ID_REUSED');
        return {ok: true, action: 'save', alias: alias,
          requestId: requestId, revision: currentRevision,
          duplicate: true, verified: true, completion: completion};
      }
      if (currentRevision !== baseRevision) {
        return {ok: false, action: 'save', alias: alias,
          requestId: requestId, error: 'CONFLICT',
          revision: currentRevision,
          cloudSnapshot: found ? JSON.parse(found.values[4]) : null};
      }
      const nextRevision = currentRevision + 1;
      const updatedAt = new Date().toISOString();
      const rowData = [alias, nextRevision, requestId, updatedAt,
        raw, LESSON_ID, CONTRACT_VERSION, completion.completed,
        completion.total, completion.percent];
      const rowIndex = found ? found.rowIndex : sheet.getLastRow() + 1;
      if (rowIndex > sheet.getMaxRows())
        sheet.insertRowsAfter(sheet.getMaxRows(), 100);
      sheet.getRange(rowIndex, 1).setNumberFormat('@');
      sheet.getRange(rowIndex, 3, 1, 5).setNumberFormat('@');
      sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([rowData]);
      SpreadsheetApp.flush();
      const check = sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0];
      if (String(check[0]) !== alias ||
          Number(check[1]) !== nextRevision ||
          String(check[2]) !== requestId ||
          String(check[4]) !== raw ||
          String(check[5]) !== LESSON_ID ||
          String(check[6]) !== CONTRACT_VERSION ||
          Number(check[7]) !== completion.completed ||
          Number(check[8]) !== completion.total ||
          Number(check[9]) !== completion.percent)
        throw new Error('WRITE_VERIFICATION_FAILED');
      return {ok: true, action: 'save', alias: alias,
        requestId: requestId, revision: nextRevision,
        verified: true, updatedAt: updatedAt, completion: completion};
    });
  } catch (err) {
    result = {ok: false, action: 'save', requestId: requestId,
      error: String(err.message || err)};
  }
  return iframeAck_(result, p.clientOrigin);
}

function checkLesson_(p) {
  if (p.lessonId !== LESSON_ID)
    throw new Error('LESSON_MISMATCH');
}
function withLock_(work) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('BUSY_RETRY');
  try {return work();} finally {lock.releaseLock();}
}
function getSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('MISSING_SHEET_ID_SCRIPT_PROPERTY');
  const book = SpreadsheetApp.openById(id);
  let sheet = book.getSheetByName(TAB_NAME);
  if (!sheet) {
    sheet = book.insertSheet(TAB_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setValues([HEADERS]).setFontWeight('bold')
      .setBackground('#183b56').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(4, 210);
    sheet.setColumnWidth(5, 300);
    sheet.setColumnWidths(8, 3, 150);
    SpreadsheetApp.flush();
  } else {
    const header = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    if (header.join('|') !== HEADERS.join('|'))
      throw new Error('TAB_HEADER_MISMATCH');
  }
  return sheet;
}
function findAliasRow_(sheet, alias) {
  const last = sheet.getLastRow();
  if (last < 2) return null;
  const aliases = sheet.getRange(2, 1, last - 1, 1).getValues();
  let match = null;
  for (let i = 0; i < aliases.length; i++) {
    if (String(aliases[i][0]) === alias) {
      if (match !== null) throw new Error('DUPLICATE_ALIAS_ROWS');
      const rowIndex = i + 2;
      match = {rowIndex: rowIndex,
        values: sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0]};
    }
  }
  return match;
}
function normalizeAlias_(input) {
  const alias = String(input || '').trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9_-]{2,23}$/.test(alias))
    throw new Error('INVALID_ALIAS');
  return alias;
}
function validateSnapshot_(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot))
    throw new Error('INVALID_SNAPSHOT');
  if (snapshot.lessonId !== LESSON_ID ||
      snapshot.contractVersion !== CONTRACT_VERSION)
    throw new Error('SNAPSHOT_CONTRACT_MISMATCH');
  const responses = snapshot.responses;
  if (!responses || typeof responses !== 'object' || Array.isArray(responses))
    throw new Error('INVALID_RESPONSES');
  const keys = Object.keys(responses);
  if (keys.length !== FIELD_IDS.length ||
      keys.some(key => !FIELD_IDS.includes(key)))
    throw new Error('FIELD_INVENTORY_MISMATCH');
  FIELD_IDS.forEach(function (id) {
    const value = responses[id];
    if (typeof value !== 'string') throw new Error('INVALID_FIELD_' + id);
    if (WRITTEN_IDS.includes(id)) {
      if (value.length > MAX_FIELD_CHARS)
        throw new Error('FIELD_TOO_LONG_' + id);
    } else if (!['', 'A', 'B', 'C', 'D'].includes(value))
      throw new Error('INVALID_CHOICE_' + id);
  });
}
function completion_(responses) {
  const completed = FIELD_IDS.filter(function (id) {
    return responses[id].trim().length > 0;
  }).length;
  return {completed: completed, total: FIELD_IDS.length,
    percent: Math.round(completed / FIELD_IDS.length * 100)};
}
function validateCallback_(name) {
  const s = String(name || '');
  if (!/^[A-Za-z_$][A-Za-z0-9_$]{0,80}$/.test(s))
    throw new Error('INVALID_CALLBACK');
  return s;
}
function safeCallback_(name) {
  try {return validateCallback_(name);} catch (_) {return 'q2BackendError';}
}
function envelope_(data) {
  return Object.assign({}, data, {lessonId: LESSON_ID,
    contractVersion: CONTRACT_VERSION});
}
function safeJson_(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
function jsonp_(callback, data) {
  return ContentService.createTextOutput(
    callback + '(' + safeJson_(envelope_(data)) + ');'
  ).setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function iframeAck_(data, clientOrigin) {
  const origin = String(clientOrigin || '');
  if (!/^https:\/\/[A-Za-z0-9.-]+(?::\d{1,5})?$/.test(origin)) {
    return HtmlService.createHtmlOutput('Invalid acknowledgement origin.');
  }
  const message = safeJson_({channel: 'USH_Q2_REVIEW_SAVE_ACK',
    payload: envelope_(data)});
  const html = '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    '<script>window.top.postMessage(' + message + ',' + JSON.stringify(origin) +
    ');</script></body></html>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
/** Run once in editor; creates/validates tab and records no student data. */
function setupAndCheck() {
  const result = withLock_(function () {
    const sheet = getSheet_();
    return {ok: true, lessonId: LESSON_ID, tab: sheet.getName(),
      contractVersion: CONTRACT_VERSION,
      fields: FIELD_IDS.length, writtenFields: WRITTEN_IDS.length};
  });
  Logger.log(JSON.stringify(result));
  return result;
}