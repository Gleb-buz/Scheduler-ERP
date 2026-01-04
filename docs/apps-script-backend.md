# Apps Script WebApp: ERP Planner bridge for Google Sheets

Этот скрипт — автономный backend-адаптер для WebApp. Он не встраивается во фронт, а вставляется в редактор Apps Script, привязанный к таблице. Фронт подключается через боевое развертывание `https://script.google.com/macros/s/AKfycbw1rqBmcDNBDCPTPpge5TW33QP2e199lCSOVQDvXsimTnFX7-5aH0bghj6MhLClzUh-yA/exec` (уже прописано в `.env.local.example` и используется по умолчанию в коде).

> Скрипт следует контракту листа **`API`**: READ-секции отдают витрины, WRITE-секции принимают команды (буферы). Все write-операции требуют `request_id` (UUID) и `client_ts` (ISO datetime).

```ts
/**
 * ERP Planner Apps Script WebApp
 * - doGet: READ витрины и диагностика
 * - doPost: WRITE буферы (task_upsert, worklog_append, set_focusdate, metric_append, settings_set)
 *
 * Простой и намеренно прозрачный код, чтобы легко адаптировать под фактическую структуру листа API.
 */
const API_SHEET = 'API';
const REQUESTLOG_SHEET = 'API_RequestLog';

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'status';
  switch (action) {
    case 'status':
      return json({ ok: true, timestamp: new Date().toISOString() });
    case 'read': {
      const view = e.parameter && e.parameter.view;
      if (!view) return json({ ok: false, error: 'missing view' }, 400);
      return json({ ok: true, view, data: readView(view) });
    }
    case 'changed_since': {
      const since = e.parameter && e.parameter.updatedAtSince;
      const data = readView('API_READ_TASKS_CHANGED_SINCE');
      const filtered = since
        ? data.filter(function (row) {
            return row.updatedAt && row.updatedAt >= since;
          })
        : data;
      return json({ ok: true, view: 'API_READ_TASKS_CHANGED_SINCE', data: filtered });
    }
    case 'requestlog':
      return json({ ok: true, data: readSheet(REQUESTLOG_SHEET) });
    default:
      return json({ ok: false, error: 'unknown action' }, 400);
  }
}

function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return json({ ok: false, error: 'empty body' }, 400);
  }
  const body = JSON.parse(e.postData.contents);
  const command = body.command;
  const payload = body.payload || {};
  if (!command) return json({ ok: false, error: 'missing command' }, 400);

  switch (command) {
    case 'task_upsert':
      appendToBuffer('API_WRITE_TASK_UPSERT_BUFFER', payload);
      break;
    case 'worklog_append':
      appendToBuffer('API_WRITE_WORKLOG_BUFFER', payload);
      break;
    case 'set_focusdate':
      appendToBuffer('API_WRITE_FOCUSDATE', payload);
      break;
    case 'metric_append':
      appendToBuffer('API_WRITE_METRIC_BUFFER', payload);
      break;
    case 'settings_set':
      appendToBuffer('API_WRITE_SETTINGS_BUFFER', payload);
      break;
    default:
      return json({ ok: false, error: 'unknown command' }, 400);
  }

  logRequest(command, payload.request_id || '', payload.client_ts || '');
  return json({ ok: true, command });
}

/** Helpers **/
function readView(marker) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(API_SHEET);
  if (!sheet) throw new Error('Sheet API not found');
  const range = findSection(sheet, marker);
  if (!range) return [];
  const values = range.getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(function (r) { return r.join('').length; }).map(function (row) {
    const obj = {};
    headers.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function appendToBuffer(marker, payload) {
  if (!payload || !payload.request_id || !payload.client_ts) {
    throw new Error('request_id and client_ts are required');
  }
  const sheet = SpreadsheetApp.getActive().getSheetByName(API_SHEET);
  if (!sheet) throw new Error('Sheet API not found');
  const bufferStart = findSectionStart(sheet, marker);
  if (!bufferStart) throw new Error('Buffer not found: ' + marker);
  const headers = sheet.getRange(bufferStart.getRow(), bufferStart.getColumn(), 1, bufferStart.getWidth()).getValues()[0];
  const row = headers.map(function (h) { return payload[h] !== undefined ? payload[h] : ''; });
  const targetRow = bufferStart.getRow() + bufferStart.getHeight();
  const targetRange = sheet.getRange(targetRow, bufferStart.getColumn(), 1, headers.length);
  targetRange.setValues([row]);
}

function readSheet(name) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (!values.length) return [];
  const headers = values[0];
  return values.slice(1).map(function (row) {
    const obj = {};
    headers.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function findSection(sheet, marker) {
  const values = sheet.getDataRange().getValues();
  for (var r = 0; r < values.length; r++) {
    for (var c = 0; c < values[r].length; c++) {
      if (values[r][c] === marker) {
        // section = header row + following non-empty rows until blank
        var rows = [];
        var row = r + 1;
        while (row < values.length && values[row].join('').length) {
          rows.push(values[row]);
          row++;
        }
        return sheet.getRange(r + 1, c + 1, rows.length + 1, values[r].length - c);
      }
    }
  }
  return null;
}

function findSectionStart(sheet, marker) {
  const values = sheet.getDataRange().getValues();
  for (var r = 0; r < values.length; r++) {
    for (var c = 0; c < values[r].length; c++) {
      if (values[r][c] === marker) {
        return sheet.getRange(r + 1, c + 1, 1, values[r].length - c);
      }
    }
  }
  return null;
}

function logRequest(command, requestId, clientTs) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(REQUESTLOG_SHEET);
  if (!sheet) return;
  sheet.appendRow([new Date(), command, requestId, clientTs]);
}

function json(obj, status) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setResponseCode(status || 200);
}

## Как использовать
1. Откройте связанную с таблицей Apps Script и замените код на скрипт выше.
2. Разверните как WebApp (Deploy → New deployment). Разрешите доступ Anyone with the link.
3. Если нужен другой инстанс, замените Deployment ID/URL в `.env.local` (`VITE_BACKEND_BASE_URL`/`NEXT_PUBLIC_BACKEND_BASE_URL`).

> ВНИМАНИЕ: В современных браузерах прямые запросы из фронта на `script.google.com` часто блокируются CORS-политикой (preflight без Access-Control-Allow-Origin), поэтому мы добавляем serverless-прокси `/api/backend` в frontend и рекомендуем настроить `BACKEND_TARGET_URL` в переменных окружения на Vercel (server-side) с URL вашего Apps Script. Это убирает CORS и делает запросы надёжными.
4. Фронт начнёт работать сразу — без ручного редактирования листа. При несовпадении реального формата витрин подкорректируйте `readView/appendToBuffer` (локально в Apps Script) без изменений фронта.
