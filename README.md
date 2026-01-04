# ERP Planner Frontend

Современный web-клиент для ERP Planner (Google Sheets + Apps Script backend). Интерфейс покрывает ежедневное планирование, каталог задач, проекты, журнал и диагностику синка.

## Стек
- Next.js (App Router) + TypeScript
- TailwindCSS
- TanStack Query для кеша/запросов
- Zod схемы API
- date-fns для дат
- Zustand + IndexedDB outbox для оффлайн очереди

## Установка и запуск
```bash
npm install
npm run dev    # запуск в dev-режиме
npm run build  # продакшн сборка
npm start      # запуск собранной версии
npm run lint   # линтинг
```

### Переменные окружения
Создайте `.env.local` (или используйте готовый `.env.local.example`) с боевым WebApp:
```
NEXT_PUBLIC_BACKEND_BASE_URL=https://script.google.com/macros/s/AKfycbw1rqBmcDNBDCPTPpge5TW33QP2e199lCSOVQDvXsimTnFX7-5aH0bghj6MhLClzUh-yA/exec
NEXT_PUBLIC_BACKEND_TIMEOUT_MS=15000
# NEXT_PUBLIC_BACKEND_CLIENT_ID=<опционально для трейсинга>
```
Если переменная не указана, клиент работает в mock-режиме с локальными данными, но по умолчанию уже прописан рабочий URL, поэтом
у моков можно вернуться, очистив переменную.

## Архитектура
- `src/api/client.ts` — тонкий fetch-wrapper с таймаутом + fallback на mock.
- `src/api/endpoints.ts` — вызовы API_READ_* и API_WRITE_* (request_id + client_ts добавляются автоматически).
- `src/api/schemas.ts` — Zod-схемы витрин и команд.
- `src/store/outbox.ts` — локальная очередь команд (IndexedDB). Команды `task_upsert`, `worklog_append`, `set_focusdate`, `metric_append`, `settings_set` складываются в outbox и ретраятся с тем же request_id.
- `src/providers/outbox-provider.tsx` — инициализация очереди + периодический процессинг (онлайн / по кнопке Retry на экране Debug).
- Страницы: `/today`, `/week`, `/tasks`, `/projects`, `/journal`, `/settings`, `/debug`.

### Поток данных (коротко)
1. **Read**: UI → `endpoints.ts` → Apps Script WebApp (`API_READ_*`) → Zod parse → React Query cache.
2. **Write**: UI → outbox enqueue (`request_id`, `client_ts`) → immediate process (если online) → Apps Script `API_WRITE_*` buffer → после ack выполняется `invalidateQueries`/refetch связанных витрин (`API_READ_TODAY_*`, `API_READ_WEEK_*`, `API_READ_TASKS_CHANGED_SINCE`).
3. **Offline**: при ошибках команды остаются в очереди, отображаются на экране Debug, могут быть повторно отправлены без дублей (идемпотентность по request_id).

## Ключевые экраны
- **Today**: overdue/сегодня, быстрый done + worklog, смена фокуса, мини-виджет нагрузки недели, быстрый add.
- **Week Plan**: нагрузка недели, grouping по dueDate, фильтры, перенос задач.
- **Tasks**: поиск/фильтры, таблица (desktop) + карточки (mobile), массовые операции, полноценный drawer редактирования.
- **Projects**: список проектов, задачи проекта, метрики и добавление метрик.
- **Journal**: выбор диапазона (пресеты 7/14/30), лента записей, быстрый worklog.
- **Settings**: чтение/редактирование весов, бустов просрочки и capacity; после сохранения обновляются зависящие витрины.
- **Debug**: просмотр local outbox, request log, pull изменений `API_READ_TASKS_CHANGED_SINCE`, действия Retry/Clear.

## Даты и таймзона
- Даты due/focus хранятся как строки `YYYY-MM-DD` (без смещения таймзоны).
- `client_ts` отправляется как ISO datetime.

