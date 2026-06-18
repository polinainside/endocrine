"use client";

import { useState } from "react";
import { TabBar, type TabKey } from "@/components/TabBar";
import { DemoBadge } from "@/components/DemoBadge";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { LabsScreen } from "@/components/screens/LabsScreen";
import { NutritionScreen } from "@/components/screens/NutritionScreen";
import { DoctorScreen } from "@/components/screens/DoctorScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";

const screens: Record<TabKey, () => JSX.Element> = {
  home: HomeScreen,
  labs: LabsScreen,
  nutrition: NutritionScreen,
  doctor: DoctorScreen,
  profile: () => <ProfileScreen />,
};

// Вкладки приложения. Рендерится после авторизации и загрузки данных (внутри DataProvider).
export function AppShell() {
  const [tab, setTab] = useState<TabKey>("home");
  const Screen = screens[tab];

  return (
    <>
      <DemoBadge />
      <main key={tab} className="no-scrollbar flex-1 overflow-y-auto p-4">
        <Screen />
      </main>
      <TabBar active={tab} onChange={setTab} />
    </>
  );
}
