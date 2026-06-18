"use client";

import { useState } from "react";
import {
  Sparkles,
  Stethoscope,
  CheckCircle2,
  TriangleAlert,
  RotateCcw,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { labOrder, labs, nutritionGoal, patient, type DayLog } from "@/lib/mock";
import type { LabSnapshot, NutritionInsight as Insight } from "@/lib/ai";

type Phase = "idle" | "loading" | "done" | "error";

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

// Снимок анализов для модели: последнее значение + направление динамики.
function labSnapshots(): LabSnapshot[] {
  return labOrder.map((key) => {
    const s = labs[key];
    const h = s.history;
    const last = h[h.length - 1];
    const prev = h[h.length - 2] ?? last;
    let trend: LabSnapshot["trend"] = "stable";
    if (key !== "tsh") {
      // Для этих маркеров ниже — лучше.
      if (last.value < prev.value) trend = "improving";
      else if (last.value > prev.value) trend = "worsening";
    }
    return { title: s.title, unit: s.unit, latest: last.value, target: s.targetLabel, trend };
  });
}

export function NutritionInsight({ week }: { week: DayLog[] }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [data, setData] = useState<Insight | null>(null);
  const [error, setError] = useState("");

  const run = async () => {
    setPhase("loading");
    setError("");
    try {
      const res = await fetch("/api/nutrition-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalKcal: nutritionGoal.kcalGoal,
          days: week.map((d) => ({ label: d.label, ...dayTotals(d) })),
          labs: labSnapshots(),
          patient: {
            age: patient.age,
            sex: patient.sex,
            diagnoses: patient.diagnoses.map((d) => `${d.title} (${d.code})`),
          },
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.message || "Не удалось получить анализ.");
        setPhase("error");
        return;
      }
      setData(body as Insight);
      setPhase("done");
    } catch {
      setError("Нет связи с сервером. Проверьте подключение и повторите.");
      setPhase("error");
    }
  };

  return (
    <Card className="border-brand/15 bg-brand-soft/30">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand" strokeWidth={2.2} />
        <h2 className="text-[16px] font-semibold text-ink">ИИ-анализ питания и анализов</h2>
      </div>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">
        Сопоставит ваше питание за неделю с динамикой анализов и подскажет, на что обратить внимание.
      </p>

      {phase === "idle" && (
        <Button onClick={run} className="mt-3 w-full">
          <Sparkles className="h-5 w-5" />
          Проанализировать неделю
        </Button>
      )}

      {phase === "loading" && (
        <div className="mt-3 flex flex-col gap-2" aria-busy="true">
          <div className="flex items-center gap-2 text-[14px] text-muted">
            <Sparkles className="h-4 w-4 animate-pulse text-brand" />
            Сопоставляем питание и анализы…
          </div>
          <div className="space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded-full bg-brand-soft" />
            <div className="h-3 w-full animate-pulse rounded-full bg-brand-soft" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-brand-soft" />
          </div>
        </div>
      )}

      {phase === "error" && (
        <div className="mt-3">
          <p className="rounded-btn bg-alarm-soft px-3 py-2 text-[13px] text-alarm">{error}</p>
          <Button variant="secondary" onClick={run} className="mt-2 w-full">
            <RotateCcw className="h-5 w-5" />
            Повторить
          </Button>
        </div>
      )}

      {phase === "done" && data && (
        <div className="mt-3 animate-fade-in">
          {data.summary && (
            <p className="text-[14px] leading-relaxed text-ink/90">{data.summary}</p>
          )}

          {data.links.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {data.links.map((l, i) => (
                <li key={i} className="flex gap-2 text-[14px] leading-relaxed text-ink/90">
                  {l.tone === "good" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                  ) : (
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
                  )}
                  {l.text}
                </li>
              ))}
            </ul>
          )}

          {data.tips.length > 0 && (
            <div className="mt-3 border-t border-brand/15 pt-3">
              <p className="mb-1.5 text-[13px] font-medium text-muted">Советы</p>
              <ul className="flex flex-col gap-2">
                {data.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-[14px] leading-relaxed text-ink/90">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.seeDoctor && (
            <div className="mt-3 flex items-center gap-2 rounded-btn bg-warn-soft/70 p-3">
              <Stethoscope className="h-4 w-4 shrink-0 text-warn" />
              <span className="text-[13px] text-ink/80">
                Стоит обсудить эти показатели с лечащим врачом.
              </span>
            </div>
          )}

          <button
            onClick={run}
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand"
          >
            <RotateCcw className="h-4 w-4" />
            Проанализировать заново
          </button>
        </div>
      )}

      <p className="mt-3 flex items-start gap-1.5 border-t border-brand/15 pt-3 text-[11px] leading-relaxed text-muted">
        <Info className="mt-px h-3.5 w-3.5 shrink-0" />
        Не диагноз и не назначение лечения. Это пояснение на основе ваших данных — решения принимает
        лечащий врач.
      </p>
    </Card>
  );
}
