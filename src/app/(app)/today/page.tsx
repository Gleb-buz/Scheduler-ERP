"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchStatus, fetchTodayOverdue, fetchTodayTasks, fetchWeekLoad } from "@/api/endpoints";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskCard } from "@/features/tasks/task-card";
import { TaskDrawer } from "@/features/tasks/task-drawer";
import { WeekLoadWidget } from "@/features/today/week-load-widget";
import { useCommandQueue } from "@/hooks/use-commands";
import { useToast } from "@/providers/toast-provider";
import { todayDateString } from "@/lib/dates";
import { Task } from "@/api/types";
import { queryKeys as keys } from "@/lib/queryKeys";

export default function TodayPage() {
  const qc = useQueryClient();
  const { send } = useCommandQueue();
  const { push } = useToast();
  const [selected, setSelected] = useState<Task | null>(null);
  const [newTaskName, setNewTaskName] = useState("");

  const status = useQuery({ queryKey: keys.status, queryFn: fetchStatus });
  const overdue = useQuery({ queryKey: keys.todayOverdue, queryFn: fetchTodayOverdue });
  const today = useQuery({ queryKey: keys.today, queryFn: fetchTodayTasks });
  const weekLoad = useQuery({ queryKey: keys.weekLoad, queryFn: fetchWeekLoad });

  const shiftFocus = async (days: number) => {
    const current = status.data?.focusDate || todayDateString();
    const date = new Date(current);
    date.setDate(date.getDate() + days);
    const iso = date.toISOString().split("T")[0];
    await send("set_focusdate", { focusDate: iso });
    qc.invalidateQueries({ queryKey: keys.status });
    qc.invalidateQueries({ queryKey: keys.today });
    qc.invalidateQueries({ queryKey: keys.todayOverdue });
    qc.invalidateQueries({ queryKey: keys.weekLoad });
    push({ title: "Focus date обновлена", tone: "success" });
  };

  const toggleDone = async (task: Task) => {
    await send("worklog_append", {
      taskId: task.taskId,
      date: status.data?.focusDate ?? todayDateString(),
      done: task.status !== "Готово",
    });
    await send("task_upsert", { taskId: task.taskId, status: task.status === "Готово" ? "Сделать" : "Готово" });
    qc.invalidateQueries();
  };

  const changeStatus = async (task: Task, statusValue: string) => {
    await send("task_upsert", { taskId: task.taskId, status: statusValue });
    qc.invalidateQueries();
  };

  const quickAdd = async () => {
    if (!newTaskName.trim()) return;
    await send("task_upsert", { taskName: newTaskName, status: "Сделать", duePolicy: "АвтоНеделя" });
    setNewTaskName("");
    qc.invalidateQueries();
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card/70 p-3 backdrop-blur">
        <div className="flex items-center gap-2 text-sm">
          <Button variant="ghost" size="sm" onClick={() => shiftFocus(-1)} aria-label="Prev day">
            -1
          </Button>
          <div className="rounded-xl border border-border px-3 py-2 text-sm font-semibold">
            Focus: {status.data?.focusDate ?? ""}
          </div>
          <Button variant="ghost" size="sm" onClick={() => shiftFocus(1)} aria-label="Next day">
            +1
          </Button>
          <Button variant="outline" size="sm" onClick={() => shiftFocus(0)} aria-label="Today">
            Today
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
            Sync: {status.data?.lastSync ?? "mock"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-lg font-semibold">Overdue</div>
              {overdue.isLoading && <Skeleton className="h-4 w-20" />}
            </div>
            <div className="space-y-3">
              {overdue.data?.length ? (
                overdue.data.map((task) => (
                  <TaskCard
                    key={task.taskId}
                    task={task}
                    onToggleDone={toggleDone}
                    onOpen={(t) => setSelected(t)}
                    onStatusChange={changeStatus}
                  />
                ))
              ) : (
                <div className="text-sm text-slate-500">Нет просроченных задач 🎉</div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-lg font-semibold">Сегодня</div>
              {today.isLoading && <Skeleton className="h-4 w-20" />}
            </div>
            <div className="space-y-3">
              {today.data?.length ? (
                today.data.map((task) => (
                  <TaskCard
                    key={task.taskId}
                    task={task}
                    onToggleDone={toggleDone}
                    onOpen={(t) => setSelected(t)}
                    onStatusChange={changeStatus}
                  />
                ))
              ) : (
                <div className="text-sm text-slate-500">На сегодня всё чисто</div>
              )}
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <WeekLoadWidget data={weekLoad.data ?? []} />
          <Card className="p-4 space-y-2">
            <div className="text-sm font-semibold">Быстрое добавление</div>
            <Input
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="Новая задача"
              aria-label="New task name"
            />
            <Button onClick={quickAdd} aria-label="Add task">Сохранить</Button>
          </Card>
        </div>
      </div>

      <TaskDrawer task={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}
