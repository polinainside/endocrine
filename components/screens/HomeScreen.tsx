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
  ChevronRight,
  Sparkles,
  Scale,
  Footprints,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricTile } from "@/components/ui/MetricTile";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { useData } from "@/components/data/DataProvider";
import { aiHint, glucoseNow, glucoseToday, type Trend } from "@/lib/mock";

const trendIcon: Record<Trend, LucideIcon> = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: ArrowRight,
};

const todayLabel = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
}).format(new Date("2026-06-03T09:00:00"));

export function HomeScreen() {
  const { patient, meds, toggleMed } = useData();
  const [profileOpen, setProfileOpen] = useState(false);
  const TrendIcon = trendIcon[glucoseNow.trend];

  if (profileOpen) {
    return <ProfileScreen onBack={() => setProfileOpen(false)} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Шапка */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold leading-tight text-ink">
            Здравствуйте, {patient.name}
          </h1>
          <p className="text-[13px] capitalize text-muted">{todayLabel}, сегодня</p>
        </div>
        <button
          onClick={() => setProfileOpen(true)}
          aria-label="Личный кабинет"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-[15px] font-semibold text-brand transition-transform active:scale-95"
        >
          {patient.initials}
        </button>
      </header>

      {/* Карточка глюкозы */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] font-medium text-muted">Глюкоза сейчас</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-[40px] font-bold leading-none text-ink">
                {glucoseNow.value}
              </span>
              <span className="mb-1 text-[15px] text-muted">{glucoseNow.unit}</span>
              <TrendIcon className="mb-1.5 h-5 w-5 text-ok" strokeWidth={2.4} />
            </div>
          </div>
          <StatusBadge status={glucoseNow.status} />
        </div>

        {/* Живой индикатор автоматического датчика → ведёт в кабинет к описанию */}
        <button
          onClick={() => setProfileOpen(true)}
          className="mt-1.5 flex w-full items-center gap-2 text-left text-[12px] text-muted transition-colors hover:text-ink"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
          </span>
          <span>
            Датчик {glucoseNow.source} · подключён · обновлено {glucoseNow.agoMin} мин назад
          </span>
          <ChevronRight className="ml-auto h-4 w-4 shrink-0" />
        </button>

        {/* Мини-график за день */}
        <div className="-mx-1 mt-3 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={glucoseToday} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="glucoseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E6FD9" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#1E6FD9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={[4, 9]} hide />
              <Tooltip
                cursor={{ stroke: "#E3EAF2" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E3EAF2",
                  fontSize: 12,
                  boxShadow: "0 4px 16px rgba(15,37,64,0.08)",
                }}
                labelStyle={{ color: "#5B6B7F" }}
                formatter={(v: number) => [`${v} ммоль/л`, ""]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#1E6FD9"
                strokeWidth={2.5}
                fill="url(#glucoseFill)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex items-center justify-between rounded-btn bg-brand-soft/60 px-3 py-2">
          <span className="text-[13px] text-muted">Время в целевом диапазоне сегодня</span>
          <span className="text-[15px] font-semibold text-brand">{glucoseNow.timeInRange}%</span>
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
        <h2 className="text-[16px] font-semibold text-ink">Приём препаратов сегодня</h2>
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
