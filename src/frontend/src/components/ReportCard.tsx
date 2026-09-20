import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import {
  ItemStatus,
  type ReportListItem,
  formatInspectionDate,
  formatRupiah,
} from "@/types";
import { Link } from "@tanstack/react-router";
import { CalendarDays, ChevronRight, Wrench } from "lucide-react";

interface ReportCardProps {
  report: ReportListItem;
  index: number;
}

export function ReportCard({ report, index }: ReportCardProps) {
  const { summary } = report;
  const hasIssues = summary.attentionCount > 0n || summary.replaceCount > 0n;

  return (
    <Link
      to="/laporan/$reportId"
      params={{ reportId: report.id.toString() }}
      data-ocid={`report.item.${index + 1}`}
      className="group block rounded-lg outline-none transition-smooth focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="gap-0 rounded-lg border-border bg-card p-0 shadow-none transition-smooth group-hover:border-primary/40 group-hover:shadow-subtle">
        <div className="flex items-start gap-3 p-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="plate-chip">{report.plateNumber}</span>
              {report.year > 0n ? (
                <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
                  {report.year.toString()}
                </span>
              ) : null}
            </div>

            <h3 className="truncate font-display text-base font-bold leading-snug text-foreground">
              {report.vehicleName}
            </h3>

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
              Inspeksi {formatInspectionDate(report.inspectionDate)}
            </p>

            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <StatusBadge
                status={ItemStatus.ok}
                count={summary.okCount}
                short
              />
              <StatusBadge
                status={ItemStatus.attention}
                count={summary.attentionCount}
                short
              />
              <StatusBadge
                status={ItemStatus.replace}
                count={summary.replaceCount}
                short
              />
            </div>
          </div>

          <ChevronRight
            className="mt-1 size-4 shrink-0 text-muted-foreground transition-smooth group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden="true"
          />
        </div>

        {summary.estimatedPartCost > 0n ? (
          <div className="flex items-center justify-between gap-3 border-t border-border bg-secondary/60 px-4 py-2.5">
            <span className="flex items-center gap-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
              <Wrench className="size-3.5 shrink-0" aria-hidden="true" />
              Estimasi Part
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
              {formatRupiah(summary.estimatedPartCost)}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 border-t border-border bg-secondary/60 px-4 py-2.5">
            <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
              {summary.totalItems.toString()} item diperiksa
            </span>
            <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
              {hasIssues ? "Perlu tindak lanjut" : "Semua kondisi baik"}
            </span>
          </div>
        )}
      </Card>
    </Link>
  );
}
