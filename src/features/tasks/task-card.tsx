"use client";
import { Task } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { CheckCircle2, Clock3, Dot, Info } from "lucide-react";

export function TaskCard({
  task,
  onToggleDone,
  onOpen,
  onStatusChange,
}: {
  task: Task;
  onToggleDone: (task: Task) => void;
  onOpen?: (task: Task) => void;
  onStatusChange?: (task: Task, status: string) => void;
}) {
  const overdue = (task.daysToDue ?? 0) < 0;
  const statusColor = task.status === "Готово" ? "bg-success/10 text-success" : "bg-primary/10 text-primary";
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleDone(task)}
          aria-label="Toggle done"
          className={cn(
            "mt-1 rounded-full border border-border p-1 transition",
            task.status === "Готово" ? "bg-success/20 text-success" : "hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <CheckCircle2 className={cn("h-5 w-5", task.status === "Готово" && "text-success")} />
        </button>
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-base font-semibold leading-tight">{task.taskName}</div>
            {task.projectId_1 && <Badge className="bg-primary/10 text-primary">{task.projectId_1}</Badge>}
            <Badge className={cn("border-none", statusColor)}>{task.status}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />Due {formatDate(task.dueDate ?? task.dueDateManual)}</span>
            {task.ap !== undefined && <span>{task.ap} AP</span>}
            {task.importance && <span className="flex items-center gap-1"><Dot />Imp {task.importance}</span>}
            {task.urgency && <span className="flex items-center gap-1"><Dot />Urg {task.urgency}</span>}
            {overdue && <span className="text-danger">Overdue</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpen?.(task)} aria-label="Open details">
            <Info className="h-4 w-4" />
          </Button>
          <select
            className="rounded-lg border border-border bg-card px-2 py-1 text-xs"
            value={task.status}
            onChange={(e) => onStatusChange?.(task, e.target.value)}
            aria-label="Status"
          >
            <option>Сделать</option>
            <option>В процессе</option>
            <option>Готово</option>
          </select>
        </div>
      </div>
      {task.notes && <div className="text-sm text-slate-600 dark:text-slate-300">{task.notes}</div>}
    </Card>
  );
}
