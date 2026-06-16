import type { Status } from "@/lib/mock";

const styles: Record<Status, string> = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  alarm: "bg-alarm-soft text-alarm",
};

const defaultLabel: Record<Status, string> = {
  ok: "в норме",
  warn: "внимание",
  alarm: "тревога",
};

export function StatusBadge({
  status,
  label,
  className = "",
}: {
  status: Status;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-medium leading-none ${styles[status]} ${className}`}
    >
      {label ?? defaultLabel[status]}
    </span>
  );
}

export function StatusDot({ status }: { status: Status }) {
  const dot: Record<Status, string> = {
    ok: "bg-ok",
    warn: "bg-warn",
    alarm: "bg-alarm",
  };
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot[status]}`} />;
}
