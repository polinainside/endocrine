import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand/90 active:bg-brand/95",
  secondary: "border border-border bg-surface text-ink hover:bg-brand-soft/50",
  ghost: "text-brand hover:bg-brand-soft/60",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: Variant;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-btn px-4 text-[15px] font-semibold transition-colors duration-150 disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
