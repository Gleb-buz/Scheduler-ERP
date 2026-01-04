import {
  mockMetrics,
  mockProjects,
  mockRequestLog,
  mockSettings,
  mockStatus,
  mockTasks,
  mockWeekLoad,
  mockWorklog,
} from "./data";
import { todayDateString } from "@/lib/dates";
import { Task, WorklogEntry, MetricEntry, Settings } from "@/api/types";

const clone = <T>(data: T): T => structuredClone(data);

export async function mockCall(op: string, payload?: Record<string, unknown>) {
  switch (op) {
    case "API_STATUS":
      return clone(mockStatus);
    case "API_READ_TODAY_OVERDUE":
      return clone(mockTasks.filter((t) => (t.daysToDue ?? 0) < 0));
    case "API_READ_TODAY_TODAY":
      return clone(mockTasks.filter((t) => (t.daysToDue ?? 0) >= 0));
    case "API_READ_WEEK_LOAD":
      return clone(mockWeekLoad);
    case "API_READ_WEEK_TASKS":
      return clone(mockTasks);
    case "API_READ_TASKS_LIST":
    case "API_READ_TASKS_CHANGED_SINCE":
      return clone(mockTasks);
    case "API_READ_TASK_BY_ID":
      return clone(mockTasks.find((t) => t.taskId === payload?.taskId));
    case "API_READ_PROJECTS":
      return clone(mockProjects);
    case "API_READ_METRICS_BY_PROJECT":
      return clone(mockMetrics.filter((m) => m.projectId === payload?.projectId));
    case "API_READ_DAILY_RANGE":
      return clone(mockWorklog);
    case "API_READ_SETTINGS":
      return clone(mockSettings);
    case "API_READ_REQUESTLOG":
      return clone(mockRequestLog);
    case "API_WRITE_TASK_UPSERT_BUFFER": {
      const task = payload as Task;
      const existingIndex = mockTasks.findIndex((t) => t.taskId === task.taskId);
      if (existingIndex >= 0) mockTasks[existingIndex] = { ...mockTasks[existingIndex], ...task };
      else mockTasks.push({ ...task, taskId: task.taskId || crypto.randomUUID() });
      return { ok: true, requestId: payload?.requestId ?? crypto.randomUUID(), message: "saved" };
    }
    case "API_WRITE_WORKLOG_BUFFER": {
      const log = payload as WorklogEntry;
      mockWorklog.push({ ...log, id: crypto.randomUUID() });
      return { ok: true, requestId: payload?.requestId ?? crypto.randomUUID(), message: "logged" };
    }
    case "API_WRITE_METRIC_BUFFER": {
      const metric = payload as MetricEntry;
      mockMetrics.push({ ...metric, id: crypto.randomUUID() });
      return { ok: true, requestId: payload?.requestId ?? crypto.randomUUID(), message: "added" };
    }
    case "API_WRITE_SETTINGS_BUFFER": {
      const settings = payload as Settings;
      Object.assign(mockSettings, settings);
      return { ok: true, requestId: payload?.requestId ?? crypto.randomUUID(), message: "updated" };
    }
    case "API_WRITE_FOCUSDATE": {
      const date = typeof payload?.focusDate === "string" ? (payload.focusDate as string) : todayDateString();
      mockSettings.focusDate = date;
      return { ok: true, requestId: payload?.requestId ?? crypto.randomUUID(), message: "focus updated" };
    }
    default:
      return { ok: true, requestId: crypto.randomUUID(), message: "mock" };
  }
}
