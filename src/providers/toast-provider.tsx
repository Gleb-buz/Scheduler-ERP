"use client";
import { createContext, useContext, useState } from "react";
import { cn } from "@/lib/cn";

type Toast = { id: string; title: string; description?: string; tone?: "info" | "success" | "error" };

type ToastContextValue = {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = (toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => dismiss(id), 4000);
  };

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const value = { toasts, push, dismiss };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "card border-l-4 p-4 text-sm shadow-soft",
              toast.tone === "success" && "border-l-success/80",
              toast.tone === "error" && "border-l-danger/80",
              (!toast.tone || toast.tone === "info") && "border-l-accent/80"
            )}
            role="status"
          >
            <div className="font-semibold">{toast.title}</div>
            {toast.description && <div className="text-xs text-slate-500 dark:text-slate-400">{toast.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
