"use client";

import { useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { TabBar, type TabKey } from "@/components/TabBar";
import { DemoBadge } from "@/components/DemoBadge";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { LabsScreen } from "@/components/screens/LabsScreen";
import { NutritionScreen } from "@/components/screens/NutritionScreen";
import { DoctorScreen } from "@/components/screens/DoctorScreen";

const screens: Record<TabKey, () => JSX.Element> = {
  home: HomeScreen,
  labs: LabsScreen,
  nutrition: NutritionScreen,
  doctor: DoctorScreen,
};

export default function Page() {
  const [tab, setTab] = useState<TabKey>("home");
  const Screen = screens[tab];

  return (
    <PhoneFrame>
      <DemoBadge />
      {/* Прокручиваемая область контента. key даёт лёгкий fade при смене вкладки. */}
      <main key={tab} className="no-scrollbar flex-1 animate-fade-in overflow-y-auto p-4">
        <Screen />
      </main>
      <TabBar active={tab} onChange={setTab} />
    </PhoneFrame>
  );
}
