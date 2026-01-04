import { z } from "zod";

export const taskSchema = z.object({
  taskId: z.string(),
  taskName: z.string(),
  status: z.string(),
  importance: z.coerce.number().nullable().optional(),
  ap: z.coerce.number().nullable().optional(),
  projectId_1: z.string().nullable().optional(),
  projectId_2: z.string().nullable().optional(),
  projectId_3: z.string().nullable().optional(),
  duePolicy: z.string().nullable().optional(),
  dueDateManual: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  earliest: z.string().nullable().optional(),
  latest: z.string().nullable().optional(),
  mon: z.boolean().optional(),
  tue: z.boolean().optional(),
  wed: z.boolean().optional(),
  thu: z.boolean().optional(),
  fri: z.boolean().optional(),
  sat: z.boolean().optional(),
  sun: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  deleted: z.boolean().optional(),
  rowVersion: z.union([z.number(), z.string()]).nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  daysToDue: z.coerce.number().nullable().optional(),
  urgency: z.coerce.number().nullable().optional(),
  priorityScore: z.coerce.number().nullable().optional(),
  linksCount: z.coerce.number().nullable().optional(),
});

export const projectSchema = z.object({
  projectId: z.string(),
  projectName: z.string(),
  type: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  apTarget: z.coerce.number().nullable().optional(),
  targetDays: z.coerce.number().nullable().optional(),
  apAccum: z.coerce.number().nullable().optional(),
  doneDays: z.coerce.number().nullable().optional(),
});

export const weekLoadSchema = z.object({
  date: z.string(),
  capacity: z.coerce.number(),
  planned: z.coerce.number(),
  remaining: z.coerce.number(),
});

export const worklogSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  taskId: z.string().nullable().optional(),
  done: z.boolean().optional(),
  apPlan: z.coerce.number().nullable().optional(),
  apFact: z.coerce.number().nullable().optional(),
  apUsed: z.coerce.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  energy: z.coerce.number().nullable().optional(),
  mood: z.coerce.number().nullable().optional(),
  source: z.string().nullable().optional(),
  requestId: z.string().optional(),
  clientTs: z.string().optional(),
  projectId: z.string().nullable().optional(),
});

export const metricSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  projectId: z.string(),
  metricValue: z.coerce.number(),
  notes: z.string().nullable().optional(),
});

export const settingsSchema = z.object({
  focusDate: z.string(),
  weight_importance: z.coerce.number().nullable().optional(),
  weight_urgency: z.coerce.number().nullable().optional(),
  weight_links: z.coerce.number().nullable().optional(),
  overdue_base_boost: z.coerce.number().nullable().optional(),
  overdue_per_day_boost: z.coerce.number().nullable().optional(),
  capacity_mon: z.coerce.number().nullable().optional(),
  capacity_tue: z.coerce.number().nullable().optional(),
  capacity_wed: z.coerce.number().nullable().optional(),
  capacity_thu: z.coerce.number().nullable().optional(),
  capacity_fri: z.coerce.number().nullable().optional(),
  capacity_sat: z.coerce.number().nullable().optional(),
  capacity_sun: z.coerce.number().nullable().optional(),
});

export const requestLogSchema = z.object({
  id: z.string().optional(),
  requestId: z.string(),
  op: z.string(),
  status: z.string(),
  createdAt: z.string().nullable().optional(),
  processedAt: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
});

export const apiStatusSchema = z.object({
  ok: z.boolean().default(true),
  message: z.string().optional(),
  focusDate: z.string().optional(),
  lastSync: z.string().optional(),
});

export const ackSchema = z.object({
  ok: z.boolean(),
  requestId: z.string(),
  message: z.string().optional(),
});
