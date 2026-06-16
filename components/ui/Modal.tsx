"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-50 flex items-end justify-center bg-ink/30 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="w-full animate-fade-in rounded-t-[20px] border-t border-border bg-surface p-5 pb-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[17px] font-semibold text-ink">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-bg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="text-[15px] leading-relaxed text-muted">{children}</div>
      </div>
    </div>
  );
}
