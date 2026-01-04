"use client";
import { cn } from "@/lib/cn";
import { useEffect } from "react";

export function Sheet({
  open,
  onClose,
  children,
  title,
  side = "right",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  side?: "right" | "bottom";
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div
        className={cn(
          "ml-auto flex h-full w-full max-w-xl flex-col bg-card p-6 shadow-2xl transition",
          side === "bottom" && "mx-auto mt-auto h-[80%] max-w-none rounded-t-3xl"
        )}
        role="dialog"
        aria-label={title ?? "Details"}
      >
        <div className="flex items-center justify-between pb-4">
          <div className="text-lg font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto pr-2">{children}</div>
      </div>
    </div>
  );
}
