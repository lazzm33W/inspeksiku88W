import { cn } from "@/lib/utils";
import { ITEM_STATUS_LABEL, ITEM_STATUS_SHORT, type ItemStatus } from "@/types";

const STATUS_STYLES: Record<ItemStatus, string> = {
  ok: "border-success/30 bg-success/12 text-success",
  attention: "border-warning/40 bg-warning/15 text-warning",
  replace: "border-destructive/30 bg-destructive/12 text-destructive",
};

const DOT_STYLES: Record<ItemStatus, string> = {
  ok: "bg-success",
  attention: "bg-warning",
  replace: "bg-destructive",
};

interface StatusBadgeProps {
  status: ItemStatus;
  count?: bigint;
  short?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  count,
  short = false,
  className,
}: StatusBadgeProps) {
  const label = short ? ITEM_STATUS_SHORT[status] : ITEM_STATUS_LABEL[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.6875rem] font-semibold uppercase tracking-wider",
        STATUS_STYLES[status],
        className,
      )}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", DOT_STYLES[status])}
        aria-hidden="true"
      />
      {label}
      {count !== undefined ? (
        <span className="tabular-nums">{count.toString()}</span>
      ) : null}
    </span>
  );
}

export function StatusDot({ status }: { status: ItemStatus }) {
  return (
    <span
      className={cn("size-2 shrink-0 rounded-full", DOT_STYLES[status])}
      aria-hidden="true"
    />
  );
}
