import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-card border border-border bg-surface p-4 shadow-card ${
        onClick ? "cursor-pointer transition-transform active:scale-[0.99]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
