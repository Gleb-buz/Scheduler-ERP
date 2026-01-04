import { ApiStatus, MetricEntry, Project, RequestLog, Settings, Task, WeekLoadDay, WorklogEntry } from "@/api/types";
import { todayDateString } from "@/lib/dates";

const today = todayDateString();

export const mockTasks: Task[] = [
  {
    taskId: "T-100",
    taskName: "Подготовить недельный план",
    status: "В процессе",
    importance: 5,
    ap: 3,
    projectId_1: "P-1",
    duePolicy: "Фиксированный",
    dueDateManual: today,
    dueDate: today,
    priorityScore: 87,
    urgency: 8,
    notes: "Синхронизировать с командой",
  },
  {
    taskId: "T-101",
    taskName: "Разобрать входящие",
    status: "Сделать",
    importance: 3,
    ap: 2,
    projectId_1: "P-ops",
    duePolicy: "АвтоНеделя",
    dueDateManual: null,
    dueDate: today,
    priorityScore: 60,
    urgency: 4,
    notes: "",
  },
  {
    taskId: "T-102",
    taskName: "Демо для клиента",
    status: "Сделать",
    importance: 4,
    ap: 5,
    projectId_1: "P-2",
    duePolicy: "Фиксированный",
    dueDateManual: today,
    dueDate: today,
    priorityScore: 92,
    urgency: 10,
    notes: "Дедлайн жесткий",
    daysToDue: -1,
  },
  {
    taskId: "T-103",
    taskName: "Бэклог UI Kit",
    status: "В процессе",
    importance: 4,
    ap: 8,
    projectId_1: "P-1",
    duePolicy: "АвтоНеделя",
    dueDate: today,
    daysToDue: 3,
    priorityScore: 72,
    urgency: 5,
  },
];

export const mockProjects: Project[] = [
  {
    projectId: "P-1",
    projectName: "ERP Planner",
    status: "Активен",
    type: "Product",
    apTarget: 40,
    apAccum: 12,
    doneDays: 3,
  },
  {
    projectId: "P-2",
    projectName: "Клиентские внедрения",
    status: "Активен",
    type: "Delivery",
    apTarget: 60,
    apAccum: 24,
    doneDays: 4,
  },
  {
    projectId: "P-ops",
    projectName: "Operations",
    status: "Поддержка",
    type: "Ops",
    apTarget: 20,
    apAccum: 10,
    doneDays: 5,
  },
];

export const mockWeekLoad: WeekLoadDay[] = Array.from({ length: 7 }).map((_, i) => {
  const date = new Date(today);
  date.setDate(date.getDate() + i);
  const iso = date.toISOString().split("T")[0];
  const capacity = i >= 5 ? 6 : 10;
  const planned = Math.max(0, capacity - (i % 3) * 2);
  return {
    date: iso,
    capacity,
    planned,
    remaining: capacity - planned,
  };
});

export const mockWorklog: WorklogEntry[] = [
  {
    id: "W-1",
    date: today,
    taskId: "T-100",
    done: true,
    apFact: 3,
    notes: "Согласовали объём",
    mood: 4,
    energy: 4,
    source: "today",
  },
  {
    id: "W-2",
    date: today,
    taskId: "T-101",
    done: false,
    apPlan: 2,
    notes: "Разобрать вечером",
    source: "today",
  },
];

export const mockMetrics: MetricEntry[] = [
  { id: "M-1", date: today, projectId: "P-1", metricValue: 5, notes: "скорость" },
  { id: "M-2", date: today, projectId: "P-2", metricValue: 8, notes: "NPS" },
];

export const mockSettings: Settings = {
  focusDate: today,
  weight_importance: 1,
  weight_urgency: 1,
  weight_links: 1,
  overdue_base_boost: 2,
  overdue_per_day_boost: 0.5,
  capacity_mon: 10,
  capacity_tue: 10,
  capacity_wed: 10,
  capacity_thu: 10,
  capacity_fri: 10,
  capacity_sat: 6,
  capacity_sun: 6,
};

export const mockRequestLog: RequestLog[] = [
  {
    id: "R-1",
    requestId: "mock-1",
    op: "API_WRITE_TASK_UPSERT_BUFFER",
    status: "ok",
    createdAt: `${today}T08:00:00Z`,
    processedAt: `${today}T08:00:01Z`,
  },
];

export const mockStatus: ApiStatus = {
  ok: true,
  focusDate: today,
  lastSync: `${today}T09:00:00Z`,
};
