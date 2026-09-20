import type {
  InspectionItem,
  ItemInput,
  Photo,
  PhotoInput,
  ReportFilter,
  ReportId,
  ReportInput,
  ReportListItem,
  ReportSort,
  ReportSummary,
  ReportView,
} from "@/types";
import { ItemStatus, PartAvailability } from "@/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";

/**
 * The subset of the generated `Backend` class the app's hooks actually call.
 * Every method is a `vi.fn` so a test can assert the exact actor call the UI
 * made, and so the mock is typed against the app's own exported types.
 */
export interface MockActor {
  listReports: ReturnType<
    typeof vi.fn<
      (
        search: string,
        filter: ReportFilter,
        sort: ReportSort,
      ) => Promise<ReportListItem[]>
    >
  >;
  getReport: ReturnType<
    typeof vi.fn<(id: ReportId) => Promise<ReportView | null>>
  >;
  listPhotos: ReturnType<
    typeof vi.fn<(reportId: ReportId, itemId: bigint) => Promise<Photo[]>>
  >;
  createReport: ReturnType<
    typeof vi.fn<(input: ReportInput) => Promise<ReportId>>
  >;
  updateReport: ReturnType<
    typeof vi.fn<(id: ReportId, input: ReportInput) => Promise<boolean>>
  >;
  deleteReport: ReturnType<typeof vi.fn<(id: ReportId) => Promise<boolean>>>;
  addItem: ReturnType<
    typeof vi.fn<
      (reportId: ReportId, input: ItemInput) => Promise<bigint | null>
    >
  >;
  updateItem: ReturnType<
    typeof vi.fn<
      (reportId: ReportId, itemId: bigint, input: ItemInput) => Promise<boolean>
    >
  >;
  deleteItem: ReturnType<
    typeof vi.fn<(reportId: ReportId, itemId: bigint) => Promise<boolean>>
  >;
  addPhoto: ReturnType<
    typeof vi.fn<
      (
        reportId: ReportId,
        itemId: bigint,
        input: PhotoInput,
      ) => Promise<bigint | null>
    >
  >;
  deletePhoto: ReturnType<
    typeof vi.fn<
      (reportId: ReportId, itemId: bigint, photoId: bigint) => Promise<boolean>
    >
  >;
}

export function createMockActor(): MockActor {
  return {
    listReports: vi.fn(async () => []),
    getReport: vi.fn(async () => null),
    listPhotos: vi.fn(async () => []),
    createReport: vi.fn(async () => 1n),
    updateReport: vi.fn(async () => true),
    deleteReport: vi.fn(async () => true),
    addItem: vi.fn(async () => 1n),
    updateItem: vi.fn(async () => true),
    deleteItem: vi.fn(async () => true),
    addPhoto: vi.fn(async () => 1n),
    deletePhoto: vi.fn(async () => true),
  };
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

export function makeItem(
  overrides: Partial<InspectionItem> = {},
): InspectionItem {
  return {
    id: 1n,
    name: "Oli mesin",
    category: "Mesin",
    status: ItemStatus.ok,
    note: "",
    part: undefined,
    ...overrides,
  };
}

export function makeReportView(
  overrides: Partial<ReportView> = {},
): ReportView {
  return {
    id: 1n,
    plateNumber: "B 1234 XYZ",
    vehicleName: "Toyota Avanza",
    year: 2019n,
    inspectionDate: "2024-03-12",
    items: [],
    summary: emptySummary(),
    createdAt: 1_700_000_000_000_000_000n,
    updatedAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

export function makeReportListItem(
  overrides: Partial<ReportListItem> = {},
): ReportListItem {
  return {
    id: 1n,
    plateNumber: "B 1234 XYZ",
    vehicleName: "Toyota Avanza",
    year: 2019n,
    inspectionDate: "2024-03-12",
    summary: emptySummary(),
    createdAt: 1_700_000_000_000_000_000n,
    updatedAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

export function makePhoto(overrides: Partial<Photo> = {}): Photo {
  return {
    id: 1n,
    blob: {
      getDirectURL: () => "https://example.invalid/photo.jpg",
    } as unknown as Photo["blob"],
    mimeType: "image/jpeg",
    filename: "foto.jpg",
    ...overrides,
  };
}

export { ItemStatus, PartAvailability };

/**
 * Render a component inside a fresh QueryClient. Retries are disabled so a
 * rejected actor call surfaces as an error state immediately instead of after
 * React Query's default backoff.
 */
export function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

interface RouteSpec {
  path: string;
  component: () => ReactElement;
}

/**
 * Render the app's real route tree in memory, with the same paths the app
 * registers, so navigation between pages is exercised end to end.
 */
export function renderAppRoutes(
  routes: RouteSpec[],
  initialPath: string,
  wrapper?: (children: ReactNode) => ReactElement,
) {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        <Outlet />
      </>
    ),
  });
  const childRoutes = routes.map((route) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: route.path,
      component: route.component,
    }),
  );
  const router = createRouter({
    routeTree: rootRoute.addChildren(childRoutes),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  const tree = <RouterProvider router={router} />;
  return render(
    <QueryClientProvider client={queryClient}>
      {wrapper ? wrapper(tree) : tree}
    </QueryClientProvider>,
  );
}
