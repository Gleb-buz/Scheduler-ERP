"use client";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTasksList } from "@/api/endpoints";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Task } from "@/api/types";
import { queryKeys } from "@/lib/queryKeys";
import { TaskDrawer } from "@/features/tasks/task-drawer";
import { useCommandQueue } from "@/hooks/use-commands";
import { formatDate } from "@/lib/dates";

export default function TasksPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [project, setProject] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [current, setCurrent] = useState<Task | null>(null);
  const qc = useQueryClient();
  const { send } = useCommandQueue();

  const tasks = useQuery({
    queryKey: queryKeys.tasks({ search, status, project, includeDeleted }),
    queryFn: () => fetchTasksList({ q: search, status, project, includeDeleted }),
  });

  const filtered = useMemo(() => tasks.data ?? [], [tasks.data]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const massUpdate = async (updates: Partial<Task>) => {
    for (const id of selectedIds) {
      await send("task_upsert", { taskId: id, ...updates });
    }
    qc.invalidateQueries();
    setSelectedIds([]);
  };

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap gap-2 p-4 text-sm">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск"
          className="w-64"
          aria-label="Search"
        />
        <Input value={project} onChange={(e) => setProject(e.target.value)} placeholder="Project" className="w-40" />
        <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Status" className="w-32" />
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={includeDeleted} onChange={(e) => setIncludeDeleted(e.target.checked)} />
          Включая удалённые
        </label>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Button size="sm" onClick={() => massUpdate({ status: "Готово" })} disabled={!selectedIds.length}>
            Отметить сделанными
          </Button>
          <Button size="sm" variant="outline" onClick={() => massUpdate({ deleted: true })} disabled={!selectedIds.length}>
            Удалить
          </Button>
          <Button size="sm" variant="outline" onClick={() => massUpdate({ deleted: false })} disabled={!selectedIds.length}>
            Восстановить
          </Button>
        </div>
        <div className="hidden w-full overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2">Название</th>
                <th className="px-2 py-2">Проект</th>
                <th className="px-2 py-2">Статус</th>
                <th className="px-2 py-2">Due</th>
                <th className="px-2 py-2">AP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => (
                <tr key={task.taskId} className="border-t border-border text-sm hover:bg-slate-50">
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(task.taskId)}
                      onChange={() => toggleSelect(task.taskId)}
                      aria-label="Select task"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button className="text-left font-semibold" onClick={() => setCurrent(task)}>
                      {task.taskName}
                    </button>
                  </td>
                  <td className="px-2 py-2">{task.projectId_1}</td>
                  <td className="px-2 py-2">{task.status}</td>
                  <td className="px-2 py-2">{formatDate(task.dueDate ?? task.dueDateManual)}</td>
                  <td className="px-2 py-2">{task.ap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 md:hidden">
          {filtered.map((task) => (
            <Card key={task.taskId} className="p-3 space-y-1">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(task.taskId)}
                  onChange={() => toggleSelect(task.taskId)}
                  aria-label="Select task"
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold" onClick={() => setCurrent(task)}>
                    {task.taskName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {task.projectId_1} • {task.status} • {formatDate(task.dueDate ?? task.dueDateManual)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <TaskDrawer task={current} open={!!current} onClose={() => setCurrent(null)} />
    </div>
  );
}
