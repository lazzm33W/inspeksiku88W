import { ItemEditor } from "@/components/ItemEditor";
import { SummaryPanel } from "@/components/SummaryPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAddItem,
  useDeleteItem,
  useDeleteReport,
  useReport,
  useUpdateItem,
  useUpdateReport,
} from "@/hooks/useQueries";
import {
  DEFAULT_CATEGORIES,
  ITEM_STATUS_LABEL,
  ITEM_STATUS_SHORT,
  type InspectionItem,
  type ItemInput,
  ItemStatus,
  PART_AVAILABILITY_LABEL,
  PartAvailability,
  formatInspectionDate,
  formatRupiah,
  formatRupiahInput,
  parseRupiah,
  summarizeItems,
} from "@/types";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

const SKELETON_IDS = Array.from(
  { length: 3 },
  (_, index) => `detail-skeleton-${index}`,
);

function buildWhatsAppMessage(
  plateNumber: string,
  vehicleName: string,
  year: bigint,
  inspectionDate: string,
  items: InspectionItem[],
): string {
  const summary = summarizeItems(items);
  const lines: string[] = [];

  lines.push("*LAPORAN INSPEKSI KENDARAAN*");
  lines.push("");
  lines.push(`Nomor Polisi: ${plateNumber}`);
  lines.push(
    `Kendaraan: ${vehicleName}${year > 0n ? ` (${year.toString()})` : ""}`,
  );
  lines.push(`Tanggal Inspeksi: ${formatInspectionDate(inspectionDate)}`);
  lines.push("");
  lines.push("*Ringkasan Hasil*");
  lines.push(`- OK: ${summary.okCount.toString()} item`);
  lines.push(`- Perlu Perhatian: ${summary.attentionCount.toString()} item`);
  lines.push(`- Harus Diganti: ${summary.replaceCount.toString()} item`);
  lines.push(`- Total item diperiksa: ${summary.totalItems.toString()}`);
  lines.push(
    `- Estimasi biaya part: ${formatRupiah(summary.estimatedPartCost)}`,
  );

  const issues = items.filter((item) => item.status !== ItemStatus.ok);
  if (issues.length > 0) {
    lines.push("");
    lines.push("*Item Perlu Tindak Lanjut*");
    for (const item of issues) {
      const part = item.part
        ? ` — Part: ${item.part.name} (${PART_AVAILABILITY_LABEL[item.part.availability]}, ${formatRupiah(item.part.price)})`
        : "";
      const note =
        item.note.trim() !== "" ? ` — Catatan: ${item.note.trim()}` : "";
      lines.push(
        `- [${ITEM_STATUS_SHORT[item.status]}] ${item.name} (${item.category})${part}${note}`,
      );
    }
  }

  lines.push("");
  lines.push("Dikirim dari aplikasi Laporan Inspeksi Bengkel.");
  return lines.join("\n");
}

export function ReportDetailPage() {
  const { reportId } = useParams({ from: "/laporan/$reportId" });
  const navigate = useNavigate();
  const id = useMemo(() => {
    try {
      return BigInt(reportId);
    } catch {
      return null;
    }
  }, [reportId]);

  const { data: report, isLoading, isError, refetch } = useReport(id);
  const updateReport = useUpdateReport();
  const deleteReport = useDeleteReport();
  const addItem = useAddItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  const [editingHeader, setEditingHeader] = useState(false);
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [year, setYear] = useState("");
  const [inspectionDate, setInspectionDate] = useState("");
  const [headerError, setHeaderError] = useState<string | null>(null);

  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<string>(
    DEFAULT_CATEGORIES[0],
  );
  const [newItemStatus, setNewItemStatus] = useState<ItemStatus>(ItemStatus.ok);
  const [newItemPartPrice, setNewItemPartPrice] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);

  function startEditingHeader() {
    if (!report) return;
    setPlateNumber(report.plateNumber);
    setVehicleName(report.vehicleName);
    setYear(report.year > 0n ? report.year.toString() : "");
    setInspectionDate(report.inspectionDate);
    setHeaderError(null);
    setEditingHeader(true);
  }

  function saveHeader() {
    if (!report) return;
    if (plateNumber.trim() === "" || vehicleName.trim() === "") {
      setHeaderError("Nomor polisi dan nama kendaraan wajib diisi.");
      return;
    }
    const parsedYear = Number.parseInt(year.replace(/[^\d]/g, ""), 10);
    updateReport.mutate(
      {
        id: report.id,
        input: {
          plateNumber: plateNumber.trim().toUpperCase(),
          vehicleName: vehicleName.trim(),
          year: Number.isNaN(parsedYear) ? 0n : BigInt(parsedYear),
          inspectionDate,
        },
      },
      {
        onSuccess: () => {
          setEditingHeader(false);
          setHeaderError(null);
        },
      },
    );
  }

  function handleAddItem() {
    if (!report) return;
    const trimmed = newItemName.trim();
    if (trimmed === "") {
      setAddError("Nama item inspeksi wajib diisi.");
      return;
    }
    setAddError(null);
    const partPrice = parseRupiah(newItemPartPrice);
    const input: ItemInput = {
      name: trimmed,
      category: newItemCategory,
      status: newItemStatus,
      note: "",
      part:
        partPrice > 0n
          ? {
              name: trimmed,
              availability: PartAvailability.available,
              price: partPrice,
            }
          : undefined,
    };
    addItem.mutate(
      { reportId: report.id, input },
      {
        onSuccess: () => {
          setNewItemName("");
          setNewItemStatus(ItemStatus.ok);
          setNewItemPartPrice("");
        },
      },
    );
  }

  function handleShare() {
    if (!report) return;
    const message = buildWhatsAppMessage(
      report.plateNumber,
      report.vehicleName,
      report.year,
      report.inspectionDate,
      report.items,
    );
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-5 sm:px-6">
        <ul
          data-ocid="report.detail_loading_state"
          className="flex flex-col gap-3"
        >
          {SKELETON_IDS.map((skeletonId) => (
            <li key={skeletonId}>
              <Skeleton className="h-28 w-full rounded-lg" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-5 sm:px-6">
        <div
          data-ocid="report.detail_error_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
        >
          <h1 className="font-display text-lg font-bold text-foreground">
            Laporan tidak ditemukan
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Laporan mungkin sudah dihapus atau tautannya tidak valid.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="report.detail_retry_button"
              onClick={() => void refetch()}
              className="rounded-full"
            >
              Coba Lagi
            </Button>
            <Button
              type="button"
              data-ocid="report.detail_back_button"
              onClick={() => void navigate({ to: "/" })}
              className="rounded-full"
            >
              Kembali ke Daftar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const summary = summarizeItems(report.items);
  const grouped = report.items.reduce<Map<string, InspectionItem[]>>(
    (accumulator, item) => {
      const key = item.category.trim() === "" ? "Umum" : item.category;
      const bucket = accumulator.get(key);
      if (bucket) bucket.push(item);
      else accumulator.set(key, [item]);
      return accumulator;
    },
    new Map(),
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-5 sm:px-6">
      <Button
        asChild
        variant="ghost"
        size="sm"
        data-ocid="report.detail_back_button"
        className="-ml-2 mb-3 rounded-full text-muted-foreground"
      >
        <button type="button" onClick={() => void navigate({ to: "/" })}>
          <ArrowLeft aria-hidden="true" />
          Riwayat Laporan
        </button>
      </Button>

      <div className="flex flex-col gap-5">
        <section
          data-ocid="report.header_section"
          className="rounded-lg border border-border bg-card p-4 shadow-none sm:p-5"
          aria-label="Identitas kendaraan"
        >
          {editingHeader ? (
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-plate" className="label-caps">
                    Nomor Polisi
                  </Label>
                  <Input
                    id="edit-plate"
                    data-ocid="report.edit_plate_input"
                    value={plateNumber}
                    onChange={(event) => setPlateNumber(event.target.value)}
                    className="font-mono uppercase tracking-wider"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-vehicle" className="label-caps">
                    Nama / Model Kendaraan
                  </Label>
                  <Input
                    id="edit-vehicle"
                    data-ocid="report.edit_vehicle_input"
                    value={vehicleName}
                    onChange={(event) => setVehicleName(event.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-year" className="label-caps">
                    Tahun
                  </Label>
                  <Input
                    id="edit-year"
                    data-ocid="report.edit_year_input"
                    inputMode="numeric"
                    value={year}
                    onChange={(event) =>
                      setYear(
                        event.target.value.replace(/[^\d]/g, "").slice(0, 4),
                      )
                    }
                    className="font-mono tabular-nums"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-date" className="label-caps">
                    Tanggal Inspeksi
                  </Label>
                  <Input
                    id="edit-date"
                    data-ocid="report.edit_date_input"
                    type="date"
                    value={inspectionDate}
                    onChange={(event) => setInspectionDate(event.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              {headerError ? (
                <p
                  data-ocid="report.edit_header_error"
                  className="text-xs font-medium text-destructive"
                >
                  {headerError}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  data-ocid="report.edit_cancel_button"
                  onClick={() => setEditingHeader(false)}
                  className="rounded-full"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  data-ocid="report.edit_save_button"
                  onClick={saveHeader}
                  disabled={updateReport.isPending}
                  className="rounded-full"
                >
                  {updateReport.isPending ? "Menyimpan…" : "Simpan Perubahan"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-2">
                  <span className="plate-chip">{report.plateNumber}</span>
                  <h1 className="font-display text-xl font-bold leading-tight text-foreground sm:text-2xl">
                    {report.vehicleName}
                    {report.year > 0n ? (
                      <span className="ml-2 font-mono text-sm font-medium text-muted-foreground">
                        {report.year.toString()}
                      </span>
                    ) : null}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Inspeksi {formatInspectionDate(report.inspectionDate)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-ocid="report.edit_button"
                  onClick={startEditingHeader}
                  className="shrink-0 rounded-full"
                >
                  <Pencil aria-hidden="true" />
                  Ubah
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                <Button
                  type="button"
                  data-ocid="report.share_whatsapp_button"
                  onClick={handleShare}
                  className="rounded-full bg-success text-success-foreground hover:bg-success/90"
                >
                  <MessageCircle aria-hidden="true" />
                  Bagikan via WhatsApp
                </Button>
                {confirmDelete ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-full border border-destructive/40 bg-destructive/5 px-3 py-1">
                    <span className="text-xs font-medium text-destructive">
                      Hapus laporan ini?
                    </span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      data-ocid="report.delete_confirm_button"
                      onClick={() =>
                        deleteReport.mutate(report.id, {
                          onSuccess: () => void navigate({ to: "/" }),
                        })
                      }
                      disabled={deleteReport.isPending}
                      className="rounded-full"
                    >
                      Ya, Hapus
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      data-ocid="report.delete_cancel_button"
                      onClick={() => setConfirmDelete(false)}
                      className="rounded-full"
                    >
                      Batal
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    data-ocid="report.delete_button"
                    onClick={() => setConfirmDelete(true)}
                    className="rounded-full text-muted-foreground hover:border-destructive hover:text-destructive"
                  >
                    <Trash2 aria-hidden="true" />
                    Hapus Laporan
                  </Button>
                )}
              </div>
            </div>
          )}
        </section>

        <SummaryPanel summary={summary} />

        <section
          data-ocid="report.items_section"
          className="flex flex-col gap-4"
          aria-label="Item inspeksi"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-foreground">
              Item Inspeksi
            </h2>
            <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
              {report.items.length} item
            </span>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3.5 shadow-none">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-item-name" className="label-caps">
                  Nama Item Baru
                </Label>
                <Input
                  id="new-item-name"
                  data-ocid="report.new_item_input"
                  value={newItemName}
                  onChange={(event) => setNewItemName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddItem();
                    }
                  }}
                  placeholder="Contoh: Oli mesin"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-item-category" className="label-caps">
                  Kategori
                </Label>
                <Select
                  value={newItemCategory}
                  onValueChange={setNewItemCategory}
                >
                  <SelectTrigger
                    id="new-item-category"
                    data-ocid="report.new_item_category_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-item-status" className="label-caps">
                  Status
                </Label>
                <Select
                  value={newItemStatus}
                  onValueChange={(value) =>
                    setNewItemStatus(value as ItemStatus)
                  }
                >
                  <SelectTrigger
                    id="new-item-status"
                    data-ocid="report.new_item_status_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ItemStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {ITEM_STATUS_LABEL[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-item-part-price" className="label-caps">
                  Harga Part (Rupiah)
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    id="new-item-part-price"
                    data-ocid="report.new_item_part_price_input"
                    inputMode="numeric"
                    value={newItemPartPrice}
                    onChange={(event) =>
                      setNewItemPartPrice(
                        event.target.value.replace(/[^\d.]/g, ""),
                      )
                    }
                    placeholder="0"
                    className="pl-10 font-mono tabular-nums"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Kosongkan jika belum ada harga part.
                </p>
              </div>
            </div>

            {addError ? (
              <p
                data-ocid="report.new_item_error"
                className="text-xs font-medium text-destructive"
              >
                {addError}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                data-ocid="report.add_item_button"
                onClick={handleAddItem}
                disabled={addItem.isPending}
                className="rounded-full"
              >
                <Plus aria-hidden="true" />
                {addItem.isPending ? "Menambah…" : "Tambah Item"}
              </Button>
            </div>
          </div>

          {report.items.length === 0 ? (
            <div
              data-ocid="report.items_empty_state"
              className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center"
            >
              <h3 className="font-display text-base font-bold text-foreground">
                Belum ada item inspeksi
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Tambahkan item inspeksi di atas, lalu atur status kondisi, foto,
                dan data part pada setiap item.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {Array.from(grouped.entries()).map(([category, items]) => (
                <div key={category} className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <h3 className="label-caps">{category}</h3>
                    <span
                      className="h-px flex-1 bg-border"
                      aria-hidden="true"
                    />
                    <span className="font-mono text-[0.625rem] font-medium tabular-nums text-muted-foreground">
                      {items.length}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-2.5">
                    {items.map((item) => {
                      const globalIndex = report.items.findIndex(
                        (candidate) => candidate.id === item.id,
                      );
                      return (
                        <ItemEditor
                          key={item.id.toString()}
                          item={item}
                          index={globalIndex}
                          reportId={report.id}
                          isSaving={
                            updateItem.isPending &&
                            updateItem.variables?.itemId === item.id
                          }
                          onSave={(input) =>
                            updateItem.mutate({
                              reportId: report.id,
                              itemId: item.id,
                              input,
                            })
                          }
                          onDelete={() =>
                            deleteItem.mutate({
                              reportId: report.id,
                              itemId: item.id,
                            })
                          }
                        />
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Terakhir diperbarui{" "}
            {new Date(Number(report.updatedAt / 1_000_000n)).toLocaleDateString(
              "id-ID",
              {
                day: "numeric",
                month: "long",
                year: "numeric",
              },
            )}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-ocid="report.close_button"
            onClick={() => void navigate({ to: "/" })}
            className="rounded-full"
          >
            <X aria-hidden="true" />
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
