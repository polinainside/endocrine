"use client";

import { useState } from "react";
import { ArrowLeft, Plus, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useData } from "@/components/data/DataProvider";

function deriveInitials(full: string, fallback: string): string {
  const w = full.trim().split(/\s+/);
  const s = ((w[0]?.[0] ?? "") + (w[1]?.[0] ?? "")).toUpperCase();
  return s || fallback;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] text-muted">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "h-12 w-full rounded-btn border border-border bg-surface px-4 text-[15px] text-ink outline-none focus:border-brand";

export function EditProfileScreen({ onBack }: { onBack: () => void }) {
  const { patient, saveProfile } = useData();

  const [fullName, setFullName] = useState(patient.fullName);
  const [sex, setSex] = useState(patient.sex);
  const [birthDate, setBirthDate] = useState(patient.birthDate);
  const [age, setAge] = useState(String(patient.age));
  const [height, setHeight] = useState(String(patient.height));
  const [weight, setWeight] = useState(String(patient.weight));
  const [bloodType, setBloodType] = useState(patient.bloodType);
  const [allergies, setAllergies] = useState(patient.allergies);
  const [diagnoses, setDiagnoses] = useState(patient.diagnoses.map((d) => ({ ...d })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const h = parseInt(height, 10) || 0;
  const w = parseFloat(weight.replace(",", ".")) || 0;
  const bmi = h > 0 && w > 0 ? Math.round((w / (h / 100) ** 2) * 10) / 10 : patient.bmi;

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await saveProfile({
        ...patient,
        fullName: fullName.trim() || patient.fullName,
        name: fullName.trim().split(/\s+/)[0] || patient.name,
        initials: deriveInitials(fullName, patient.initials),
        sex,
        birthDate: birthDate.trim(),
        age: parseInt(age, 10) || patient.age,
        height: h || patient.height,
        weight: w || patient.weight,
        bmi,
        bloodType: bloodType.trim(),
        allergies: allergies.trim(),
        diagnoses: diagnoses
          .map((d) => ({ title: d.title.trim(), code: d.code.trim() }))
          .filter((d) => d.title),
      });
      onBack();
    } catch {
      setError("Не удалось сохранить. Попробуйте ещё раз.");
      setSaving(false);
    }
  };

  return (
    <div className="-mx-4 -mt-4 flex h-full flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-bg px-4 py-3">
        <button onClick={onBack} aria-label="Назад" className="text-muted" disabled={saving}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[17px] font-semibold text-ink">Редактирование</h1>
      </header>

      <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
        <Field label="ФИО">
          <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Имя Фамилия" />
        </Field>

        <Field label="Пол">
          <div className="flex gap-2">
            {["жен.", "муж."].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSex(s)}
                className={`flex-1 rounded-btn border py-3 text-[15px] font-medium transition-colors ${
                  sex === s ? "border-brand bg-brand-soft text-brand" : "border-border bg-surface text-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex gap-3">
          <div className="flex-1">
            <Field label="Дата рождения">
              <input className={inputCls} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} placeholder="ДД.ММ.ГГГГ" inputMode="numeric" />
            </Field>
          </div>
          <div className="w-24">
            <Field label="Возраст">
              <input className={inputCls} value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" />
            </Field>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <Field label="Рост, см">
              <input className={inputCls} value={height} onChange={(e) => setHeight(e.target.value)} inputMode="numeric" />
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Вес, кг">
              <input className={inputCls} value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-btn bg-brand-soft/50 px-4 py-3">
          <span className="text-[14px] text-muted">ИМТ (считается автоматически)</span>
          <span className="text-[16px] font-semibold text-ink">{bmi}</span>
        </div>

        <Field label="Группа крови">
          <input className={inputCls} value={bloodType} onChange={(e) => setBloodType(e.target.value)} placeholder="например II (A) Rh+" />
        </Field>

        <Field label="Аллергии">
          <input className={inputCls} value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="нет / перечислите" />
        </Field>

        {/* Диагнозы */}
        <div>
          <span className="mb-1 block text-[13px] text-muted">Диагнозы</span>
          <div className="flex flex-col gap-2">
            {diagnoses.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={`${inputCls} flex-1`}
                  value={d.title}
                  onChange={(e) =>
                    setDiagnoses((prev) => prev.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
                  }
                  placeholder="Диагноз"
                />
                <input
                  className={`${inputCls} w-24`}
                  value={d.code}
                  onChange={(e) =>
                    setDiagnoses((prev) => prev.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))
                  }
                  placeholder="Код"
                />
                <button
                  type="button"
                  onClick={() => setDiagnoses((prev) => prev.filter((_, j) => j !== i))}
                  aria-label="Удалить"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setDiagnoses((prev) => [...prev, { title: "", code: "" }])}
              className="inline-flex items-center gap-1.5 self-start text-[14px] font-medium text-brand"
            >
              <Plus className="h-4 w-4" /> Добавить диагноз
            </button>
          </div>
        </div>

        {error && <p className="rounded-btn bg-alarm-soft px-3 py-2 text-[13px] text-alarm">{error}</p>}

        <Button onClick={save} disabled={saving} className="mt-1 w-full">
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Check className="h-5 w-5" />
              Сохранить
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
