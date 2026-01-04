"use client";
import { useOutboxStore } from "@/store/outbox";
import { useNetworkStatus } from "@/hooks/use-network";

export function useCommandQueue() {
  const online = useNetworkStatus();
  const enqueue = useOutboxStore((s) => s.enqueue);
  const process = useOutboxStore((s) => s.process);

  const send = async (
    type: Parameters<typeof enqueue>[0],
    payload: Record<string, unknown>
  ) => {
    const item = await enqueue(type, payload);
    if (online) {
      await process();
    }
    return item;
  };

  return { send };
}
