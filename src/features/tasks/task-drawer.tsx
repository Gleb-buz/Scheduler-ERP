"use client";
import { Task } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { useCommandQueue } from "@/hooks/use-commands";
import { useToast } from "@/providers/toast-provider";

export function TaskDrawer({ task, open, onClose }: { task: Task | null; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<Task | null>(task);
  const { send } = useCommandQueue();
  const { push } = useToast();

  useEffect(() => {
    setForm(task);
  }, [task]);

  if (!form) return null;

  const update = (field: keyof Task, value: Task[keyof Task]) =>
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));

  const save = async () => {
    await send("task_upsert", form);
    push({ title: "Задача сохранена", tone: "success" });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Task details">
      <div className="space-y-3">
        <label className="space-y-1 text-sm">
          <span>Название</span>
          <Input value={form.taskName} onChange={(e) => update("taskName", e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <label className="space-y-1">
            <span>Статус</span>
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              className="input"
            >
              <option>Сделать</option>
              <option>В процессе</option>
              <option>Готово</option>
            </select>
          </label>
          <label className="space-y-1">
            <span>Важность</span>
            <Input
              type="number"
              value={form.importance ?? 0}
              onChange={(e) => update("importance", Number(e.target.value))}
            />
          </label>
          <label className="space-y-1">
            <span>AP</span>
            <Input type="number" value={form.ap ?? 0} onChange={(e) => update("ap", Number(e.target.value))} />
          </label>
          <label className="space-y-1">
            <span>Due (manual)</span>
            <Input
              type="date"
              value={form.dueDateManual ?? ""}
              onChange={(e) => update("dueDateManual", e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span>Due policy</span>
            <select
              value={form.duePolicy ?? ""}
              onChange={(e) => update("duePolicy", e.target.value)}
              className="input"
            >
              <option value="">Нет</option>
              <option value="Фиксированный">Фиксированный</option>
              <option value="АвтоНеделя">АвтоНеделя</option>
            </select>
          </label>
          <label className="space-y-1">
            <span>Project</span>
            <Input
              value={form.projectId_1 ?? ""}
              onChange={(e) => update("projectId_1", e.target.value)}
              placeholder="Project Id"
            />
          </label>
        </div>
        <label className="space-y-1 text-sm">
          <span>Notes</span>
          <Textarea value={form.notes ?? ""} onChange={(e) => update("notes", e.target.value)} />
        </label>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.deleted}
              onChange={(e) => update("deleted", e.target.checked)}
            />
            <span>Пометить как удалённую</span>
          </label>
          <div className="space-x-2">
            <Button variant="ghost" onClick={onClose} aria-label="Cancel">
              Отмена
            </Button>
            <Button onClick={save} aria-label="Save task">
              Сохранить
            </Button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
