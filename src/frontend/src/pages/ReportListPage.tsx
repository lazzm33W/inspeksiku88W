import { ReportCard } from "@/components/ReportCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useListReports } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import {
  REPORT_FILTER_LABEL,
  REPORT_SORT_LABEL,
  ReportFilter,
  ReportSort,
} from "@/types";
import { Link } from "@tanstack/react-router";
import { ClipboardList, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

const FILTER_ORDER: ReportFilter[] = [
  ReportFilter.all,
  ReportFilter.hasAttention,
  ReportFilter.hasReplace,
];

const SORT_ORDER: ReportSort[] = [
  ReportSort.newestFirst,
  ReportSort.oldestFirst,
];

const SKELETON_IDS = Array.from(
  { length: 4 },
  (_, index) => `report-skeleton-${index}`,
);

export function ReportListPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ReportFilter>(ReportFilter.all);
  const [sort, setSort] = useState<ReportSort>(ReportSort.newestFirst);

  const {
    data: reports = [],
    isLoading,
    isError,
    refetch,
  } = useListReports(search, filter, sort);

  const hasReports = reports.length > 0;
  const isFiltering = search.trim() !== "" || filter !== ReportFilter.all;

  const totalReplace = useMemo(
    () =>
      reports.reduce((sum, report) => sum + report.summary.replaceCount, 0n),
    [reports],
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 sm:px-6">
      <section
        data-ocid="report.list_section"
        className="flex flex-col gap-4"
        aria-label="Riwayat laporan inspeksi"
      >
        <div className="flex flex-col gap-1">
          <span className="label-caps">Laporan Inspeksi</span>
          <h1 className="font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            Riwayat Laporan
          </h1>
          <p className="text-sm text-muted-foreground">
            {hasReports
              ? `${reports.length} laporan tercatat${totalReplace > 0n ? ` · ${totalReplace.toString()} item harus diganti` : ""}`
              : "Semua hasil inspeksi kendaraan bengkel tersimpan di sini."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              data-ocid="report.search_input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nomor polisi atau nama kendaraan…"
              aria-label="Cari laporan"
              className="h-11 rounded-lg bg-card pl-10 pr-10"
            />
            {search !== "" ? (
              <button
                type="button"
                data-ocid="report.search_clear_button"
                onClick={() => setSearch("")}
                aria-label="Bersihkan pencarian"
                className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground outline-none transition-smooth hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="tablist"
              aria-label="Filter status laporan"
              className="flex flex-wrap gap-1.5"
            >
              {FILTER_ORDER.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={filter === option}
                  data-ocid={`report.filter.${option}`}
                  onClick={() => setFilter(option)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 font-mono text-[0.6875rem] font-semibold uppercase tracking-wider outline-none transition-smooth focus-visible:ring-2 focus-visible:ring-ring",
                    filter === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  )}
                >
                  {REPORT_FILTER_LABEL[option]}
                </button>
              ))}
            </div>

            <div className="ml-auto w-full sm:w-40">
              <Select
                value={sort}
                onValueChange={(value) => setSort(value as ReportSort)}
              >
                <SelectTrigger
                  data-ocid="report.sort_select"
                  aria-label="Urutkan laporan"
                  className="h-9 rounded-lg bg-card"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_ORDER.map((option) => (
                    <SelectItem key={option} value={option}>
                      {REPORT_SORT_LABEL[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <ul
            data-ocid="report.loading_state"
            className="flex flex-col gap-3"
            aria-busy="true"
          >
            {SKELETON_IDS.map((id) => (
              <li key={id}>
                <Skeleton className="h-32 w-full rounded-lg" />
              </li>
            ))}
          </ul>
        ) : isError ? (
          <div
            data-ocid="report.error_state"
            className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-10 text-center"
          >
            <p className="font-display text-base font-bold text-foreground">
              Gagal memuat laporan
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Periksa koneksi lalu coba muat ulang daftar laporan.
            </p>
            <Button
              type="button"
              variant="outline"
              data-ocid="report.retry_button"
              onClick={() => void refetch()}
              className="rounded-full"
            >
              Coba Lagi
            </Button>
          </div>
        ) : !hasReports ? (
          <div
            data-ocid="report.empty_state"
            className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <ClipboardList className="size-6" aria-hidden="true" />
            </span>
            <h2 className="font-display text-lg font-bold text-foreground">
              {isFiltering ? "Tidak ada laporan cocok" : "Belum ada laporan"}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {isFiltering
                ? "Ubah kata kunci pencarian atau pilih filter status lain."
                : "Mulai dengan membuat laporan inspeksi pertama untuk kendaraan yang masuk bengkel."}
            </p>
            {isFiltering ? (
              <Button
                type="button"
                variant="outline"
                data-ocid="report.reset_filter_button"
                onClick={() => {
                  setSearch("");
                  setFilter(ReportFilter.all);
                }}
                className="rounded-full"
              >
                Reset Filter
              </Button>
            ) : (
              <Button asChild className="rounded-full">
                <Link to="/laporan/baru" data-ocid="report.empty_create_button">
                  <Plus aria-hidden="true" />
                  Buat Laporan Baru
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <ul data-ocid="report.list" className="flex flex-col gap-3">
            {reports.map((report, index) => (
              <li key={report.id.toString()} className="animate-rise">
                <ReportCard report={report} index={index} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-5">
        <div className="pointer-events-auto px-4">
          <Button
            asChild
            size="lg"
            data-ocid="report.create_button"
            className="h-12 rounded-full bg-accent px-6 font-display text-sm font-bold text-accent-foreground shadow-elevated transition-smooth hover:bg-accent/90"
          >
            <Link to="/laporan/baru">
              <Plus aria-hidden="true" />
              Buat Laporan Baru
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
