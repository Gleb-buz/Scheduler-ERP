"use client";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDailyRange } from "@/api/endpoints";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WorklogEntry } from "@/api/types";
import { queryKeys } from "@/lib/queryKeys";
import { formatDate, todayDateString } from "@/lib/dates";
import { useCommandQueue } from "@/hooks/use-commands";

const today = todayDateString();

export default function JournalPage() {
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [newNote, setNewNote] = useState("");
  const qc = useQueryClient();
  const { send } = useCommandQueue();

  const entries = useQuery({
    queryKey: queryKeys.daily({ start, end, projectId, taskId }),
    queryFn: () => fetchDailyRange({ startDate: start, endDate: end, projectId, taskId }),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, WorklogEntry[]>();
    (entries.data ?? []).forEach((e) => {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => (a > b ? -1 : 1));
  }, [entries.data]);

  const preset = (days: number) => {
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days + 1);
    setStart(startDate.toISOString().split("T")[0]);
    setEnd(endDate.toISOString().split("T")[0]);
  };

  const addEntry = async () => {
    if (!newNote.trim()) return;
    await send("worklog_append", { date: today, notes: newNote, source: "journal" });
    setNewNote("");
    qc.invalidateQueries();
  };

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3 p-4 text-sm">
        <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} aria-label="Start" />
        <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="End" />
        <Input value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="Project" className="w-32" />
        <Input value={taskId} onChange={(e) => setTaskId(e.target.value)} placeholder="Task" className="w-32" />
        <div className="flex gap-1 text-xs">
          {[7, 14, 30].map((d) => (
            <Button key={d} size="sm" variant="outline" onClick={() => preset(d)}>
              {d} дн
            </Button>
          ))}
        </div>
      </Card>

      <Card className="p-4 space-y-2">
        <div className="text-sm font-semibold">Добавить запись</div>
        <Input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Notes" />
        <Button onClick={addEntry} disabled={!newNote.trim()}>
          Записать
        </Button>
      </Card>

      <div className="space-y-3">
        {grouped.map(([date, logs]) => (
          <Card key={date} className="p-4 space-y-2">
            <div className="text-sm font-semibold sticky top-20 bg-card/80 py-1">{formatDate(date, "PPP")}</div>
            {logs.map((log) => (
              <div key={log.id ?? log.requestId} className="rounded-xl border border-border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{log.taskId ?? "Свободная запись"}</div>
                  <div className="text-xs text-slate-500">Mood {log.mood ?? "-"} • Energy {log.energy ?? "-"}</div>
                </div>
                <div className="text-xs text-slate-500">AP fact: {log.apFact ?? "-"}</div>
                <div>{log.notes}</div>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}
