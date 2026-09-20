import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  fileToExternalBlob,
  readFileBytes,
  useAddPhoto,
  useDeletePhoto,
  useItemPhotos,
} from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import type { Photo, ReportId } from "@/types";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

interface PhotoGalleryProps {
  reportId: ReportId;
  itemId: bigint;
  itemIndex: number;
}

interface PendingUpload {
  key: string;
  name: string;
  progress: number;
}

export function PhotoGallery({
  reportId,
  itemId,
  itemIndex,
}: PhotoGalleryProps) {
  const { data: photos = [], isLoading } = useItemPhotos(reportId, itemId);
  const addPhoto = useAddPhoto();
  const deletePhoto = useDeletePhoto();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [preview, setPreview] = useState<Photo | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    const files = Array.from(fileList);

    for (const file of files) {
      const key = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
      setPending((current) => [
        ...current,
        { key, name: file.name, progress: 0 },
      ]);

      try {
        const bytes = await readFileBytes(file);
        const blob = fileToExternalBlob(
          bytes,
          file.type || "image/jpeg",
          file.name,
          (percentage) => {
            setPending((current) =>
              current.map((entry) =>
                entry.key === key ? { ...entry, progress: percentage } : entry,
              ),
            );
          },
        );

        await addPhoto.mutateAsync({
          reportId,
          itemId,
          input: {
            blob,
            mimeType: file.type || "image/jpeg",
            filename: file.name,
          },
        });
      } catch {
        setError(`Gagal mengunggah ${file.name}. Coba lagi.`);
      } finally {
        setPending((current) => current.filter((entry) => entry.key !== key));
      }
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-ocid={`item.camera_button.${itemIndex + 1}`}
          onClick={() => cameraInputRef.current?.click()}
          className="rounded-full"
        >
          <Camera aria-hidden="true" />
          Kamera
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-ocid={`item.upload_button.${itemIndex + 1}`}
          onClick={() => galleryInputRef.current?.click()}
          className="rounded-full"
        >
          <ImagePlus aria-hidden="true" />
          Galeri
        </Button>
      </div>

      {pending.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {pending.map((entry) => (
            <li
              key={entry.key}
              data-ocid={`item.upload_progress.${itemIndex + 1}`}
              className="flex items-center gap-2.5 rounded-md border border-border bg-secondary/60 px-3 py-2"
            >
              <Loader2
                className="size-3.5 shrink-0 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {entry.name}
              </span>
              <Progress
                value={entry.progress}
                className="h-1.5 w-20 shrink-0"
              />
              <span className="w-9 shrink-0 text-right font-mono text-[0.625rem] tabular-nums text-muted-foreground">
                {Math.round(entry.progress)}%
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p
          data-ocid={`item.upload_error.${itemIndex + 1}`}
          className="text-xs font-medium text-destructive"
        >
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Memuat foto…</p>
      ) : photos.length === 0 && pending.length === 0 ? (
        <p
          data-ocid={`item.photos_empty.${itemIndex + 1}`}
          className="text-xs text-muted-foreground"
        >
          Belum ada foto kondisi untuk item ini.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {photos.map((photo, photoIndex) => (
            <li key={photo.id.toString()} className="group relative">
              <button
                type="button"
                data-ocid={`item.photo.${itemIndex + 1}.${photoIndex + 1}`}
                onClick={() => setPreview(photo)}
                className="block size-20 overflow-hidden rounded-md border border-border bg-secondary outline-none transition-smooth hover:border-primary focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Perbesar foto ${photo.filename}`}
              >
                <img
                  src={photo.blob.getDirectURL()}
                  alt={`Foto kondisi ${photo.filename}`}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </button>
              <button
                type="button"
                data-ocid={`item.photo_delete_button.${itemIndex + 1}.${photoIndex + 1}`}
                onClick={() =>
                  deletePhoto.mutate({ reportId, itemId, photoId: photo.id })
                }
                aria-label={`Hapus foto ${photo.filename}`}
                className={cn(
                  "absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-subtle outline-none transition-smooth",
                  "hover:border-destructive hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {preview ? (
        <Dialog open onOpenChange={(open) => !open && setPreview(null)}>
          <DialogContent
            data-ocid={`item.photo_preview.${itemIndex + 1}`}
            className="max-w-2xl border-border bg-card p-3"
          >
            <DialogTitle className="sr-only">
              Pratinjau foto kondisi
            </DialogTitle>
            <DialogDescription className="sr-only">
              Foto kondisi {preview.filename}
            </DialogDescription>
            <img
              src={preview.blob.getDirectURL()}
              alt={`Foto kondisi ${preview.filename}`}
              className="mx-auto max-h-[75vh] w-auto rounded-md object-contain"
            />
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
