"use client";

import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";

export type WeekBar = { id: string; short: string; kcal: number };

// Столбики калорий по дням (хронологически) + пунктир цели. Клик по столбику выбирает день.
export function WeekChart({
  data,
  goalKcal,
  selectedId,
  onSelect,
}: {
  data: WeekBar[];
  goalKcal: number;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="22%">
          <XAxis
            dataKey="short"
            tick={{ fontSize: 11, fill: "#5B6B7F" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={[0, "dataMax + 200"]} />
          <ReferenceLine
            y={goalKcal}
            stroke="#1D9E75"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            ifOverflow="extendDomain"
          />
          <Bar
            dataKey="kcal"
            radius={[6, 6, 0, 0]}
            onClick={(d: { id?: string }) => d?.id && onSelect(d.id)}
            cursor="pointer"
          >
            {data.map((d) => (
              <Cell
                key={d.id}
                fill={d.id === selectedId ? "#1E6FD9" : d.kcal > goalKcal ? "#E0A800" : "#9DC3F0"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
