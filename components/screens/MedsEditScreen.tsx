"use client";

import { useState } from "react";
import { ArrowLeft, Plus, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useData } from "@/components/data/DataProvider";
import type { Med } from "@/lib/mock";

const inputCls =
  "h-11 w-full rounded-btn border border-border bg-surface px-3 text-[15px] text-ink outline-none focus:border-brand";

export function MedsEditScreen({ onBack }: { onBack: () => void }) {
  const { meds, saveMeds } = useData();
  const [list, setList] = useState<Med[]>(meds.map((m) => ({ ...m })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (id: string, field: "name" | "dose" | "time", value: string) =>
    setList((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));

  const remove = (id: string) => setList((prev) => prev.filter((m) => m.id !== id));

  const add = () =>
    setList((prev) => [
      ...prev,
      { id: `tmp-${crypto.randomUUID()}`, name: "", dose: "", time: "", taken: false },
    ]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await saveMeds(list.filter((m) => m.name.trim()));
      onBack();
    } catch {
      setError("Не удалось сохранить. Попробуйте ещё раз.");
      setSaving(false);
    }
  };

  return (
    <div className="-mx-4 -mt-4 flex h-full flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur">
        <button onClick={onBack} aria-label="Назад" className="text-muted" disabled={saving}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[17px] font-semibold text-ink">Препараты</h1>
      </header>

      <div className="flex flex-col gap-3 px-4 pb-6 pt-4">
        {list.length === 0 && (
          <p className="py-4 text-center text-[14px] text-muted">Список пуст — добавьте препарат</p>
        )}

        {list.map((m) => (
          <div key={m.id} className="rounded-card border border-border bg-surface p-3">
            <div className="flex items-center gap-2">
              <input
                className={`${inputCls} flex-1`}
                value={m.name}
                onChange={(e) => setField(m.id, "name", e.target.value)}
                placeholder="Название"
              />
              <button
                type="button"
                onClick={() => remove(m.id)}
                aria-label="Удалить"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                className={`${inputCls} flex-1`}
                value={m.dose}
                onChange={(e) => setField(m.id, "dose", e.target.value)}
                placeholder="Доза (1000 мг)"
              />
              <input
                className={`${inputCls} w-24`}
                value={m.time}
                onChange={(e) => setField(m.id, "time", e.target.value)}
                placeholder="09:00"
                inputMode="numeric"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 self-start text-[14px] font-medium text-brand"
        >
          <Plus className="h-4 w-4" /> Добавить препарат
        </button>

        {error && <p className="rounded-btn bg-alarm-soft px-3 py-2 text-[13px] text-alarm">{error}</p>}

        <Button onClick={save} disabled={saving} className="mt-1 w-full">
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Check className="h-5 w-5" />
              Сохранить
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
