export type Task = {
  taskId: string;
  taskName: string;
  status: string;
  importance?: number | null;
  ap?: number | null;
  projectId_1?: string | null;
  projectId_2?: string | null;
  projectId_3?: string | null;
  duePolicy?: string | null;
  dueDateManual?: string | null;
  dueDate?: string | null;
  earliest?: string | null;
  latest?: string | null;
  mon?: boolean;
  tue?: boolean;
  wed?: boolean;
  thu?: boolean;
  fri?: boolean;
  sat?: boolean;
  sun?: boolean;
  notes?: string;
  deleted?: boolean;
  rowVersion?: number | string | null;
  updatedAt?: string | null;
  daysToDue?: number | null;
  urgency?: number | null;
  priorityScore?: number | null;
  linksCount?: number | null;
};

export type Project = {
  projectId: string;
  projectName: string;
  type?: string;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
  apTarget?: number | null;
  targetDays?: number | null;
  apAccum?: number | null;
  doneDays?: number | null;
};

export type WorklogEntry = {
  id?: string;
  date: string;
  taskId?: string | null;
  done?: boolean;
  apPlan?: number | null;
  apFact?: number | null;
  apUsed?: number | null;
  notes?: string;
  energy?: number | null;
  mood?: number | null;
  source?: string;
  requestId?: string;
  clientTs?: string;
  projectId?: string | null;
};

export type MetricEntry = {
  id?: string;
  date: string;
  projectId: string;
  metricValue: number;
  notes?: string;
};

export type Settings = {
  focusDate: string;
  weight_importance?: number;
  weight_urgency?: number;
  weight_links?: number;
  overdue_base_boost?: number;
  overdue_per_day_boost?: number;
  capacity_mon?: number;
  capacity_tue?: number;
  capacity_wed?: number;
  capacity_thu?: number;
  capacity_fri?: number;
  capacity_sat?: number;
  capacity_sun?: number;
  [key: string]: string | number | boolean | null | undefined;
};

export type WeekLoadDay = {
  date: string;
  capacity: number;
  planned: number;
  remaining: number;
};

export type RequestLog = {
  id?: string;
  requestId: string;
  op: string;
  status: string;
  createdAt?: string;
  processedAt?: string;
  error?: string | null;
};

export type ApiStatus = {
  ok: boolean;
  message?: string;
  focusDate?: string;
  lastSync?: string;
};

export type ApiAck = {
  ok: boolean;
  requestId: string;
  message?: string;
};
