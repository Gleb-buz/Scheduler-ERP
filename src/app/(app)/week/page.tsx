"use client";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWeekLoad, fetchWeekTasks } from "@/api/endpoints";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/features/tasks/task-card";
import { WeekLoadWidget } from "@/features/today/week-load-widget";
import { useCommandQueue } from "@/hooks/use-commands";
import { Task } from "@/api/types";
import { queryKeys } from "@/lib/queryKeys";
import { formatDate } from "@/lib/dates";

export default function WeekPage() {
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [includeOverdue, setIncludeOverdue] = useState(true);
  const qc = useQueryClient();
  const { send } = useCommandQueue();

  const weekLoad = useQuery({ queryKey: queryKeys.weekLoad, queryFn: fetchWeekLoad });
  const weekTasks = useQuery({
    queryKey: queryKeys.weekTasks({ project: projectFilter, status: statusFilter, includeOverdue }),
    queryFn: () => fetchWeekTasks({ project: projectFilter, status: statusFilter, includeOverdue }),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    (weekTasks.data ?? []).forEach((task) => {
      const date = task.dueDate ?? task.dueDateManual ?? "Не назначено";
      const list = map.get(date) ?? [];
      list.push(task);
      map.set(date, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => (a > b ? 1 : -1));
  }, [weekTasks.data]);

  const reschedule = async (task: Task, date: string) => {
    await send("task_upsert", { taskId: task.taskId, dueDateManual: date, duePolicy: "Фиксированный" });
    qc.invalidateQueries();
  };

  return (
    <div className="space-y-4">
      <WeekLoadWidget data={weekLoad.data ?? []} />

      <Card className="flex flex-wrap gap-3 p-4 text-sm">
        <label className="flex items-center gap-2">
          Project
          <Input value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} placeholder="project id" className="w-40" />
        </label>
        <label className="flex items-center gap-2">
          Status
          <Input value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholder="status" className="w-32" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={includeOverdue} onChange={(e) => setIncludeOverdue(e.target.checked)} />
          Включать просроченные
        </label>
      </Card>

      <div className="space-y-3">
        {grouped.map(([date, tasks]) => (
          <Card key={date} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{date === "Не назначено" ? date : formatDate(date, "EEE d")}</div>
              <div className="text-xs text-slate-500">{tasks.length} задач</div>
            </div>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.taskId} className="space-y-2">
                  <TaskCard
                    task={task}
                    onToggleDone={() => reschedule(task, date)}
                    onStatusChange={(t, status) => send("task_upsert", { taskId: t.taskId, status }).then(() => qc.invalidateQueries())}
                    onOpen={() => {}}
                  />
                  <div className="flex items-center gap-2 text-xs">
                    <Input
                      type="date"
                      className="w-44"
                      value={task.dueDateManual ?? ""}
                      onChange={(e) => reschedule(task, e.target.value)}
                    />
                    <Button size="sm" variant="outline" onClick={() => reschedule(task, task.dueDateManual ?? date)}>
                      Перенести
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
