"use client";

import { LayoutDashboard, Activity, Utensils, Stethoscope, User, type LucideIcon } from "lucide-react";

export type TabKey = "home" | "labs" | "nutrition" | "doctor" | "profile";

const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "home", label: "Главная", icon: LayoutDashboard },
  { key: "labs", label: "Анализы", icon: Activity },
  { key: "nutrition", label: "Питание", icon: Utensils },
  { key: "doctor", label: "Врач", icon: Stethoscope },
  { key: "profile", label: "Профиль", icon: User },
];

export function TabBar({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (key: TabKey) => void;
}) {
  return (
    <nav className="z-30 flex shrink-0 justify-center px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2">
      {/* Плавающая «таблетка»; активный пункт — чёрный кружок (по референсу) */}
      <div className="flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-2 shadow-card">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                isActive ? "bg-ink text-white" : "text-muted hover:text-ink"
              }`}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 2} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
