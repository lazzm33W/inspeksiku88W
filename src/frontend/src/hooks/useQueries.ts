import { createActor } from "@/backend";
import type {
  ItemInput,
  PhotoInput,
  ReportFilter,
  ReportId,
  ReportInput,
  ReportSort,
} from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { ExternalBlob } from "@caffeineai/object-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const reportKeys = {
  all: ["reports"] as const,
  list: (search: string, filter: ReportFilter, sort: ReportSort) =>
    ["reports", "list", search, filter, sort] as const,
  detail: (id: ReportId) => ["reports", "detail", id.toString()] as const,
  photos: (reportId: ReportId, itemId: bigint) =>
    ["reports", "photos", reportId.toString(), itemId.toString()] as const,
};

export function useListReports(
  search: string,
  filter: ReportFilter,
  sort: ReportSort,
) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: reportKeys.list(search, filter, sort),
    queryFn: async () => {
      if (!actor) return [];
      return actor.listReports(search, filter, sort);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useReport(id: ReportId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: reportKeys.detail(id ?? 0n),
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getReport(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useItemPhotos(reportId: ReportId, itemId: bigint) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: reportKeys.photos(reportId, itemId),
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPhotos(reportId, itemId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateReport() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReportInput) => {
      if (!actor) throw new Error("Backend belum siap");
      return actor.createReport(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

export function useUpdateReport() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: ReportId; input: ReportInput }) => {
      if (!actor) throw new Error("Backend belum siap");
      return actor.updateReport(vars.id, vars.input);
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all });
      void queryClient.invalidateQueries({
        queryKey: reportKeys.detail(vars.id),
      });
    },
  });
}

export function useDeleteReport() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: ReportId) => {
      if (!actor) throw new Error("Backend belum siap");
      return actor.deleteReport(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

export function useAddItem() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { reportId: ReportId; input: ItemInput }) => {
      if (!actor) throw new Error("Backend belum siap");
      return actor.addItem(vars.reportId, vars.input);
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: reportKeys.detail(vars.reportId),
      });
      void queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

export function useUpdateItem() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      reportId: ReportId;
      itemId: bigint;
      input: ItemInput;
    }) => {
      if (!actor) throw new Error("Backend belum siap");
      return actor.updateItem(vars.reportId, vars.itemId, vars.input);
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: reportKeys.detail(vars.reportId),
      });
      void queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

export function useDeleteItem() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { reportId: ReportId; itemId: bigint }) => {
      if (!actor) throw new Error("Backend belum siap");
      return actor.deleteItem(vars.reportId, vars.itemId);
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: reportKeys.detail(vars.reportId),
      });
      void queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

export function useAddPhoto() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      reportId: ReportId;
      itemId: bigint;
      input: PhotoInput;
    }) => {
      if (!actor) throw new Error("Backend belum siap");
      return actor.addPhoto(vars.reportId, vars.itemId, vars.input);
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: reportKeys.photos(vars.reportId, vars.itemId),
      });
      void queryClient.invalidateQueries({
        queryKey: reportKeys.detail(vars.reportId),
      });
    },
  });
}

export function useDeletePhoto() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      reportId: ReportId;
      itemId: bigint;
      photoId: bigint;
    }) => {
      if (!actor) throw new Error("Backend belum siap");
      return actor.deletePhoto(vars.reportId, vars.itemId, vars.photoId);
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: reportKeys.photos(vars.reportId, vars.itemId),
      });
      void queryClient.invalidateQueries({
        queryKey: reportKeys.detail(vars.reportId),
      });
    },
  });
}

/** Build an ExternalBlob from a picked file, reporting upload progress. */
export function fileToExternalBlob(
  bytes: Uint8Array<ArrayBuffer>,
  mimeType: string,
  filename: string,
  onProgress?: (percentage: number) => void,
): ExternalBlob {
  const blob = ExternalBlob.fromBytes(bytes, mimeType, filename);
  return onProgress ? blob.withUploadProgress(onProgress) : blob;
}

/** Read a File into bytes so the storage client can upload it. */
export async function readFileBytes(
  file: File,
): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}
