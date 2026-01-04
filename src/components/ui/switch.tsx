"use client";
import { cn } from "@/lib/cn";

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-2 rounded-full border border-border px-3 py-1 transition",
        checked ? "bg-primary/10 text-primary" : "bg-card"
      )}
    >
      <span
        className={cn(
          "h-5 w-5 rounded-full border border-border bg-white shadow-inner transition",
          checked && "translate-x-1.5 bg-primary"
        )}
      />
      {label && <span className="text-sm">{label}</span>}
    </button>
  );
}
