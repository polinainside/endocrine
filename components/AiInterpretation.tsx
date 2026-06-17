"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Minus,
  RotateCcw,
  Info,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { patient, type LabSeries } from "@/lib/mock";
import type { InterpretResult } from "@/lib/ai";

type Phase = "idle" | "loading" | "done" | "error";

const trendMeta: Record<InterpretResult["trend"], { icon: LucideIcon; label: string; cls: string }> = {
  improving: { icon: TrendingDown, label: "динамика к улучшению", cls: "bg-ok-soft text-ok" },
  worsening: { icon: TrendingUp, label: "динамика к ухудшению", cls: "bg-warn-soft text-warn" },
  stable: { icon: Minus, label: "динамика стабильна", cls: "bg-brand-soft text-brand" },
};

export function AiInterpretation({ series }: { series: LabSeries }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<InterpretResult | null>(null);
  const [error, setError] = useState<string>("");

  // При смене показателя сбрасываем прошлую интерпретацию — она была про другой анализ.
  useEffect(() => {
    setPhase("idle");
    setResult(null);
    setError("");
  }, [series.key]);

  const run = async () => {
    setPhase("loading");
    setError("");
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lab: {
            title: series.title,
            unit: series.unit,
            targetLabel: series.targetLabel,
            history: series.history,
          },
          patient: {
            age: patient.age,
            sex: patient.sex,
            diagnoses: patient.diagnoses.map((d) => `${d.title} (${d.code})`),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Не удалось получить интерпретацию.");
        setPhase("error");
        return;
      }
      setResult(data as InterpretResult);
      setPhase("done");
    } catch {
      setError("Нет связи с сервером. Проверьте подключение и повторите.");
      setPhase("error");
    }
  };

  const TrendIcon = result ? trendMeta[result.trend].icon : Minus;

  return (
    <Card className="border-brand/15 bg-brand-soft/30">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand" strokeWidth={2.2} />
        <h2 className="text-[16px] font-semibold text-ink">ИИ-интерпретация</h2>
      </div>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">
        Объяснит показатель {series.title} простыми словами и подскажет, на что обратить внимание.
      </p>

      {phase === "idle" && (
        <Button onClick={run} className="mt-3 w-full">
          <Sparkles className="h-5 w-5" />
          Объяснить простыми словами
        </Button>
      )}

      {phase === "loading" && (
        <div className="mt-3 flex flex-col gap-2" aria-busy="true">
          <div className="flex items-center gap-2 text-[14px] text-muted">
            <Sparkles className="h-4 w-4 animate-pulse text-brand" />
            Анализируем динамику…
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

      {phase === "done" && result && (
        <div className="mt-3 animate-fade-in">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${trendMeta[result.trend].cls}`}
          >
            <TrendIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
            {trendMeta[result.trend].label}
          </span>

          {result.summary && (
            <p className="mt-3 text-[14px] leading-relaxed text-ink/90">{result.summary}</p>
          )}

          {result.tips.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {result.tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-[14px] leading-relaxed text-ink/90">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {tip}
                </li>
              ))}
            </ul>
          )}

          {result.seeDoctor && (
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
            Сгенерировать заново
          </button>
        </div>
      )}

      {/* Постоянный дисклеймер: это не диагноз и не назначение. */}
      <p className="mt-3 flex items-start gap-1.5 border-t border-brand/15 pt-3 text-[11px] leading-relaxed text-muted">
        <Info className="mt-px h-3.5 w-3.5 shrink-0" />
        Не диагноз и не назначение лечения. Это пояснение на основе ваших данных — окончательные
        решения принимает лечащий врач.
      </p>
    </Card>
  );
}
