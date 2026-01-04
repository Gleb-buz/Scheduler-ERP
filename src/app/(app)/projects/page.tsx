"use client";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMetricsByProject, fetchProjects, fetchTasksList } from "@/api/endpoints";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Task } from "@/api/types";
import { queryKeys } from "@/lib/queryKeys";
import { formatDate } from "@/lib/dates";
import { useCommandQueue } from "@/hooks/use-commands";
import { TaskDrawer } from "@/features/tasks/task-drawer";

export default function ProjectsPage() {
  const qc = useQueryClient();
  const { send } = useCommandQueue();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [metricValue, setMetricValue] = useState("");
  const [metricNotes, setMetricNotes] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const projects = useQuery({ queryKey: queryKeys.projects, queryFn: fetchProjects });
  const activeProjectId = projectId ?? projects.data?.[0]?.projectId ?? null;

  const tasks = useQuery({
    queryKey: queryKeys.tasks({ projectId: activeProjectId }),
    queryFn: () => fetchTasksList({ project: activeProjectId ?? "" }),
    enabled: !!activeProjectId,
  });
  const metrics = useQuery({
    queryKey: activeProjectId ? queryKeys.metrics(activeProjectId) : ["metrics", "none"],
    queryFn: () => fetchMetricsByProject(activeProjectId ?? ""),
    enabled: !!activeProjectId,
  });

  const currentProject = useMemo(
    () => projects.data?.find((p) => p.projectId === activeProjectId) ?? null,
    [projects.data, activeProjectId]
  );

  const addMetric = async () => {
    if (!projectId || !metricValue) return;
    await send("metric_append", {
      projectId,
      metricValue: Number(metricValue),
      notes: metricNotes,
      date: new Date().toISOString().split("T")[0],
    });
    setMetricValue("");
    setMetricNotes("");
    qc.invalidateQueries({ queryKey: queryKeys.metrics(projectId) });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <Card className="lg:col-span-1 p-4 space-y-2">
        <div className="text-sm font-semibold">Проекты</div>
        <div className="space-y-2">
          {projects.data?.map((p) => (
            <button
              key={p.projectId}
              className={`w-full rounded-xl border px-3 py-2 text-left ${activeProjectId === p.projectId ? "border-primary bg-primary/5" : "border-border"}`}
              onClick={() => setProjectId(p.projectId)}
            >
              <div className="text-sm font-semibold">{p.projectName}</div>
              <div className="text-xs text-slate-500">{p.status}</div>
            </button>
          ))}
        </div>
      </Card>

      <div className="lg:col-span-3 space-y-4">
        {currentProject && (
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <div className="text-lg font-semibold">{currentProject.projectName}</div>
                <div className="text-xs text-slate-500">{currentProject.type} • {currentProject.status}</div>
              </div>
              <div className="ml-auto text-xs text-slate-500">
                Target: {currentProject.apTarget ?? "-"} | Done: {currentProject.apAccum ?? 0}
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Задачи проекта</div>
            <div className="text-xs text-slate-500">{tasks.data?.length ?? 0} задач</div>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {tasks.data?.map((t) => (
              <Card key={t.taskId} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">{t.taskName}</div>
                    <div className="text-xs text-slate-500">{t.status} • {formatDate(t.dueDate ?? t.dueDateManual)}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedTask(t)} aria-label="Open task">
                    Открыть
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Метрики</div>
            <div className="text-xs text-slate-500">История</div>
          </div>
          <div className="space-y-2">
            {metrics.data?.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
                <div>{formatDate(m.date)}</div>
                <div className="font-semibold">{m.metricValue}</div>
                <div className="text-xs text-slate-500">{m.notes}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <Input
              type="number"
              value={metricValue}
              onChange={(e) => setMetricValue(e.target.value)}
              placeholder="Значение"
            />
            <Input value={metricNotes} onChange={(e) => setMetricNotes(e.target.value)} placeholder="Комментарий" />
            <Button onClick={addMetric} disabled={!metricValue || !projectId}>Добавить</Button>
          </div>
        </Card>
      </div>

      <TaskDrawer task={selectedTask} open={!!selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
}
