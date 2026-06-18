"use client";

import { useState } from "react";
import { Camera, Loader2, Plus, Check, RotateCcw, ImageOff, Sparkles, Minus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CameraCapture } from "@/components/CameraCapture";
import { meals as seedMeals, nutritionGoal, type Meal } from "@/lib/mock";
import type { Confidence, MealComponent, RecognizeResponse } from "@/lib/ai";

type Phase = "idle" | "recognizing" | "result" | "added" | "error";

const confidenceMeta: Record<Confidence, { label: string; cls: string }> = {
  low: { label: "низкая точность", cls: "bg-warn-soft text-warn" },
  medium: { label: "средняя точность", cls: "bg-brand-soft text-brand" },
  high: { label: "высокая точность", cls: "bg-ok-soft text-ok" },
};

const nowTime = () =>
  new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date());

const r = (n: number) => Math.round(n);

// Суммарная пищевая ценность с учётом отредактированных граммов.
function totalsOf(items: MealComponent[]) {
  return items.reduce(
    (acc, it) => {
      const k = it.grams / 100;
      acc.kcal += it.per100.kcal * k;
      acc.protein += it.per100.protein * k;
      acc.fat += it.per100.fat * k;
      acc.carbs += it.per100.carbs * k;
      return acc;
    },
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  );
}

export function NutritionScreen() {
  const [meals, setMeals] = useState<Meal[]>(seedMeals);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<RecognizeResponse | null>(null);
  const [items, setItems] = useState<MealComponent[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const eaten = meals.reduce((sum, m) => sum + m.kcal, 0);
  const carbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const pct = Math.min(100, Math.round((eaten / nutritionGoal.kcalGoal) * 100));

  const totals = totalsOf(items);
  const usesUsda = items.some((i) => i.source === "usda");

  const recognize = async (dataUrl: string) => {
    setPhase("recognizing");
    setResult(null);
    setItems([]);
    setErrorMsg("");
    try {
      const res = await fetch("/api/recognize-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.message || "Не удалось распознать фото.");
        setPhase("error");
        return;
      }
      const meal = data as RecognizeResponse;
      if (!meal.isFood || meal.items.length === 0) {
        setErrorMsg("На фото не удалось распознать еду. Попробуйте снять блюдо крупнее.");
        setPhase("error");
        return;
      }
      setResult(meal);
      setItems(meal.items);
      setPhase("result");
    } catch {
      setErrorMsg("Нет связи с сервером. Проверьте подключение и повторите.");
      setPhase("error");
    }
  };

  const handleCaptured = (dataUrl: string) => {
    setCameraOpen(false);
    setPhoto(dataUrl);
    recognize(dataUrl);
  };

  const setGrams = (idx: number, grams: number) =>
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, grams: Math.max(0, Math.min(3000, grams)) } : it)),
    );

  const handleAdd = () => {
    if (!result) return;
    const meal: Meal = {
      id: `meal-${Date.now()}`,
      name: result.dish,
      kcal: r(totals.kcal),
      protein: r(totals.protein),
      fat: r(totals.fat),
      carbs: r(totals.carbs),
      time: nowTime(),
      emoji: "🍽️",
      photo: photo ?? undefined,
    };
    setMeals((prev) => [meal, ...prev]);
    setPhase("added");
    setTimeout(() => {
      setPhase("idle");
      setResult(null);
      setItems([]);
      setPhoto(null);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Заголовок + сводка дня */}
      <div>
        <h1 className="text-[22px] font-semibold text-ink">Питание</h1>
        <Card className="mt-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[13px] text-muted">Сегодня</p>
              <p className="text-[22px] font-semibold leading-tight text-ink">
                {eaten.toLocaleString("ru-RU")}{" "}
                <span className="text-[15px] font-normal text-muted">
                  / {nutritionGoal.kcalGoal.toLocaleString("ru-RU")} ккал
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[13px] text-muted">Углеводы</p>
              <p className="text-[17px] font-semibold text-ink">{carbs} г</p>
            </div>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-brand-soft">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </Card>
      </div>

      {/* CTA фотографирования */}
      <Button onClick={() => setCameraOpen(true)} disabled={phase === "recognizing"} className="w-full">
        <Camera className="h-5 w-5" />
        Сфотографировать еду
      </Button>

      {/* Карточка распознавания */}
      {phase !== "idle" && (
        <Card className="animate-fade-in">
          {/* Снятое фото */}
          <div className="relative h-40 overflow-hidden rounded-btn bg-bg">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Снятое блюдо" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl">🍽️</div>
            )}
            {phase === "recognizing" && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink/40 backdrop-blur-[1px]">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
                <span className="text-[14px] font-medium text-white">Распознаём блюдо…</span>
              </div>
            )}
          </div>

          {phase === "error" && (
            <div className="mt-4">
              <div className="flex items-center gap-2 rounded-btn bg-alarm-soft px-3 py-2 text-[13px] text-alarm">
                <ImageOff className="h-4 w-4 shrink-0" />
                {errorMsg}
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" onClick={() => photo && recognize(photo)} className="flex-1">
                  <RotateCcw className="h-5 w-5" />
                  Ещё раз
                </Button>
                <Button onClick={() => setCameraOpen(true)} className="flex-1">
                  <Camera className="h-5 w-5" />
                  Переснять
                </Button>
              </div>
            </div>
          )}

          {(phase === "result" || phase === "added") && result && (
            <div className="mt-4 animate-fade-in">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
                    <Sparkles className="h-3.5 w-3.5 text-brand" />
                    Распознано ИИ
                  </p>
                  <p className="truncate text-[17px] font-semibold text-ink">{result.dish}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium ${confidenceMeta[result.confidence].cls}`}
                >
                  {confidenceMeta[result.confidence].label}
                </span>
              </div>

              {/* Итоговая ценность (пересчитывается при правке граммов) */}
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "ккал", value: r(totals.kcal) },
                  { label: "белки", value: `${r(totals.protein)} г` },
                  { label: "жиры", value: `${r(totals.fat)} г` },
                  { label: "углев.", value: `${r(totals.carbs)} г` },
                ].map((cell) => (
                  <div key={cell.label} className="rounded-btn bg-bg py-2">
                    <p className="text-[15px] font-semibold text-ink">{cell.value}</p>
                    <p className="text-[11px] text-muted">{cell.label}</p>
                  </div>
                ))}
              </div>

              {/* Компоненты с редактируемым весом */}
              <div className="mt-3 flex flex-col divide-y divide-border">
                {items.map((it, idx) => (
                  <ComponentRow
                    key={idx}
                    item={it}
                    kcal={r((it.per100.kcal * it.grams) / 100)}
                    disabled={phase === "added"}
                    onChange={(g) => setGrams(idx, g)}
                  />
                ))}
              </div>

              <p className="mt-3 text-[11px] leading-relaxed text-muted">
                {usesUsda
                  ? "Ккал на 100 г — из базы USDA. Вес оценён ИИ по фото — поправьте граммы, если нужно."
                  : "≈ Оценка ИИ (база не нашла совпадений). Вес и ккал можно поправить."}
              </p>

              <Button
                onClick={handleAdd}
                disabled={phase === "added"}
                className="mt-3 w-full"
                variant={phase === "added" ? "secondary" : "primary"}
              >
                {phase === "added" ? (
                  <>
                    <Check className="h-5 w-5 text-ok" strokeWidth={2.6} />
                    Добавлено в дневник
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Добавить · {r(totals.kcal)} ккал
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Лента приёмов пищи */}
      <div>
        <h2 className="mb-2 text-[16px] font-semibold text-ink">Приёмы пищи сегодня</h2>
        <div className="flex flex-col gap-2.5">
          {meals.map((meal) => (
            <Card key={meal.id} className="flex items-center gap-3 py-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-btn bg-bg text-2xl">
                {meal.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={meal.photo} alt={meal.name} className="h-full w-full object-cover" />
                ) : (
                  meal.emoji
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-ink">{meal.name}</p>
                <p className="text-[13px] text-muted">{meal.time}</p>
              </div>
              <span className="shrink-0 text-[15px] font-semibold text-ink">{meal.kcal} ккал</span>
            </Card>
          ))}
        </div>
      </div>

      {/* Полноэкранная камера */}
      {cameraOpen && (
        <CameraCapture onCapture={handleCaptured} onClose={() => setCameraOpen(false)} />
      )}
    </div>
  );
}

// Строка компонента: название + источник, степпер веса, ккал компонента.
function ComponentRow({
  item,
  kcal,
  disabled,
  onChange,
}: {
  item: MealComponent;
  kcal: number;
  disabled: boolean;
  onChange: (grams: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-ink">{item.name}</p>
        <p className="truncate text-[11px] text-muted">
          {item.source === "usda" ? (
            <>
              USDA{item.matchedName ? `: ${item.matchedName}` : ""}
            </>
          ) : (
            "оценка ИИ"
          )}
        </p>
      </div>

      {/* Степпер веса */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(item.grams - 10)}
          disabled={disabled}
          aria-label="Меньше"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <div className="flex w-14 items-center justify-center gap-0.5">
          <input
            type="number"
            inputMode="numeric"
            value={item.grams}
            disabled={disabled}
            onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
            className="w-9 bg-transparent text-right text-[14px] font-semibold text-ink outline-none [appearance:textfield] disabled:opacity-60 [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-[12px] text-muted">г</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(item.grams + 10)}
          disabled={disabled}
          aria-label="Больше"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <span className="w-16 shrink-0 text-right text-[14px] font-semibold text-ink">{kcal} ккал</span>
    </div>
  );
}
