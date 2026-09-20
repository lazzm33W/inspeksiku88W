import { PhotoGallery } from "@/components/PhotoGallery";
import { StatusBadge } from "@/components/StatusBadge";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ITEM_STATUS_LABEL,
  ITEM_STATUS_ORDER,
  type InspectionItem,
  type ItemInput,
  ItemStatus,
  PART_AVAILABILITY_LABEL,
  PART_AVAILABILITY_ORDER,
  PartAvailability,
  formatRupiahInput,
  parseRupiah,
} from "@/types";
import { ChevronDown, Trash2 } from "lucide-react";
import { useState } from "react";

interface ItemEditorProps {
  item: InspectionItem;
  index: number;
  onSave: (input: ItemInput) => void;
  onDelete: () => void;
  isSaving: boolean;
  reportId: bigint;
}

export function ItemEditor({
  item,
  index,
  onSave,
  onDelete,
  isSaving,
  reportId,
}: ItemEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [status, setStatus] = useState<ItemStatus>(item.status);
  const [note, setNote] = useState(item.note);
  const [hasPart, setHasPart] = useState(!!item.part);
  const [partName, setPartName] = useState(item.part?.name ?? "");
  const [partAvailability, setPartAvailability] = useState<PartAvailability>(
    item.part?.availability ?? PartAvailability.available,
  );
  const [partPrice, setPartPrice] = useState(
    item.part ? formatRupiahInput(item.part.price) : "",
  );

  function handleSave() {
    const trimmedName = name.trim();
    if (trimmedName === "") return;
    const price = parseRupiah(partPrice);
    const shouldSavePart = hasPart || price > 0n;
    onSave({
      name: trimmedName,
      category: category.trim() === "" ? "Umum" : category.trim(),
      status,
      note: note.trim(),
      part: shouldSavePart
        ? {
            name: partName.trim() === "" ? trimmedName : partName.trim(),
            availability: partAvailability,
            price,
          }
        : undefined,
    });
  }

  return (
    <li
      data-ocid={`item.card.${index + 1}`}
      className="overflow-hidden rounded-lg border border-border bg-card shadow-none"
    >
      <div className="flex items-start gap-2 p-3.5">
        <button
          type="button"
          data-ocid={`item.toggle.${index + 1}`}
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-start gap-2.5 rounded-md text-left outline-none transition-smooth focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown
            className={cn(
              "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-180",
            )}
            aria-hidden="true"
          />
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="truncate font-body text-sm font-semibold text-foreground">
              {item.name}
            </span>
            <span className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={item.status} short />
              <span className="font-mono text-[0.625rem] font-medium uppercase tracking-wider text-muted-foreground">
                {item.category}
              </span>
              {item.part ? (
                <span className="font-mono text-[0.625rem] font-medium tabular-nums text-muted-foreground">
                  {formatRupiahInput(item.part.price) === ""
                    ? "Rp 0"
                    : `Rp ${formatRupiahInput(item.part.price)}`}
                </span>
              ) : null}
            </span>
          </span>
        </button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          data-ocid={`item.delete_button.${index + 1}`}
          onClick={onDelete}
          aria-label={`Hapus item ${item.name}`}
          className="size-8 shrink-0 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>

      {expanded ? (
        <div className="flex flex-col gap-4 border-t border-border bg-secondary/40 p-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`item-name-${index}`} className="label-caps">
                Nama Item
              </Label>
              <Input
                id={`item-name-${index}`}
                data-ocid={`item.name_input.${index + 1}`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Kampas rem depan"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`item-category-${index}`} className="label-caps">
                Kategori
              </Label>
              <Input
                id={`item-category-${index}`}
                data-ocid={`item.category_input.${index + 1}`}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Contoh: Rem"
              />
            </div>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="label-caps mb-1">Status Kondisi</legend>
            <div className="flex flex-wrap gap-2">
              {ITEM_STATUS_ORDER.map((option) => (
                <button
                  key={option}
                  type="button"
                  data-ocid={`item.status_${option}.${index + 1}`}
                  onClick={() => setStatus(option)}
                  aria-pressed={status === option}
                  className={cn(
                    "rounded-full border px-3 py-1.5 font-mono text-[0.6875rem] font-semibold uppercase tracking-wider outline-none transition-smooth focus-visible:ring-2 focus-visible:ring-ring",
                    status === option
                      ? option === ItemStatus.ok
                        ? "border-success bg-success text-success-foreground"
                        : option === ItemStatus.attention
                          ? "border-warning bg-warning text-warning-foreground"
                          : "border-destructive bg-destructive text-destructive-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  )}
                >
                  {ITEM_STATUS_LABEL[option]}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`item-note-${index}`} className="label-caps">
              Catatan Mekanik
            </Label>
            <Textarea
              id={`item-note-${index}`}
              data-ocid={`item.note_input.${index + 1}`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Tulis temuan atau rekomendasi untuk item ini…"
              rows={2}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-3">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                data-ocid={`item.part_toggle.${index + 1}`}
                checked={hasPart}
                onChange={(event) => setHasPart(event.target.checked)}
                className="size-4 shrink-0 rounded border-input accent-primary"
              />
              <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-foreground">
                Tambahkan data part
              </span>
            </label>

            {hasPart ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor={`part-name-${index}`} className="label-caps">
                    Nama Part
                  </Label>
                  <Input
                    id={`part-name-${index}`}
                    data-ocid={`item.part_name_input.${index + 1}`}
                    value={partName}
                    onChange={(event) => setPartName(event.target.value)}
                    placeholder="Contoh: Kampas rem depan"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor={`part-availability-${index}`}
                    className="label-caps"
                  >
                    Ketersediaan
                  </Label>
                  <Select
                    value={partAvailability}
                    onValueChange={(value) =>
                      setPartAvailability(value as PartAvailability)
                    }
                  >
                    <SelectTrigger
                      id={`part-availability-${index}`}
                      data-ocid={`item.part_availability_select.${index + 1}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PART_AVAILABILITY_ORDER.map((option) => (
                        <SelectItem key={option} value={option}>
                          {PART_AVAILABILITY_LABEL[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`part-price-${index}`} className="label-caps">
                Harga Part (Rupiah)
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                  Rp
                </span>
                <Input
                  id={`part-price-${index}`}
                  data-ocid={`item.part_price_input.${index + 1}`}
                  inputMode="numeric"
                  value={partPrice}
                  onChange={(event) =>
                    setPartPrice(event.target.value.replace(/[^\d.]/g, ""))
                  }
                  placeholder="0"
                  className="pl-10 font-mono tabular-nums"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="label-caps">Foto Kondisi</span>
            <PhotoGallery
              reportId={reportId}
              itemId={item.id}
              itemIndex={index}
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-ocid={`item.cancel_button.${index + 1}`}
              onClick={() => {
                setName(item.name);
                setCategory(item.category);
                setStatus(item.status);
                setNote(item.note);
                setHasPart(!!item.part);
                setPartName(item.part?.name ?? "");
                setPartAvailability(
                  item.part?.availability ?? PartAvailability.available,
                );
                setPartPrice(
                  item.part ? formatRupiahInput(item.part.price) : "",
                );
                setExpanded(false);
              }}
              className="rounded-full"
            >
              Tutup
            </Button>
            <Button
              type="button"
              size="sm"
              data-ocid={`item.save_button.${index + 1}`}
              onClick={handleSave}
              disabled={isSaving || name.trim() === ""}
              className="rounded-full"
            >
              {isSaving ? "Menyimpan…" : "Simpan Item"}
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
