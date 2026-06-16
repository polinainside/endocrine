"use client";

import { useState } from "react";
import { Camera, Loader2, Plus, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { meals as seedMeals, nutritionGoal, recognizeMeal, type Meal } from "@/lib/mock";

type Phase = "idle" | "capturing" | "result" | "added";

export function NutritionScreen() {
  const [meals, setMeals] = useState<Meal[]>(seedMeals);
  const [phase, setPhase] = useState<Phase>("idle");
  const [recognized, setRecognized] = useState<Meal | null>(null);

  const eaten = meals.reduce((sum, m) => sum + m.kcal, 0);
  const carbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const pct = Math.min(100, Math.round((eaten / nutritionGoal.kcalGoal) * 100));

  const handleCapture = async () => {
    setPhase("capturing");
    setRecognized(null);
    const meal = await recognizeMeal();
    setRecognized(meal);
    setPhase("result");
  };

  const handleAdd = () => {
    if (!recognized) return;
    setMeals((prev) => [recognized, ...prev]);
    setPhase("added");
    setTimeout(() => {
      setPhase("idle");
      setRecognized(null);
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
      <Button onClick={handleCapture} disabled={phase === "capturing"} className="w-full">
        <Camera className="h-5 w-5" />
        Сфотографировать еду
      </Button>

      {/* Карточка распознавания */}
      {phase !== "idle" && (
        <Card className="animate-fade-in">
          {/* «Фотография» блюда — цветной плейсхолдер с эмодзи */}
          <div className="flex h-40 items-center justify-center rounded-btn bg-gradient-to-br from-brand-soft to-ok-soft text-6xl">
            {recognized?.emoji ?? "🍽️"}
          </div>

          {phase === "capturing" && (
            <div className="mt-4 flex items-center justify-center gap-2 text-muted">
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
              <span className="text-[14px]">Анализируем блюдо…</span>
            </div>
          )}

          {(phase === "result" || phase === "added") && recognized && (
            <div className="mt-4 animate-fade-in">
              <p className="text-[13px] font-medium text-muted">Распознано</p>
              <p className="text-[17px] font-semibold text-ink">{recognized.name}</p>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "ккал", value: recognized.kcal },
                  { label: "белки", value: `${recognized.protein} г` },
                  { label: "жиры", value: `${recognized.fat} г` },
                  { label: "углев.", value: `${recognized.carbs} г` },
                ].map((cell) => (
                  <div key={cell.label} className="rounded-btn bg-bg py-2">
                    <p className="text-[15px] font-semibold text-ink">{cell.value}</p>
                    <p className="text-[11px] text-muted">{cell.label}</p>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleAdd}
                disabled={phase === "added"}
                className="mt-4 w-full"
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
                    Добавить в дневник
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
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-btn bg-bg text-2xl">
                {meal.emoji}
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
    </div>
  );
}
