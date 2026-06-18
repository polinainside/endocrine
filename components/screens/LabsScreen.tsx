"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Plus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge, StatusDot } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { AiInterpretation } from "@/components/AiInterpretation";
import { useData } from "@/components/data/DataProvider";
import { useCountUp } from "@/lib/useCountUp";

export function LabsScreen() {
  const { labs, labOrder, addLabResult } = useData();
  const [activeKey, setActiveKey] = useState<string>(labOrder[0]);
  const [addOpen, setAddOpen] = useState(false);
  const [newDate, setNewDate] = useState(() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  });
  const [newValue, setNewValue] = useState("");
  const [savingResult, setSavingResult] = useState(false);
  const [addError, setAddError] = useState("");

  const series = labs[activeKey];
  const history = series.history;
  const last = history[history.length - 1];
  const prev = history[history.length - 2] ?? last;
  const delta = +(last.value - prev.value).toFixed(1);
  const improved = delta < 0; // для эндокринных показателей снижение = улучшение
  const animLast = useCountUp(last.value, { decimals: 1 });

  const addResult = async () => {
    const v = parseFloat(newValue.replace(",", "."));
    if (!Number.isFinite(v) || v <= 0) {
      setAddError("Введите число, например 6.4");
      return;
    }
    if (!newDate.trim()) {
      setAddError("Введите дату");
      return;
    }
    setSavingResult(true);
    setAddError("");
    try {
      await addLabResult(activeKey, newDate.trim(), v);
      setNewValue("");
      setAddOpen(false);
    } catch {
      setAddError("Не удалось сохранить. Попробуйте ещё раз.");
    }
    setSavingResult(false);
  };

  return (
    <div className="flex flex-col gap-4 stagger">
      <h1 className="text-[22px] font-semibold text-ink">Анализы и динамика</h1>

      {/* Переключатель показателя */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {labOrder.map((key) => {
          const isActive = key === activeKey;
          return (
            <button
              key={key}
              onClick={() => setActiveKey(key)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[14px] font-medium transition-colors ${
                isActive
                  ? "bg-brand text-white"
                  : "border border-border bg-surface text-muted hover:bg-brand-soft/50"
              }`}
            >
              {labs[key].title}
            </button>
          );
        })}
      </div>

      {/* Карточка последнего значения */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] font-medium text-muted">{series.title}</p>
            <div className="mt-1 flex items-end gap-1.5">
              <span className="text-[48px] font-light leading-none tracking-tight text-ink">{animLast}</span>
              <span className="mb-1.5 text-[15px] text-muted">{series.unit}</span>
            </div>
            <p className="mt-1 text-[13px] text-muted">сдано {last.date}</p>
          </div>
          <StatusBadge status={last.status} />
        </div>

        <div
          className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium ${
            improved ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"
          }`}
        >
          {improved ? (
            <ArrowDownRight className="h-4 w-4" strokeWidth={2.4} />
          ) : (
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.4} />
          )}
          {delta > 0 ? `+${delta}` : delta} {series.unit} ·{" "}
          {improved ? "улучшение" : "рост к прошлому разу"}
        </div>
      </Card>

      {/* График динамики */}
      <Card>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-ink">Динамика</h2>
          <span className="text-[12px] text-muted">{series.targetLabel}</span>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#ECE9E3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#8A847C" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#8A847C" }}
                axisLine={false}
                tickLine={false}
                width={36}
                tickFormatter={(v: number) => v.toFixed(1)}
                domain={["dataMin - 0.6", "dataMax + 0.6"]}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #ECE9E3",
                  fontSize: 12,
                  boxShadow: "0 4px 16px rgba(15,37,64,0.08)",
                }}
                labelStyle={{ color: "#8A847C" }}
                formatter={(v: number) => [`${v} ${series.unit}`, series.title]}
              />
              <ReferenceLine
                y={series.target}
                stroke="#1D9E75"
                strokeDasharray="5 4"
                strokeWidth={1.5}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#E36C39"
                strokeWidth={2.6}
                dot={{ r: 3.5, fill: "#E36C39", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ИИ-интерпретация выбранного показателя */}
      <AiInterpretation series={series} />

      {/* История */}
      <Card>
        <h2 className="text-[16px] font-semibold text-ink">История</h2>
        <ul className="mt-2 flex flex-col">
          {[...history].reverse().map((point, i) => (
            <li
              key={point.date}
              className={`flex items-center justify-between py-2.5 ${
                i !== 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="flex items-center gap-2.5">
                <StatusDot status={point.status} />
                <span className="text-[14px] text-muted">{point.date}</span>
              </div>
              <span className="text-[15px] font-medium text-ink">
                {point.value} {series.unit}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Button variant="secondary" onClick={() => setAddOpen(true)} className="w-full">
        <Plus className="h-5 w-5" />
        Добавить результат
      </Button>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={`Новый результат · ${series.title}`}>
        <div className="flex flex-col gap-3">
          <label className="block">
            <span className="mb-1 block text-[13px] text-muted">Дата (ММ.ГГГГ)</span>
            <input
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              inputMode="numeric"
              placeholder="06.2026"
              className="h-12 w-full rounded-btn border border-border bg-surface px-4 text-[15px] text-ink outline-none focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[13px] text-muted">Значение, {series.unit}</span>
            <input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              inputMode="decimal"
              placeholder={`напр. ${series.target}`}
              className="h-12 w-full rounded-btn border border-border bg-surface px-4 text-[15px] text-ink outline-none focus:border-brand"
            />
          </label>
          <p className="text-[12px] text-muted">Ориентир: {series.targetLabel}</p>
          {addError && <p className="rounded-btn bg-alarm-soft px-3 py-2 text-[13px] text-alarm">{addError}</p>}
          <Button onClick={addResult} disabled={savingResult} className="w-full">
            {savingResult ? <Loader2 className="h-5 w-5 animate-spin" /> : "Добавить"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
