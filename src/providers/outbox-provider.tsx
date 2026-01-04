"use client";
import { useEffect } from "react";
import { useOutboxStore } from "@/store/outbox";
import { useNetworkStatus } from "@/hooks/use-network";

export function OutboxProvider({ children }: { children: React.ReactNode }) {
  const { load, process } = useOutboxStore();
  const online = useNetworkStatus();

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (online) {
      process();
    }
  }, [online, process]);

  useEffect(() => {
    const id = setInterval(() => {
      if (online) process();
    }, 5000);
    return () => clearInterval(id);
  }, [online, process]);

  return <>{children}</>;
}
