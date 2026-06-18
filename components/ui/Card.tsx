import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  onClick,
  plain = false,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  // plain — без градиента (когда нужен свой фон, например тонированные карточки)
  plain?: boolean;
}) {
  const surface = plain ? "" : "bg-gradient-to-b from-white to-[#F4F2EE]";
  return (
    <div
      onClick={onClick}
      className={`rounded-card border border-border ${surface} p-4 shadow-card ${
        onClick ? "cursor-pointer transition-transform active:scale-[0.99]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
