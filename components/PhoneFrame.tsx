"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Signal, Wifi, BatteryFull } from "lucide-react";

// «Рамка телефона» в размерах iPhone 12 (390×844). На десктопе всё устройство
// целиком масштабируется под высоту окна (transform: scale) — вёрстка остаётся
// ровно на 390px и не плывёт, страница не скроллится. Чёлки нет, просто рамка.
// На реальном телефоне (ширина < 640px) — полноэкранный режим без масштаба.
export function PhoneFrame({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calc = () => {
      // 48px — воздух сверху/снизу вокруг устройства. Не увеличиваем больше 1.
      const next = Math.min(1, (window.innerHeight - 48) / 844);
      setScale(next > 0 ? next : 1);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  return (
    <div className="flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#e7ebf1]">
      {/* Корпус (безель). На десктопе фиксированный 390×844 + transform: scale. */}
      <div
        style={{ ["--frame-scale" as keyof CSSProperties]: scale } as CSSProperties}
        className="relative h-[100dvh] w-full bg-[#1b1b1f] sm:h-[844px] sm:w-[390px] sm:rounded-[58px] sm:p-[13px] sm:shadow-[0_40px_80px_-25px_rgba(15,37,64,0.55)] sm:[transform-origin:center] sm:[transform:scale(var(--frame-scale))]"
      >
        {/* Экран */}
        <div className="relative flex h-full w-full flex-col overflow-hidden bg-bg sm:rounded-[46px]">
          {/* Статус-бар (только в рамке на десктопе), без чёлки */}
          <div className="z-40 hidden h-[44px] shrink-0 items-end justify-between px-6 pb-1.5 text-[14px] font-semibold text-ink sm:flex">
            <span className="tracking-tight">9:41</span>
            <span className="flex items-center gap-1.5">
              <Signal className="h-[15px] w-[15px]" strokeWidth={2.4} />
              <Wifi className="h-[15px] w-[15px]" strokeWidth={2.4} />
              <BatteryFull className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
