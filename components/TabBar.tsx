"use client";

import { LayoutDashboard, Activity, Camera, Stethoscope, type LucideIcon } from "lucide-react";

export type TabKey = "home" | "labs" | "nutrition" | "doctor";

const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "home", label: "Главная", icon: LayoutDashboard },
  { key: "labs", label: "Анализы", icon: Activity },
  { key: "nutrition", label: "Питание", icon: Camera },
  { key: "doctor", label: "Врач", icon: Stethoscope },
];

export function TabBar({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (key: TabKey) => void;
}) {
  return (
    <nav className="z-30 flex shrink-0 items-stretch border-t border-border bg-surface px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
      {tabs.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="flex flex-1 flex-col items-center gap-1 rounded-btn py-1.5 transition-colors"
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              className={`h-6 w-6 transition-colors ${isActive ? "text-brand" : "text-muted"}`}
              strokeWidth={isActive ? 2.4 : 2}
            />
            <span
              className={`text-[11px] font-medium transition-colors ${
                isActive ? "text-brand" : "text-muted"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
