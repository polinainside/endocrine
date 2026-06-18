"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Sparkles,
  Scale,
  Footprints,
  CalendarClock,
  Pencil,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricTile } from "@/components/ui/MetricTile";
import { RingGauge } from "@/components/ui/RingGauge";
import { MedsEditScreen } from "@/components/screens/MedsEditScreen";
import { useData } from "@/components/data/DataProvider";
import { aiHint, glucoseNow, glucoseToday, type Trend } from "@/lib/mock";

const trendIcon: Record<Trend, LucideIcon> = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: ArrowRight,
};

// «Живая» точка в конце кривой глюкозы — мягкое свечение + точка с белой обводкой.
const GLUCOSE_LAST = glucoseToday.length - 1;
function GlucoseDot({ cx, cy, index }: { cx?: number; cy?: number; index?: number }) {
  if (index !== GLUCOSE_LAST || typeof cx !== "number" || typeof cy !== "number") return <g />;
  return (
    <g>
      <circle cx={cx} cy={cy} r={11} fill="#E36C39" opacity={0.16} />
      <circle cx={cx} cy={cy} r={5} fill="#E36C39" stroke="#fff" strokeWidth={1.5} />
    </g>
  );
}

const todayLabel = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
}).format(new Date("2026-06-03T09:00:00"));

export function HomeScreen() {
  const { patient, meds, toggleMed } = useData();
  const [medsEditOpen, setMedsEditOpen] = useState(false);
  const TrendIcon = trendIcon[glucoseNow.trend];

  if (medsEditOpen) return <MedsEditScreen onBack={() => setMedsEditOpen(false)} />;

  return (
    <div className="flex flex-col gap-4">
      {/* Шапка */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[14px] capitalize text-muted">{todayLabel}</p>
          <h1 className="mt-0.5 text-[25px] font-semibold leading-tight text-ink">
            Здравствуйте, {patient.name}
          </h1>
        </div>
      </header>

      {/* Карточка глюкозы — герой-блок */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-muted">Глюкоза сейчас</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-[56px] font-light leading-none tracking-tight text-ink">
                {glucoseNow.value}
              </span>
              <span className="mb-1.5 text-[15px] text-muted">{glucoseNow.unit}</span>
              <TrendIcon className="mb-1.5 h-5 w-5 text-ok" strokeWidth={2.4} />
            </div>
            <div className="mt-2.5">
              <StatusBadge status={glucoseNow.status} />
            </div>
          </div>
          {/* Кольцо «время в целевом диапазоне» */}
          <div className="flex flex-col items-center">
            <RingGauge value={glucoseNow.timeInRange} caption="в норме" />
            <span className="mt-1.5 text-[11px] leading-tight text-muted">в диапазоне</span>
          </div>
        </div>

        {/* Живой индикатор автоматического датчика */}
        <div className="mt-1.5 flex w-full items-center gap-2 text-[12px] text-muted">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
          </span>
          <span>
            Датчик {glucoseNow.source} · подключён · обновлено {glucoseNow.agoMin} мин назад
          </span>
        </div>

        {/* Мини-график за день */}
        <div className="-mx-1 mt-3 h-28">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={glucoseToday} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="glucoseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E36C39" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#E36C39" stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={[4, 9]} hide />
              <Tooltip
                cursor={{ stroke: "#ECE9E3" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #ECE9E3",
                  fontSize: 12,
                  boxShadow: "0 4px 16px rgba(15,37,64,0.08)",
                }}
                labelStyle={{ color: "#8A847C" }}
                formatter={(v: number) => [`${v} ммоль/л`, ""]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#E36C39"
                strokeWidth={2.5}
                fill="url(#glucoseFill)"
                dot={<GlucoseDot />}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ИИ-подсказка */}
      <div className="flex gap-3 rounded-card border border-brand/15 bg-brand-soft/50 p-4">
        <Sparkles className="h-5 w-5 shrink-0 text-brand" strokeWidth={2.2} />
        <p className="text-[14px] leading-relaxed text-ink/90">{aiHint.text}</p>
      </div>

      {/* Ряд мини-метрик */}
      <div className="flex gap-3">
        <MetricTile
          icon={Scale}
          label="Вес"
          value={`${patient.weight} кг`}
          source={patient.weightSource}
        />
        <MetricTile
          icon={Footprints}
          label="Шаги сегодня"
          value={patient.steps.toLocaleString("ru-RU")}
          source={patient.stepsSource}
        />
        <MetricTile
          icon={CalendarClock}
          label="Ближайший анализ"
          value={`${patient.nextLabInDays} дн.`}
        />
      </div>

      {/* Приём препаратов */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-ink">Приём препаратов сегодня</h2>
          <button
            onClick={() => setMedsEditOpen(true)}
            className="inline-flex items-center gap-1 text-[13px] font-medium text-brand"
          >
            <Pencil className="h-3.5 w-3.5" />
            Изменить
          </button>
        </div>
        <ul className="mt-3 flex flex-col gap-2.5">
          {meds.map((med) => (
            <li key={med.id} className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-medium text-ink">{med.name}</p>
                <p className="text-[13px] text-muted">
                  {med.dose} · {med.time}
                </p>
              </div>
              <button
                onClick={() => toggleMed(med.id)}
                className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors ${
                  med.taken
                    ? "bg-ok-soft text-ok"
                    : "border border-brand/40 text-brand hover:bg-brand-soft"
                }`}
              >
                {med.taken ? (
                  <>
                    <Check className="h-4 w-4" strokeWidth={2.6} />
                    принято
                  </>
                ) : (
                  "отметить"
                )}
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
