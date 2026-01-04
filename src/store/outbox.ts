import { writeFocusDate, writeMetric, writeSettings, writeTaskUpsert, writeWorklog } from "@/api/endpoints";
import { ApiAck, Task, WorklogEntry, MetricEntry, Settings } from "@/api/types";
import { set, get } from "idb-keyval";
import { create } from "zustand";

type CommandType =
  | "task_upsert"
  | "worklog_append"
  | "set_focusdate"
  | "metric_append"
  | "settings_set";

export type OutboxItem = {
  id: string;
  type: CommandType;
  payload: Record<string, unknown>;
  status: "queued" | "sending" | "error";
  attempts: number;
  lastError?: string;
  createdAt: string;
};

const STORAGE_KEY = "erp-outbox";

const withMeta = (payload: Record<string, unknown>) => ({
  ...payload,
  request_id: payload?.request_id ?? crypto.randomUUID(),
  client_ts: payload?.client_ts ?? new Date().toISOString(),
});

type OutboxState = {
  queue: OutboxItem[];
  initialized: boolean;
  load: () => Promise<void>;
  enqueue: (type: CommandType, payload: Record<string, unknown>) => Promise<OutboxItem>;
  process: () => Promise<void>;
  clear: () => Promise<void>;
  setQueue: (queue: OutboxItem[]) => void;
};

async function persist(queue: OutboxItem[]) {
  await set(STORAGE_KEY, queue);
}

async function sendCommand(item: OutboxItem): Promise<ApiAck> {
  const payload = withMeta(item.payload);
  switch (item.type) {
    case "task_upsert":
      return writeTaskUpsert(payload as Partial<Task>);
    case "worklog_append":
      return writeWorklog(payload as Partial<WorklogEntry>);
    case "set_focusdate":
      return writeFocusDate((payload.focusDate ?? payload.focus_date ?? payload.focus_date ?? "") as string);
    case "metric_append":
      return writeMetric(payload as Partial<MetricEntry>);
    case "settings_set":
      return writeSettings(payload as Partial<Settings>);
    default:
      return Promise.resolve({ ok: true, requestId: payload.request_id } as ApiAck);
  }
}

export const useOutboxStore = create<OutboxState>((set, getState) => ({
  queue: [],
  initialized: false,
  async load() {
    const existing = (await get(STORAGE_KEY)) as OutboxItem[] | undefined;
    set({ queue: existing ?? [], initialized: true });
  },
  async enqueue(type, payload) {
    const item: OutboxItem = {
      id: crypto.randomUUID(),
      type,
      payload: withMeta(payload),
      status: "queued",
      attempts: 0,
      createdAt: new Date().toISOString(),
    };
    const nextQueue = [...getState().queue, item];
    set({ queue: nextQueue });
    await persist(nextQueue);
    return item;
  },
  async process() {
    const state = getState();
    const queue = [...state.queue];
    for (const item of queue) {
      if (item.status === "sending") continue;
      item.status = "sending";
      item.attempts += 1;
      try {
        await sendCommand(item);
        const remaining = queue.filter((q) => q.id !== item.id);
        set({ queue: remaining });
        await persist(remaining);
      } catch (e) {
        item.status = "error";
        item.lastError = e instanceof Error ? e.message : "Network error";
        set({ queue: [...queue] });
        await persist(queue);
      }
    }
  },
  async clear() {
    set({ queue: [] });
    await persist([]);
  },
  setQueue(queue) {
    set({ queue });
  },
}));
