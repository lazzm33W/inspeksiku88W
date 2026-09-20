import { cn } from "@/lib/utils";
import { type ReportSummary, formatRupiah } from "@/types";
import { CircleAlert, CircleCheck, CircleX, Wallet } from "lucide-react";

interface SummaryPanelProps {
  summary: ReportSummary;
  className?: string;
}

interface SummaryTileProps {
  label: string;
  value: string;
  tone: "ok" | "attention" | "replace" | "neutral";
  icon: typeof CircleCheck;
}

const TONE_STYLES: Record<SummaryTileProps["tone"], string> = {
  ok: "border-success/25 bg-success/10 text-success",
  attention: "border-warning/35 bg-warning/12 text-warning",
  replace: "border-destructive/25 bg-destructive/10 text-destructive",
  neutral: "border-border bg-secondary text-foreground",
};

function SummaryTile({ label, value, tone, icon: Icon }: SummaryTileProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border p-3",
        TONE_STYLES[tone],
      )}
    >
      <span className="flex items-center gap-1.5 font-mono text-[0.625rem] font-medium uppercase tracking-[0.14em] opacity-80">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        {label}
      </span>
      <span className="font-display text-2xl font-bold leading-none tabular-nums">
        {value}
      </span>
    </div>
  );
}

export function SummaryPanel({ summary, className }: SummaryPanelProps) {
  return (
    <section
      data-ocid="report.summary_panel"
      aria-label="Ringkasan hasil inspeksi"
      className={cn("flex flex-col gap-3", className)}
    >
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <SummaryTile
          label="OK"
          value={summary.okCount.toString()}
          tone="ok"
          icon={CircleCheck}
        />
        <SummaryTile
          label="Perhatian"
          value={summary.attentionCount.toString()}
          tone="attention"
          icon={CircleAlert}
        />
        <SummaryTile
          label="Ganti"
          value={summary.replaceCount.toString()}
          tone="replace"
          icon={CircleX}
        />
        <SummaryTile
          label="Total Item"
          value={summary.totalItems.toString()}
          tone="neutral"
          icon={CircleCheck}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary px-4 py-3 text-primary-foreground">
        <span className="flex items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] opacity-80">
          <Wallet className="size-4 shrink-0" aria-hidden="true" />
          Estimasi Total Biaya Part
        </span>
        <span
          data-ocid="report.summary_cost"
          className="font-display text-lg font-bold tabular-nums"
        >
          {formatRupiah(summary.estimatedPartCost)}
        </span>
      </div>
    </section>
  );
}
