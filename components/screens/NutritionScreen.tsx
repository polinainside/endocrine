"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { MealCapture } from "@/components/nutrition/MealCapture";
import { NutritionInsight } from "@/components/nutrition/NutritionInsight";
import { WeekChart } from "@/components/nutrition/WeekChart";
import { RingGauge } from "@/components/ui/RingGauge";
import { useData } from "@/components/data/DataProvider";
import { useCountUp } from "@/lib/useCountUp";
import { UtensilsCrossed } from "lucide-react";
import { nutritionGoal, type DayLog, type Meal } from "@/lib/mock";

function dayTotals(d: DayLog) {
  return d.meals.reduce(
    (a, m) => ({
      kcal: a.kcal + m.kcal,
      protein: a.protein + m.protein,
      fat: a.fat + m.fat,
      carbs: a.carbs + m.carbs,
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  );
}

export function NutritionScreen() {
  const { week, addMeal } = useData();
  const [selectedId, setSelectedId] = useState("d0");

  // Добавление по фото пишется в БД (на сегодня); после — показываем сегодня.
  const handleAdd = async (meal: Omit<Meal, "id" | "photo">, photoBlob: Blob | null) => {
    await addMeal(meal, photoBlob);
    setSelectedId("d0");
  };

  const chartData = useMemo(
    () => [...week].reverse().map((d) => ({ id: d.id, short: d.short, kcal: dayTotals(d).kcal })),
    [week],
  );
  const weekAvg = Math.round(
    week.reduce((s, d) => s + dayTotals(d).kcal, 0) / Math.max(week.length, 1),
  );

  const selected = week.find((d) => d.id === selectedId) ?? week[0];
  const sel = dayTotals(selected);
  const pct = Math.min(100, Math.round((sel.kcal / nutritionGoal.kcalGoal) * 100));
  const animWeek = useCountUp(weekAvg);
  const animDay = useCountUp(sel.kcal);

  return (
    <div className="flex flex-col gap-4 stagger">
      <h1 className="text-[22px] font-semibold text-ink">Питание</h1>

      {/* Неделя: график калорий */}
      <Card>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[13px] text-muted">В среднем за неделю</p>
            <p className="text-[30px] font-light leading-tight tracking-tight text-ink">
              {animWeek}{" "}
              <span className="text-[15px] font-normal text-muted">ккал/день</span>
            </p>
          </div>
          <p className="text-[12px] text-muted">цель {nutritionGoal.kcalGoal.toLocaleString("ru-RU")}</p>
        </div>
        <div className="mt-2">
          <WeekChart data={chartData} goalKcal={nutritionGoal.kcalGoal} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </Card>

      {/* Камера → добавление в сегодняшний дневник (запись в БД + Storage) */}
      <MealCapture onAdd={handleAdd} />

      {/* Выбор дня */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {week.map((d) => {
          const active = d.id === selectedId;
          return (
            <button
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[14px] font-medium transition-colors ${
                active ? "bg-brand text-white" : "border border-border bg-surface text-muted hover:bg-brand-soft/50"
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {/* Выбранный день */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] text-muted">{selected.label}</p>
            <p className="text-[30px] font-light leading-tight tracking-tight text-ink">
              {animDay} <span className="text-[15px] font-normal text-muted">ккал</span>
            </p>
            <p className="mt-1 text-[13px] text-muted">
              Б {sel.protein} · Ж {sel.fat} · У {sel.carbs} г
            </p>
          </div>
          <RingGauge value={pct} caption="от цели" size={84} />
        </div>

        <div className="mt-3 flex flex-col gap-2.5">
          {selected.meals.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <UtensilsCrossed className="h-8 w-8 text-muted/40" strokeWidth={1.5} />
              <p className="text-[14px] text-muted">В этот день записей нет</p>
            </div>
          )}
          {selected.meals.map((meal) => (
            <div key={meal.id} className="flex items-center gap-3 rounded-card border border-border bg-surface p-3">
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
            </div>
          ))}
        </div>
      </Card>

      {/* ИИ-анализ недели × анализы */}
      <NutritionInsight week={week} />
    </div>
  );
}
