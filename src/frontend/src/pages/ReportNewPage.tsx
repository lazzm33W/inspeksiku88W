import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateReport } from "@/hooks/useQueries";
import { DEFAULT_CATEGORIES, todayIso } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ClipboardCheck, Plus } from "lucide-react";
import { useState } from "react";

export function ReportNewPage() {
  const navigate = useNavigate();
  const createReport = useCreateReport();

  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [year, setYear] = useState("");
  const [inspectionDate, setInspectionDate] = useState(todayIso());
  const [touched, setTouched] = useState(false);

  const plateError = plateNumber.trim() === "";
  const vehicleError = vehicleName.trim() === "";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (plateError || vehicleError) return;

    const parsedYear = Number.parseInt(year.replace(/[^\d]/g, ""), 10);
    createReport.mutate(
      {
        plateNumber: plateNumber.trim().toUpperCase(),
        vehicleName: vehicleName.trim(),
        year: Number.isNaN(parsedYear) ? 0n : BigInt(parsedYear),
        inspectionDate,
      },
      {
        onSuccess: (reportId) => {
          void navigate({
            to: "/laporan/$reportId",
            params: { reportId: reportId.toString() },
          });
        },
      },
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-5 sm:px-6">
      <Button
        asChild
        variant="ghost"
        size="sm"
        data-ocid="report.back_button"
        className="-ml-2 mb-3 rounded-full text-muted-foreground"
      >
        <button type="button" onClick={() => void navigate({ to: "/" })}>
          <ArrowLeft aria-hidden="true" />
          Kembali
        </button>
      </Button>

      <section
        data-ocid="report.new_section"
        className="flex flex-col gap-5"
        aria-label="Buat laporan inspeksi baru"
      >
        <div className="flex flex-col gap-1">
          <span className="label-caps">Laporan Baru</span>
          <h1 className="font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            Identitas Kendaraan
          </h1>
          <p className="text-sm text-muted-foreground">
            Isi data kendaraan terlebih dahulu. Item inspeksi ditambahkan pada
            halaman laporan setelah ini.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-none sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plate-number" className="label-caps">
                Nomor Polisi <span className="text-destructive">*</span>
              </Label>
              <Input
                id="plate-number"
                data-ocid="report.plate_input"
                value={plateNumber}
                onChange={(event) => setPlateNumber(event.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="B 1234 XYZ"
                aria-invalid={touched && plateError}
                aria-describedby={
                  touched && plateError ? "plate-number-error" : undefined
                }
                className="font-mono uppercase tracking-wider"
              />
              {touched && plateError ? (
                <p
                  id="plate-number-error"
                  data-ocid="report.plate_error"
                  className="text-xs font-medium text-destructive"
                >
                  Nomor polisi wajib diisi.
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vehicle-name" className="label-caps">
                Nama / Model Kendaraan{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vehicle-name"
                data-ocid="report.vehicle_input"
                value={vehicleName}
                onChange={(event) => setVehicleName(event.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Toyota Avanza"
                aria-invalid={touched && vehicleError}
                aria-describedby={
                  touched && vehicleError ? "vehicle-name-error" : undefined
                }
              />
              {touched && vehicleError ? (
                <p
                  id="vehicle-name-error"
                  data-ocid="report.vehicle_error"
                  className="text-xs font-medium text-destructive"
                >
                  Nama kendaraan wajib diisi.
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vehicle-year" className="label-caps">
                Tahun
              </Label>
              <Input
                id="vehicle-year"
                data-ocid="report.year_input"
                inputMode="numeric"
                value={year}
                onChange={(event) =>
                  setYear(event.target.value.replace(/[^\d]/g, "").slice(0, 4))
                }
                placeholder="2019"
                className="font-mono tabular-nums"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inspection-date" className="label-caps">
                Tanggal Inspeksi
              </Label>
              <Input
                id="inspection-date"
                data-ocid="report.date_input"
                type="date"
                value={inspectionDate}
                onChange={(event) => setInspectionDate(event.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          <div className="rounded-md border border-border bg-secondary/60 p-3">
            <p className="label-caps mb-2">Kategori Inspeksi Standar</p>
            <ul className="flex flex-wrap gap-1.5">
              {DEFAULT_CATEGORIES.map((category) => (
                <li
                  key={category}
                  className="rounded-full border border-border bg-card px-2.5 py-0.5 font-mono text-[0.625rem] font-medium uppercase tracking-wider text-muted-foreground"
                >
                  {category}
                </li>
              ))}
            </ul>
          </div>

          {createReport.isError ? (
            <p
              data-ocid="report.create_error"
              className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive"
            >
              Gagal menyimpan laporan. Periksa koneksi lalu coba lagi.
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="ghost"
              data-ocid="report.cancel_button"
              onClick={() => void navigate({ to: "/" })}
              className="rounded-full"
            >
              Batal
            </Button>
            <Button
              type="submit"
              data-ocid="report.submit_button"
              disabled={createReport.isPending}
              className="rounded-full"
            >
              {createReport.isPending ? (
                "Menyimpan…"
              ) : (
                <>
                  <ClipboardCheck aria-hidden="true" />
                  Simpan &amp; Tambah Item
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-border bg-card px-4 py-3">
          <Plus
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-xs text-muted-foreground">
            Setelah laporan disimpan, Anda dapat menambah item inspeksi per
            kategori, mengatur status kondisi, melampirkan foto, dan mencatat
            harga part.
          </p>
        </div>
      </section>
    </div>
  );
}
