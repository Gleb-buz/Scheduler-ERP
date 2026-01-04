"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSettings } from "@/api/endpoints";
import { Settings } from "@/api/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/queryKeys";
import { useCommandQueue } from "@/hooks/use-commands";
import { useToast } from "@/providers/toast-provider";

export default function SettingsPage() {
  const { data } = useQuery({ queryKey: queryKeys.settings, queryFn: fetchSettings });
  const [form, setForm] = useState<Settings | null>(null);
  const { send } = useCommandQueue();
  const qc = useQueryClient();
  const { push } = useToast();

  useEffect(() => {
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(data);
    }
  }, [data]);

  if (!form) return <div className="p-4">Загрузка настроек...</div>;

  const update = (field: keyof Settings, value: Settings[keyof Settings]) =>
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));

  const save = async () => {
    await send("settings_set", form);
    qc.invalidateQueries({ queryKey: queryKeys.settings });
    qc.invalidateQueries({ queryKey: queryKeys.weekLoad });
    qc.invalidateQueries({ queryKey: queryKeys.today });
    push({ title: "Настройки обновлены", tone: "success" });
  };

  const capacityFields = [
    "capacity_mon",
    "capacity_tue",
    "capacity_wed",
    "capacity_thu",
    "capacity_fri",
    "capacity_sat",
    "capacity_sun",
  ] as const;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-4 space-y-3">
        <div className="text-sm font-semibold">Focus & Calendar</div>
        <div className="text-xs text-slate-500">Текущая focus дата управляется на экране Today.</div>
        <div className="text-sm">Focus date: {form.focusDate}</div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="text-sm font-semibold">Weights</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <label className="space-y-1">
            <span>Importance</span>
            <Input
              type="number"
              value={form.weight_importance ?? 0}
              onChange={(e) => update("weight_importance", Number(e.target.value))}
            />
          </label>
          <label className="space-y-1">
            <span>Urgency</span>
            <Input type="number" value={form.weight_urgency ?? 0} onChange={(e) => update("weight_urgency", Number(e.target.value))} />
          </label>
          <label className="space-y-1">
            <span>Links</span>
            <Input type="number" value={form.weight_links ?? 0} onChange={(e) => update("weight_links", Number(e.target.value))} />
          </label>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="text-sm font-semibold">Overdue boosts</div>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-sm">
            <span>Base boost</span>
            <Input
              type="number"
              value={form.overdue_base_boost ?? 0}
              onChange={(e) => update("overdue_base_boost", Number(e.target.value))}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Per day</span>
            <Input
              type="number"
              value={form.overdue_per_day_boost ?? 0}
              onChange={(e) => update("overdue_per_day_boost", Number(e.target.value))}
            />
          </label>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="text-sm font-semibold">Capacity (Mon..Sun)</div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {capacityFields.map((field) => (
            <label key={field} className="space-y-1 text-sm">
              <span className="capitalize">{field.replace("capacity_", "")}</span>
              <Input
                type="number"
                value={(form[field] as number | undefined) ?? 0}
                onChange={(e) => update(field, Number(e.target.value))}
              />
            </label>
          ))}
        </div>
      </Card>

      <div className="lg:col-span-2 flex justify-end">
        <Button onClick={save}>Сохранить</Button>
      </div>
    </div>
  );
}
