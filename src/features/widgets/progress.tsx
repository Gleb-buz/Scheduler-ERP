import { cn } from "@/lib/cn";

export function ProgressBar({ value, danger }: { value: number; danger?: boolean }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
      <div
        className={cn(
          "h-2 rounded-full transition-all",
          danger ? "bg-danger" : "bg-primary"
        )}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}
