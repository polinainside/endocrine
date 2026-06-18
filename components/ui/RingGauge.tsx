"use client";

import { useEffect, useId, useState } from "react";

// Кольцевой индикатор (SVG) с оранжевым градиентом и анимацией заполнения на маунте.
export function RingGauge({
  value,
  caption,
  size = 92,
  stroke = 9,
}: {
  value: number;
  caption?: string;
  size?: number;
  stroke?: number;
}) {
  const uid = useId();
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 60);
    return () => clearTimeout(t);
  }, []);
  const dash = (shown ? pct / 100 : 0) * circ;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E36C39" />
            <stop offset="100%" stopColor="#F3A875" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ECE9E3" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#g-${uid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className="transition-[stroke-dasharray] duration-[900ms] ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[20px] font-semibold leading-none text-ink">{pct}%</span>
        {caption && <span className="mt-1 text-[10px] leading-none text-muted">{caption}</span>}
      </div>
    </div>
  );
}
