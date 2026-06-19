"use client";

import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RingGauge } from "@/components/ui/RingGauge";
import { glucoseNow, glucoseSeries } from "@/lib/mock";

type Period = "day" | "week" | "month";
const periods: { key: Period; label: string }[] = [
  { key: "day", label: "День" },
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
];

function GlowDot({
  cx,
  cy,
  index,
  lastIdx,
}: {
  cx?: number;
  cy?: number;
  index?: number;
  lastIdx?: number;
}) {
  if (index !== lastIdx || typeof cx !== "number" || typeof cy !== "number") return <g />;
  return (
    <g>
      <circle cx={cx} cy={cy} r={11} fill="#E36C39" opacity={0.16} />
      <circle cx={cx} cy={cy} r={5} fill="#E36C39" stroke="#fff" strokeWidth={1.5} />
    </g>
  );
}

export function GlucoseDetailScreen({ onBack }: { onBack: () => void }) {
  const [period, setPeriod] = useState<Period>("day");
  const data = glucoseSeries[period];
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = (values.reduce((s, v) => s + v, 0) / values.length).toFixed(1);

  return (
    <div className="-mx-4 -mt-4 flex h-full flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-bg px-4 py-3">
        <button onClick={onBack} aria-label="Назад" className="text-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[17px] font-semibold text-ink">Глюкоза</h1>
      </header>

      <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
        {/* Текущее значение + кольцо TIR */}
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-muted">Сейчас</p>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-[52px] font-light leading-none tracking-tight text-ink">
                  {glucoseNow.value}
                </span>
                <span className="mb-1.5 text-[15px] text-muted">{glucoseNow.unit}</span>
              </div>
              <p className="mt-2 text-[12px] text-muted">датчик {glucoseNow.source}</p>
            </div>
            <div className="flex flex-col items-center">
              <RingGauge value={glucoseNow.timeInRange} caption="в норме" />
              <span className="mt-1.5 text-[11px] text-muted">в диапазоне</span>
            </div>
          </div>
        </Card>

        {/* Переключатель периода */}
        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex-1 rounded-btn py-2.5 text-[14px] font-medium transition-colors ${
                period === p.key
                  ? "bg-ink text-white"
                  : "border border-border bg-surface text-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* График периода */}
        <Card>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gluDetailFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E36C39" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#E36C39" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8A847C" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#8A847C" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                  domain={["dataMin - 0.5", "dataMax + 0.5"]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #ECE9E3",
                    fontSize: 12,
                    boxShadow: "0 6px 20px rgba(33,31,29,0.08)",
                  }}
                  labelStyle={{ color: "#8A847C" }}
                  formatter={(v: number) => [`${v} ммоль/л`, ""]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#E36C39"
                  strokeWidth={2.5}
                  fill="url(#gluDetailFill)"
                  dot={<GlowDot lastIdx={data.length - 1} />}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Статистика периода */}
        <div className="flex gap-3">
          {[
            { label: "Мин", value: min },
            { label: "Среднее", value: avg },
            { label: "Макс", value: max },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-1 flex-col items-center rounded-card border border-border bg-gradient-to-b from-white to-raised py-3 shadow-card"
            >
              <span className="text-[22px] font-light tracking-tight text-ink">{s.value}</span>
              <span className="text-[12px] text-muted">{s.label}</span>
            </div>
          ))}
        </div>

        <p className="px-1 text-center text-[11px] leading-relaxed text-muted">
          ммоль/л · данные поступают с датчика {glucoseNow.source}
        </p>
      </div>
    </div>
  );
}
