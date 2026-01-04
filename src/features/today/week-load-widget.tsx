import { WeekLoadDay } from "@/api/types";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/dates";
import { ProgressBar } from "@/features/widgets/progress";

export function WeekLoadWidget({ data }: { data: WeekLoadDay[] }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">Нагрузка недели</div>
        <div className="text-xs text-slate-500">capacity / planned</div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {data.map((day) => {
          const used = Math.min(1, day.planned / Math.max(1, day.capacity));
          return (
            <div key={day.date} className="rounded-xl border border-border p-2">
              <div className="text-xs font-semibold">{formatDate(day.date, "EEE d")}</div>
              <ProgressBar value={used * 100} danger={used > 1} />
              <div className="mt-1 text-[11px] text-slate-500">
                {day.planned} / {day.capacity} AP
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
