"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { MealCapture } from "@/components/nutrition/MealCapture";
import { NutritionInsight } from "@/components/nutrition/NutritionInsight";
import { WeekChart } from "@/components/nutrition/WeekChart";
import { useData } from "@/components/data/DataProvider";
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
  const isToday = selected.id === "d0";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[22px] font-semibold text-ink">Питание</h1>

      {/* Неделя: график калорий */}
      <Card>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[13px] text-muted">В среднем за неделю</p>
            <p className="text-[30px] font-light leading-tight tracking-tight text-ink">
              {weekAvg.toLocaleString("ru-RU")}{" "}
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
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[13px] text-muted">{selected.label}</p>
            <p className="text-[30px] font-light leading-tight tracking-tight text-ink">
              {sel.kcal.toLocaleString("ru-RU")}{" "}
              <span className="text-[15px] font-normal text-muted">
                {isToday ? `/ ${nutritionGoal.kcalGoal.toLocaleString("ru-RU")} ` : ""}ккал
              </span>
            </p>
          </div>
          <div className="text-right text-[13px] text-muted">
            <p>Б {sel.protein} · Ж {sel.fat}</p>
            <p>Углеводы {sel.carbs} г</p>
          </div>
        </div>
        {isToday && (
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-brand-soft">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2.5">
          {selected.meals.length === 0 && (
            <p className="py-4 text-center text-[14px] text-muted">Записей пока нет</p>
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
