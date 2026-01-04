"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRequestLog, fetchTasksChangedSince } from "@/api/endpoints";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOutboxStore } from "@/store/outbox";
import { queryKeys } from "@/lib/queryKeys";

export default function DebugPage() {
  const queue = useOutboxStore((s) => s.queue);
  const process = useOutboxStore((s) => s.process);
  const clear = useOutboxStore((s) => s.clear);
  const [since, setSince] = useState("");
  const requestLog = useQuery({ queryKey: queryKeys.requestLog, queryFn: fetchRequestLog });
  const changed = useQuery({
    queryKey: queryKeys.changedSince(since),
    queryFn: () => fetchTasksChangedSince(since),
    enabled: !!since,
  });

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Local outbox</div>
          <div className="flex gap-2 text-sm">
            <Button size="sm" onClick={() => process()}>Retry</Button>
            <Button size="sm" variant="outline" onClick={() => clear()}>Clear</Button>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          {queue.map((item) => (
            <div key={item.id} className="rounded-xl border border-border px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{item.type}</div>
                <div className="text-xs text-slate-500">{item.status} • attempts {item.attempts}</div>
              </div>
              <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(item.payload, null, 2)}</pre>
            </div>
          ))}
          {!queue.length && <div className="text-xs text-slate-500">Очередь пуста</div>}
        </div>
      </Card>

      <Card className="p-4 space-y-2">
        <div className="text-sm font-semibold">Последние запросы</div>
        <div className="grid gap-2 text-xs">
          {requestLog.data?.map((r) => (
            <div key={r.requestId} className="rounded-xl border border-border px-3 py-2">
              <div className="font-semibold">{r.op}</div>
              <div>{r.status}</div>
              <div className="text-slate-500">{r.error}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 space-y-2">
        <div className="text-sm font-semibold">Pull changes since</div>
        <div className="flex gap-2">
          <Input value={since} onChange={(e) => setSince(e.target.value)} placeholder="ISO datetime" />
          <Button onClick={() => changed.refetch()}>Pull</Button>
        </div>
        <pre className="whitespace-pre-wrap rounded-xl bg-slate-900/80 p-3 text-xs text-white">
          {JSON.stringify(changed.data ?? [], null, 2)}
        </pre>
      </Card>
    </div>
  );
}
