# AGENTS.md — ERP Planner Frontend (Web) ↔ Google Sheets Backend

Этот репозиторий содержит веб-фронт для ERP Планировщика задач. Бекенд — Google Spreadsheet (данные + формулы) и Apps Script WebApp (HTTP API).
Источник истины по контракту данных — лист **`API`** в backend-таблице.

---

## 0) Быстрая сводка (что это за бек)

**Backend = Google Sheets + Apps Script**
- Google Sheets хранит данные и считает вычисляемые поля формулами.
- Apps Script WebApp обрабатывает команды (upsert, worklog append, смена FocusDate, запись метрик, запись настроек), ведёт идемпотентность, возвращает JSON.
- Лист **`API`** — “контракт”:  
  - READ-секции (витрины) формируются формулами и читаются фронтом
  - WRITE-секции (буферы) заполняются командами, затем Script “разносит” изменения в core-листы и пишет статус обработки в буфер.

---

## 1) Конфиги фронта (env)

Фронт НЕ ходит в Google Sheets API напрямую. Только в Apps Script WebApp.

Рекомендуемые env-переменные:
- `BACKEND_TARGET_URL` — **(server-side)** базовый URL Apps Script WebApp (устанавливать в Vercel):
  - `https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec`
- `NEXT_PUBLIC_BACKEND_BASE_URL` — (опционально) клиентский override; по умолчанию фронт использует `/api/backend` (serverless proxy) чтобы избежать CORS.
- `VITE_BACKEND_TIMEOUT_MS` / `NEXT_PUBLIC_BACKEND_TIMEOUT_MS` — таймаут запросов
- `VITE_BACKEND_CLIENT_ID` — идентификатор клиента (опционально, для трейсинга)

> Важно: конкретный DEPLOYMENT_ID храните в env, не хардкодьте в коде.

---

## 2) Карта артефактов backend-таблицы (Sheets)

### Core (данные + вычисления)
- **`Settings`**
  - Главный “мозг”: `Focus Date` (системное “сегодня”), веса приоритета, буст просрочки, capacity по дням недели.
- **`Tasks`**
  - Главная таблица задач (вводимые + вычисляемые колонки).
  - Computed-поля считаются формулами и зависят от `Settings!FocusDate`.
- **`Projects`**
  - Реестр проектов и роллапы (прогресс, цели, накопление AP, метрики).
- **`Daily Log`**
  - Журнал факта / план дня (done, AP fact/used, notes, mood/energy, source, request_id).
- **`Metrics Log`**
  - Журнал метрик проектов (date, projectId, metricValue, notes).
- **`Enums`**
  - Справочники значений (статусы, duePolicy, weekdays и т.п.).

### Integration (контракт + идемпотентность)
- **`API`**
  - READ-витрины и WRITE-буферы (см. раздел 4).
- **`API_RequestLog`**
  - Лог запросов/идемпотентность/диагностика.
- **`TaskProjectLink`**
  - Задел под m2m (пока опционально, базово используются ProjectID_1..3 в Tasks).

---

## 3) Доменная модель (что такое “Task/Project/Worklog”)

### Task (задача)
**Основные поля:**
- `taskId: string`
- `taskName: string`
- `status: string` (например: "Сделать", "В процессе", "Готово" …)
- `importance: number` (1..5)
- `ap: number` (условная “стоимость”/объём)
- `projectId_1..3: string | null`
- `duePolicy: string` (Нет / Фиксированный / АвтоНеделя)
- `dueDateManual: date | null`
- `earliest: date | null`
- `latest: date | null`
- `mon..sun: boolean` (доступные дни недели)
- `notes: string`
- `deleted: boolean` (soft delete)
- `rowVersion: number|string` (optimistic locking)
- `updatedAt: datetime`

**Computed (формулы):**
- `dueDate: date` (итоговая дата выполнения)
- `daysToDue: number`
- `urgency: number (0..10)`
- `priorityScore: number`
- `linksCount: number`

### Project (проект)
- `projectId: string`
- `projectName: string`
- `type: string`
- `status: string`
- `startDate/endDate: date | null`
- `apTarget: number | null`
- `targetDays: number | null`
- `apAccum: number` (роллап из Daily Log)
- `doneDays: number` (роллап “привычка/дни”)

### Worklog (запись дневника / факта)
- `date: date`
- `taskId: string`
- `done: boolean`
- `apPlan/apFact/apUsed: number`
- `notes: string`
- `energy: number (1..5) | null`
- `mood: number (1..5) | null`
- `source: string`
- `requestId: string`
- `clientTS: datetime`

### Metric (метрика проекта)
- `date: date`
- `projectId: string`
- `metricValue: number`
- `notes: string`

### Settings (настройки)
Витрина `API_READ_SETTINGS` отдаёт key/value:
- `focusDate` (date)
- веса приоритета (`weight_importance`, `weight_urgency`, `weight_links`)
- бусты просрочки (`overdue_base_boost`, `overdue_per_day_boost`)
- capacity (`capacity_mon..capacity_sun`)

---

## 4) Контракт листа `API` (READ витрины / WRITE буферы)

### 4.1 READ витрины (фронт читает)
Каждая витрина — это таблица с заголовком колонок. Фронт читает как массив объектов.

#### `API_STATUS`
Key/value:
- `api_version`
- `focusDate_effective`
- `last_sync_at`
- `last_error`
- `backend_file`

#### `API_READ_TODAY_OVERDUE` (просрочено)
Колонки:
- TaskID, Task Name, PriorityScore, DueDate, DaysToDue, Urgency, Importance, AP,
  ProjectID_1..3, DuePolicy, Earliest, Latest,
  Mon..Sun, Status, Notes, Links#

#### `API_READ_TODAY_TODAY` (на сегодня)
Колонки идентичны `OVERDUE`.

#### `API_READ_WEEK_LOAD (FocusDate + 0..6)`
Колонки:
- DayOffset, Date, FixedLoad_AP, TasksDue_AP, Total_AP, Capacity_AP, Remaining_AP

#### `API_READ_TASK_BY_ID`
Вход: `Input TaskID` (внутреннее поле витрины)  
Колонки (выдача):
- TaskID, Task Name, ProjectID_1..3, AP, Importance,
  DuePolicy, DueDate(manual), Earliest, Latest,
  Mon..Sun, Status, Notes,
  DueDate(computed), DaysToDue, Urgency, PriorityScore, Eligible, Links#, Deleted, RowVersion, UpdatedAt

#### `API_READ_PROJECTS`
Колонки:
- ProjectID, Project Name, Type, Status, Start Date, End Date, AP Target, Target Days, AP Accum, Done Days

#### `API_READ_TASKS_LIST (catalog + filters)`
Фильтры (inputs в секции):
- q (поиск name+notes)
- projectId (optional)
- status (optional)
- includeDeleted (TRUE/FALSE)
- dueDate from/to (optional)

Колонки (выдача):
- TaskID, Task Name, Status, PriorityScore, DueDate, DaysToDue, Urgency, Importance, AP,
  ProjectID_1..3, DuePolicy, DueDate(manual), Earliest, Latest,
  Mon..Sun, Notes, UpdatedAt, Deleted, RowVersion

#### `API_READ_WEEK_TASKS`
Фильтры:
- includeOverdue (TRUE/FALSE)
- statusFilter (optional)
- projectFilter (optional)

Колонки (выдача):
- DueDate, DayOffset, TaskID, Task Name, PriorityScore, AP, Status,
  ProjectID_1..3, Importance, Urgency, DaysToDue, DuePolicy

#### `API_READ_DAILY_RANGE`
Фильтры:
- startDate / endDate
- projectId (optional)
- taskId (optional)

Колонки (выдача):
- Date, TaskID, Task Name, Done, AP Plan, AP Fact, AP Used,
  ProjectID, Notes, Energy, Mood,
  Importance, Due, PriorityScore,
  CreatedAt, UpdatedAt, Source, RequestID, ClientTS

#### `API_READ_METRICS_BY_PROJECT`
Фильтры:
- projectId (optional)
- startDate / endDate

Колонки:
- Date, ProjectID, Metric Value, Notes

#### `API_READ_SETTINGS`
Колонки:
- key, value, type, notes

#### `API_READ_REQUESTLOG`
Колонки:
- received_at, request_id, endpoint, status, task_id, details_json

#### `API_READ_TASKS_CHANGED_SINCE`
Фильтр:
- updatedAtSince (optional)

Колонки:
- UpdatedAt, TaskID, Task Name, Status, RowVersion

---

### 4.2 WRITE буферы (фронт пишет команды)
Правило: любая команда должна иметь **`request_id`** (уникальный UUID) и **`client_ts`** (ISO datetime).
Скрипт после обработки заполняет `processed_at`, `status/status_out` и `error`.

#### `API_WRITE_WORKLOG_BUFFER`
Колонки:
- request_id, client_ts, date, taskId, done, apFact, notes, energy, mood, source,
  processed_at, status, error

#### `API_WRITE_TASK_UPSERT_BUFFER`
Колонки:
- request_id, client_ts, action, taskId, taskName,
  project1, project2, project3,
  ap, importance,
  duePolicy, dueDateManual, earliest, latest,
  mon, tue, wed, thu, fri, sat, sun,
  status, notes,
  links, deleted, rowVersion,
  processed_at, status_out, error, newTaskId

`action`:
- `create` | `update` | `delete` (soft) | `restore` (если поддерживается скриптом)

#### `API_WRITE_FOCUSDATE`
Колонки:
- request_id, client_ts, focusDate, processed_at, status, error

#### `API_WRITE_METRIC_BUFFER`
Колонки:
- request_id, client_ts, date, projectId, metricValue, notes,
  processed_at, status, error

#### `API_WRITE_SETTINGS_BUFFER`
Колонки:
- request_id, client_ts, key, value, processed_at, status, error

---

## 5) Архитектура потоков данных (важно для фронта)

### 5.1 Главный принцип
`Settings.focusDate` = “системное сегодня”.  
Все computed-поля задач (eligibility, urgency, priority, dueDate(computed)) пересчитываются относительно FocusDate.

### 5.2 Поток чтения
Frontend UI
-> WebApp (read op)
-> читает готовые READ-витрины на листе API
-> (формулы уже обновлены)
<- JSON (arrays)

### 5.3 Поток записи
Frontend UI (user action)
-> WebApp (write op: upsert/worklog/settings/metric/focusDate)
-> append row в соответствующий API_WRITE_* buffer
-> Script обрабатывает buffer:
- валидирует
- пишет изменения в core-листы (Tasks/Daily Log/Settings/Metrics Log)
- логирует request_id в API_RequestLog (идемпотентность)
- записывает processed_at/status/error обратно в buffer
<- JSON ack (ok/error + ids)

### 5.4 Идемпотентность и оффлайн-очередь (обязательно)
- `request_id` уникален для каждой команды.
- При сетевых ошибках фронт может повторять команду с тем же `request_id` (без дублей).
- Рекомендуется local “outbox queue”:
  - persist в localStorage/IndexedDB
  - ретраи с backoff
  - после успешной обработки удалять из очереди

### 5.5 Консистентность (реальность, а не мечты)
- После write-команды фронт должен:
  1) оптимистично обновить локальный state (опционально)
  2) затем перезапросить связанные READ-витрины или подгрузить diff:
     - `API_READ_TASKS_CHANGED_SINCE`
     - `API_READ_TODAY_*`, `API_READ_WEEK_TASKS`, `API_READ_TASK_BY_ID`, и т.д.

---

## 6) Раскладка фич по экранам (актуально под расширенный API)

### Screen: Today (Фокус)
- FocusDate bar (set) → `API_WRITE_FOCUSDATE`, статус → `API_STATUS`
- Overdue list → `API_READ_TODAY_OVERDUE`
- Today list → `API_READ_TODAY_TODAY`
- Quick complete / AP fact / mood/energy → `API_WRITE_WORKLOG_BUFFER`
- Quick edit status/due → `API_WRITE_TASK_UPSERT_BUFFER`
- Mini week load widget → `API_READ_WEEK_LOAD`
- Quick add task → `API_WRITE_TASK_UPSERT_BUFFER`

### Screen: Week Plan (План недели)
- Week load → `API_READ_WEEK_LOAD`
- Week tasks grouped by day → `API_READ_WEEK_TASKS`
- Filters (project/status/include overdue) → inputs `API_READ_WEEK_TASKS`
- Reschedule task (duePolicy/dueDateManual/earliest/latest) → `API_WRITE_TASK_UPSERT_BUFFER`

### Screen: Tasks (Каталог)
- Search + filters → `API_READ_TASKS_LIST`
- Task list/table → `API_READ_TASKS_LIST`
- Task details drawer → `API_READ_TASK_BY_ID`
- Create/update/delete/restore → `API_WRITE_TASK_UPSERT_BUFFER`
- Sync optimization → `API_READ_TASKS_CHANGED_SINCE`

### Screen: Projects
- Projects list + progress → `API_READ_PROJECTS`
- Project tasks → `API_READ_TASKS_LIST` (project filter)
- Metrics history → `API_READ_METRICS_BY_PROJECT`
- Add metric → `API_WRITE_METRIC_BUFFER`

### Screen: Journal / History (Daily Log)
- Date range calendar/list → `API_READ_DAILY_RANGE`
- Filters by project/task → inputs `API_READ_DAILY_RANGE`
- Add entry → `API_WRITE_WORKLOG_BUFFER`

### Screen: Settings
- Read settings key/value → `API_READ_SETTINGS`
- Update weights/capacity/boosts → `API_WRITE_SETTINGS_BUFFER`

### Screen: Sync / Debug (служебный)
- Request log → `API_READ_REQUESTLOG`
- Changed since → `API_READ_TASKS_CHANGED_SINCE`
- Local outbox queue viewer (frontend only)

---

## 7) Рекомендации для агента (Codex) по реализации

### 7.1 Кодовая организация
- `src/api/client.ts` — единственная точка, где “знаем” транспорт WebApp
- `src/api/types.ts` — типы домена (Task/Project/Worklog/Metric/Settings)
- `src/store/*` — состояние приложения, нормализация сущностей
- `src/features/*` — экраны/фичи

### 7.2 Даты и таймзона
- FocusDate и DueDate — **date-only** (без времени).  
- Клиентский `client_ts` — ISO datetime.
- Не делайте `new Date(dateOnlyString)` без нормализации (таймзона может сдвигать дату).
  Используйте safe date parsing (например, храните `YYYY-MM-DD` строкой).

### 7.3 Оптимистические обновления и rowVersion
- При update задачи отправляйте `rowVersion` (если заполнено).
- При конфликте (error) — re-fetch `API_READ_TASK_BY_ID`.

### 7.4 Надёжность
- Сетевые ошибки: ретрай с тем же `request_id`.
- После write: refresh соответствующих витрин или diff-синк.

---

## 8) Что НЕ делать
- Не писать напрямую в core-листы (Tasks/Projects/Daily Log/Settings/Metrics Log) через любые обходные методы.
- Не пытаться “вычислять приоритет” на клиенте. Приоритет/eligibility — зона формул backend.
- Не хардкодить Spreadsheet ID и Deployment ID в исходниках.

---

## 9) Мини-чеклист тестирования UI
- Today: просроченная задача всегда выше остальных, уходит из выдачи после done+status update
- Week Plan: задачи корректно группируются по dueDate(computed)
- Tasks Catalog: фильтры q/status/project/date range дают ожидаемый срез
- Projects: метрики читаются/добавляются, список задач проекта фильтруется
- Journal: диапазон дат отдаёт записи, фильтры работают
- Settings: изменение capacity/boost отражается в week load и приоритетах (после refresh)
- Offline: outbox корректно ретраит и не создаёт дубликаты (request_id)

---