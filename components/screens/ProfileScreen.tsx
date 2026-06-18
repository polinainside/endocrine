"use client";

import {
  ArrowLeft,
  Activity,
  Bluetooth,
  BatteryMedium,
  RefreshCw,
  CalendarClock,
  Stethoscope,
  HeartPulse,
  Ruler,
  Droplet,
  TriangleAlert,
  LogOut,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useData } from "@/components/data/DataProvider";

export function ProfileScreen({ onBack }: { onBack: () => void }) {
  const { patient, doctor, sensor, signOut } = useData();
  return (
    <div className="-mx-4 -mt-4 flex flex-col">
      {/* Шапка */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur">
        <button onClick={onBack} aria-label="Назад" className="text-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[17px] font-semibold text-ink">Личный кабинет</h1>
      </header>

      <div className="flex flex-col gap-4 px-4 pb-4 pt-4">
        {/* Карточка пациента */}
        <Card className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-[20px] font-semibold text-brand">
            {patient.initials}
          </div>
          <div>
            <p className="text-[17px] font-semibold text-ink">{patient.fullName}</p>
            <p className="text-[13px] text-muted">
              {patient.age} года · {patient.sex} · {patient.birthDate}
            </p>
            <p className="mt-0.5 text-[12px] text-muted">ID пациента: {patient.patientId}</p>
          </div>
        </Card>

        {/* Датчик NovaSense — источник автоматических данных */}
        <div>
          <h2 className="mb-2 px-1 text-[13px] font-medium uppercase tracking-wide text-muted">
            Датчик глюкозы
          </h2>
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-btn bg-brand-soft">
                <Activity className="h-6 w-6 text-brand" strokeWidth={2.2} />
              </div>
              <div className="flex-1">
                <p className="text-[16px] font-semibold text-ink">
                  {sensor.name} {sensor.model}
                </p>
                <p className="text-[13px] text-muted">{sensor.type}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-1 text-[13px] font-medium text-ok">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
                </span>
                подключён
              </span>
            </div>

            {/* Параметры датчика */}
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
              <SensorStat icon={Bluetooth} label="Связь" value="Bluetooth, авто" />
              <SensorStat icon={RefreshCw} label="Синхронизация" value={`${sensor.lastSyncMin} мин назад`} />
              <SensorStat icon={BatteryMedium} label="Заряд" value={`${sensor.battery}%`} />
              <SensorStat icon={CalendarClock} label="Носить ещё" value={`${sensor.wearDaysLeft} дн.`} />
              <SensorStat icon={Activity} label="Измерения" value={`каждые ${sensor.intervalMin} мин`} />
              <SensorStat icon={HeartPulse} label="Расположение" value={sensor.placement} />
            </div>

            <p className="mt-4 rounded-btn bg-brand-soft/50 p-3 text-[13px] leading-relaxed text-ink/80">
              {sensor.description}
            </p>
          </Card>
        </div>

        {/* Медкарта */}
        <div>
          <h2 className="mb-2 px-1 text-[13px] font-medium uppercase tracking-wide text-muted">
            Медкарта
          </h2>
          <Card>
            {/* Диагнозы */}
            <p className="text-[13px] font-medium text-muted">Диагнозы</p>
            <ul className="mt-2 flex flex-col gap-2">
              {patient.diagnoses.map((d) => (
                <li key={d.code} className="flex items-center justify-between">
                  <span className="text-[15px] text-ink">{d.title}</span>
                  <span className="rounded-full bg-bg px-2 py-0.5 text-[12px] font-medium text-muted">
                    {d.code}
                  </span>
                </li>
              ))}
            </ul>

            {/* Параметры */}
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4">
              <SensorStat icon={Ruler} label="Рост" value={`${patient.height} см`} />
              <SensorStat icon={Activity} label="Вес" value={`${patient.weight} кг`} />
              <SensorStat icon={HeartPulse} label="ИМТ" value={`${patient.bmi}`} />
              <SensorStat icon={Droplet} label="Группа крови" value={patient.bloodType} />
            </div>

            {/* Аллергии */}
            <div className="mt-4 flex items-center gap-2 rounded-btn bg-warn-soft/70 p-3">
              <TriangleAlert className="h-4 w-4 shrink-0 text-warn" />
              <span className="text-[13px] text-ink/80">
                Аллергия: <span className="font-medium">{patient.allergies}</span>
              </span>
            </div>

            {/* Лечащий врач */}
            <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft">
                <Stethoscope className="h-5 w-5 text-brand" />
              </div>
              <div>
                <p className="text-[12px] text-muted">Лечащий врач · наблюдается с {patient.observedSince}</p>
                <p className="text-[15px] font-medium text-ink">{doctor.name}</p>
                <p className="text-[13px] text-muted">{doctor.clinic}</p>
              </div>
            </div>
          </Card>
        </div>

        <button
          onClick={signOut}
          className="mt-1 flex items-center justify-center gap-2 rounded-card border border-border bg-surface py-3 text-[15px] font-medium text-alarm transition-colors active:scale-[0.99]"
        >
          <LogOut className="h-5 w-5" />
          Выйти
        </button>
      </div>
    </div>
  );
}

function SensorStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted" strokeWidth={2} />
      <div className="min-w-0">
        <p className="text-[12px] leading-tight text-muted">{label}</p>
        <p className="truncate text-[14px] font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}
