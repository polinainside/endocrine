import type { LucideIcon } from "lucide-react";

export function MetricTile({
  icon: Icon,
  label,
  value,
  source,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  source?: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5 rounded-card border border-border bg-gradient-to-b from-white to-[#F4F2EE] p-3 shadow-card">
      <Icon className="h-4 w-4 text-brand" strokeWidth={2.2} />
      <span className="text-[22px] font-light leading-tight tracking-tight text-ink">{value}</span>
      <span className="text-[12px] leading-tight text-muted">{label}</span>
      {source && (
        <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] leading-tight text-muted/80">
          <span className="h-1 w-1 rounded-full bg-muted/50" />
          {source}
        </span>
      )}
    </div>
  );
}
