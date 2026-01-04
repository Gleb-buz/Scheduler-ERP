import { callApi } from "@/api/client";
import { z } from "zod";
import {
  ackSchema,
  apiStatusSchema,
  metricSchema,
  projectSchema,
  requestLogSchema,
  settingsSchema,
  taskSchema,
  weekLoadSchema,
  worklogSchema,
} from "@/api/schemas";
import { ApiAck, ApiStatus, MetricEntry, Project, RequestLog, Settings, Task, WeekLoadDay, WorklogEntry } from "@/api/types";

const parseList = <T>(schema: z.ZodTypeAny, data: unknown): T[] => {
  const parsed = schema.array().safeParse(data);
  return parsed.success ? parsed.data : Array.isArray(data) ? (data as T[]) : [];
};

const parseItem = <T>(schema: z.ZodTypeAny, data: unknown): T | null => {
  const parsed = schema.safeParse(data);
  return parsed.success ? parsed.data : null;
};

type WritePayload = Record<string, unknown> & {
  request_id?: string;
  client_ts?: string;
};

const withWriteMeta = (payload: WritePayload) => ({
  ...payload,
  request_id: payload?.request_id ?? crypto.randomUUID(),
  client_ts: new Date().toISOString(),
});

export async function fetchStatus(): Promise<ApiStatus> {
  const data = await callApi("API_STATUS");
  return apiStatusSchema.parse(data);
}

export async function fetchTodayOverdue(): Promise<Task[]> {
  const data = await callApi("API_READ_TODAY_OVERDUE");
  return parseList<Task>(taskSchema, data);
}

export async function fetchTodayTasks(): Promise<Task[]> {
  const data = await callApi("API_READ_TODAY_TODAY");
  return parseList<Task>(taskSchema, data);
}

export async function fetchWeekLoad(): Promise<WeekLoadDay[]> {
  const data = await callApi("API_READ_WEEK_LOAD");
  return parseList<WeekLoadDay>(weekLoadSchema, data);
}

export async function fetchWeekTasks(filters?: Record<string, unknown>): Promise<Task[]> {
  const data = await callApi("API_READ_WEEK_TASKS", filters);
  return parseList<Task>(taskSchema, data);
}

export async function fetchTasksList(filters?: Record<string, unknown>): Promise<Task[]> {
  const data = await callApi("API_READ_TASKS_LIST", filters);
  return parseList<Task>(taskSchema, data);
}

export async function fetchTaskById(taskId: string): Promise<Task | null> {
  const data = await callApi("API_READ_TASK_BY_ID", { taskId });
  return parseItem<Task>(taskSchema, data);
}

export async function fetchProjects(): Promise<Project[]> {
  const data = await callApi("API_READ_PROJECTS");
  return parseList<Project>(projectSchema, data);
}

export async function fetchMetricsByProject(projectId: string): Promise<MetricEntry[]> {
  const data = await callApi("API_READ_METRICS_BY_PROJECT", { projectId });
  const parsed = metricSchema.array().safeParse(data);
  if (parsed.success) {
    // normalize 'notes' null -> undefined to match `MetricEntry` type
    return parsed.data.map((d) => ({ ...d, notes: d.notes ?? undefined }));
  }
  return [];
}

export async function fetchDailyRange(filters?: Record<string, unknown>): Promise<WorklogEntry[]> {
  const data = await callApi("API_READ_DAILY_RANGE", filters);
  return parseList<WorklogEntry>(worklogSchema, data);
}

export async function fetchSettings(): Promise<Settings> {
  const data = await callApi("API_READ_SETTINGS");
  const parsed = settingsSchema.safeParse(data);
  return parsed.success ? parsed.data : { focusDate: "" };
}

export async function fetchRequestLog(): Promise<RequestLog[]> {
  const data = await callApi("API_READ_REQUESTLOG");
  return parseList<RequestLog>(requestLogSchema, data);
}

export async function fetchTasksChangedSince(updatedAtSince: string) {
  const data = await callApi("API_READ_TASKS_CHANGED_SINCE", { updatedAtSince });
  return parseList<Task>(taskSchema, data);
}

export async function writeTaskUpsert(task: Partial<Task>): Promise<ApiAck> {
  const payload = withWriteMeta(task);
  const data = await callApi("API_WRITE_TASK_UPSERT_BUFFER", payload);
  return ackSchema.parse(data);
}

export async function writeWorklog(entry: Partial<WorklogEntry>): Promise<ApiAck> {
  const payload = withWriteMeta(entry);
  const data = await callApi("API_WRITE_WORKLOG_BUFFER", payload);
  return ackSchema.parse(data);
}

export async function writeFocusDate(focusDate: string): Promise<ApiAck> {
  const payload = withWriteMeta({ focusDate });
  const data = await callApi("API_WRITE_FOCUSDATE", payload);
  return ackSchema.parse(data);
}

export async function writeMetric(metric: Partial<MetricEntry>): Promise<ApiAck> {
  const payload = withWriteMeta(metric);
  const data = await callApi("API_WRITE_METRIC_BUFFER", payload);
  return ackSchema.parse(data);
}

export async function writeSettings(settings: Partial<Settings>): Promise<ApiAck> {
  const payload = withWriteMeta(settings);
  const data = await callApi("API_WRITE_SETTINGS_BUFFER", payload);
  return ackSchema.parse(data);
}
