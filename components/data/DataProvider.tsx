"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import {
  loadAppData,
  insertMeal,
  setMedTaken,
  updateProfile,
  saveMeds as persistMeds,
  updateLabHistory,
  type AppData,
  type Patient,
} from "@/lib/supabase/data";
import type { Meal, Med, Status } from "@/lib/mock";

type DataContextValue = AppData & {
  addMeal: (meal: Omit<Meal, "id" | "photo">, photoBlob: Blob | null) => Promise<void>;
  toggleMed: (id: string) => Promise<void>;
  saveProfile: (patient: Patient) => Promise<void>;
  saveMeds: (meds: Med[]) => Promise<void>;
  addLabResult: (key: string, date: string, value: number) => Promise<void>;
  signOut: () => Promise<void>;
};

// Диапазонные показатели (норма в интервале). Остальные — «ниже = лучше».
const LAB_RANGES: Record<string, [number, number]> = {
  tsh: [0.4, 4.0],
  t4: [9, 19],
  t3: [2.6, 5.7],
};

// Статус значения относительно нормы (приблизительно, для подсветки точки).
function computeStatus(series: { key: string; target: number }, value: number): Status {
  const range = LAB_RANGES[series.key];
  if (range) {
    const [lo, hi] = range;
    if (value >= lo && value <= hi) return "ok";
    if (value >= lo * 0.8 && value <= hi * 1.2) return "warn";
    return "alarm";
  }
  if (value <= series.target) return "ok";
  if (value <= series.target * 1.15) return "warn";
  return "alarm";
}

const DataContext = createContext<DataContextValue | null>(null);

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData должен использоваться внутри <DataProvider>");
  return ctx;
}

function Center({ children }: { children: ReactNode }) {
  return <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 p-8 text-center">{children}</div>;
}

export function DataProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    loadAppData(supabase, userId)
      .then(setData)
      .catch((e) => setError(e?.message || "Не удалось загрузить данные"));
  };

  useEffect(load, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (error) {
    return (
      <Center>
        <p className="text-[14px] text-muted">{error}</p>
        <button onClick={load} className="inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-ink">
          <RotateCcw className="h-4 w-4" /> Повторить
        </button>
        <button onClick={signOut} className="text-[13px] text-muted underline">
          Выйти
        </button>
      </Center>
    );
  }

  if (!data) {
    return (
      <Center>
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
        <p className="text-[14px] text-muted">Загружаем ваши данные…</p>
      </Center>
    );
  }

  const addMeal = async (meal: Omit<Meal, "id" | "photo">, photoBlob: Blob | null) => {
    const saved = await insertMeal(supabase, userId, meal, photoBlob);
    setData((d) =>
      d ? { ...d, week: d.week.map((day, i) => (i === 0 ? { ...day, meals: [saved, ...day.meals] } : day)) } : d,
    );
  };

  const toggleMed = async (id: string) => {
    const prev = data.meds;
    setData((d) =>
      d ? { ...d, meds: d.meds.map((m) => (m.id === id ? { ...m, taken: !m.taken } : m)) } : d,
    );
    try {
      const target = prev.find((m) => m.id === id);
      await setMedTaken(supabase, id, !(target?.taken ?? false));
    } catch {
      setData((d) => (d ? { ...d, meds: prev } : d)); // откат при ошибке
    }
  };

  const saveProfile = async (patient: Patient) => {
    await updateProfile(supabase, userId, patient);
    setData((d) => (d ? { ...d, patient } : d));
  };

  const saveMeds = async (meds: Med[]) => {
    const fresh = await persistMeds(supabase, userId, meds);
    setData((d) => (d ? { ...d, meds: fresh } : d));
  };

  const addLabResult = async (key: string, date: string, value: number) => {
    const series = data.labs[key];
    if (!series) return;
    const history = [...series.history, { date, value, status: computeStatus(series, value) }];
    await updateLabHistory(supabase, userId, key, history);
    setData((d) => (d ? { ...d, labs: { ...d.labs, [key]: { ...series, history } } } : d));
  };

  return (
    <DataContext.Provider
      value={{ ...data, addMeal, toggleMed, saveProfile, saveMeds, addLabResult, signOut }}
    >
      {children}
    </DataContext.Provider>
  );
}
