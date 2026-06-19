import { useEffect, useRef, useState } from "react";

// Анимация «набегающего» числа от 0 к target (easeOutCubic). Возвращает строку
// в нужном формате (с десятичными или с разделителем тысяч по-русски).
export function useCountUp(target: number, opts: { duration?: number; decimals?: number } = {}): string {
  const { duration = 850, decimals = 0 } = opts;
  const [val, setVal] = useState(0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Уважаем «уменьшить движение» — показываем итог сразу, без анимации.
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setVal(target);
      return;
    }
    let start: number | null = null;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString("ru-RU");
}
