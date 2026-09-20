import {
  ItemStatus,
  PartAvailability,
  ReportFilter,
  ReportSort,
} from "@/backend";
import type {
  InspectionItem,
  ItemInput,
  PartInfo,
  Photo,
  PhotoInput,
  ReportId,
  ReportInput,
  ReportListItem,
  ReportSummary,
  ReportView,
} from "@/backend";

export type {
  InspectionItem,
  ItemInput,
  PartInfo,
  Photo,
  PhotoInput,
  ReportId,
  ReportInput,
  ReportListItem,
  ReportSummary,
  ReportView,
};

export { ItemStatus, PartAvailability, ReportFilter, ReportSort };

export const ITEM_STATUS_LABEL: Record<ItemStatus, string> = {
  ok: "OK",
  attention: "Perlu Perhatian",
  replace: "Harus Diganti",
};

export const ITEM_STATUS_SHORT: Record<ItemStatus, string> = {
  ok: "OK",
  attention: "Perhatian",
  replace: "Ganti",
};

export const PART_AVAILABILITY_LABEL: Record<PartAvailability, string> = {
  available: "Tersedia",
  unavailable: "Tidak Tersedia",
  order: "Perlu Pesan",
};

export const REPORT_FILTER_LABEL: Record<ReportFilter, string> = {
  all: "Semua",
  hasAttention: "Ada Perhatian",
  hasReplace: "Ada Harus Diganti",
};

export const REPORT_SORT_LABEL: Record<ReportSort, string> = {
  newestFirst: "Terbaru",
  oldestFirst: "Terlama",
};

export const DEFAULT_CATEGORIES = [
  "Mesin",
  "Rem",
  "Ban & Kaki-kaki",
  "Kelistrikan",
  "Interior",
  "Eksterior",
] as const;

export const ITEM_STATUS_ORDER: ItemStatus[] = [
  ItemStatus.ok,
  ItemStatus.attention,
  ItemStatus.replace,
];

export const PART_AVAILABILITY_ORDER: PartAvailability[] = [
  PartAvailability.available,
  PartAvailability.unavailable,
  PartAvailability.order,
];

/** Format a Rupiah amount with dot thousand separators, no currency conversion. */
export function formatRupiah(amount: bigint): string {
  const negative = amount < 0n;
  const digits = (negative ? -amount : amount).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negative ? "-" : ""}Rp ${grouped}`;
}

/** Parse a user-typed Rupiah string into a bigint, ignoring non-digits. */
export function parseRupiah(value: string): bigint {
  const digits = value.replace(/[^\d]/g, "");
  if (digits === "") return 0n;
  return BigInt(digits);
}

/** Format a bigint for display inside a numeric input. */
export function formatRupiahInput(amount: bigint): string {
  if (amount <= 0n) return "";
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Convert a backend nanosecond timestamp into a Date, or null when invalid. */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** Format an ISO yyyy-mm-dd inspection date as "12 Maret 2024". */
export function formatInspectionDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const monthName = MONTHS_ID[month - 1];
  if (!monthName) return isoDate;
  return `${day} ${monthName} ${year}`;
}

/** Today's date as an ISO yyyy-mm-dd string in local time. */
export function todayIso(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function emptySummary(): ReportSummary {
  return {
    okCount: 0n,
    attentionCount: 0n,
    replaceCount: 0n,
    totalItems: 0n,
    estimatedPartCost: 0n,
  };
}

export function summarizeItems(items: InspectionItem[]): ReportSummary {
  let okCount = 0n;
  let attentionCount = 0n;
  let replaceCount = 0n;
  let estimatedPartCost = 0n;

  for (const item of items) {
    if (item.status === ItemStatus.ok) okCount += 1n;
    else if (item.status === ItemStatus.attention) attentionCount += 1n;
    else if (item.status === ItemStatus.replace) {
      replaceCount += 1n;
      if (item.part) estimatedPartCost += item.part.price;
    }
  }

  return {
    okCount,
    attentionCount,
    replaceCount,
    totalItems: BigInt(items.length),
    estimatedPartCost,
  };
}
