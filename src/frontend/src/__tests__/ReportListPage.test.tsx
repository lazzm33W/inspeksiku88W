import { ReportListPage } from "@/pages/ReportListPage";
import { ReportFilter, ReportSort } from "@/types";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type MockActor,
  createMockActor,
  makeReportListItem,
  renderAppRoutes,
} from "./harness";

const actorRef: { current: MockActor } = { current: createMockActor() };

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: actorRef.current, isFetching: false }),
}));

vi.mock("@/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/backend")>();
  return { ...actual, createActor: vi.fn() };
});

function renderList() {
  return renderAppRoutes(
    [
      { path: "/", component: ReportListPage },
      { path: "/laporan/baru", component: () => <div>Halaman Baru</div> },
      {
        path: "/laporan/$reportId",
        component: () => <div>Halaman Detail</div>,
      },
    ],
    "/",
  );
}

describe("ReportListPage", () => {
  beforeEach(() => {
    actorRef.current = createMockActor();
  });

  it("shows the empty state when there are no reports", async () => {
    actorRef.current.listReports.mockResolvedValue([]);
    renderList();

    expect(await screen.findByText("Belum ada laporan")).toBeInTheDocument();
    expect(
      screen.getByTestId("report.empty_create_button"),
    ).toBeInTheDocument();
  });

  it("renders each report with its plate, vehicle and status counts", async () => {
    actorRef.current.listReports.mockResolvedValue([
      makeReportListItem({
        id: 1n,
        plateNumber: "B 1234 XYZ",
        vehicleName: "Toyota Avanza",
        summary: {
          okCount: 2n,
          attentionCount: 1n,
          replaceCount: 3n,
          totalItems: 6n,
          estimatedPartCost: 275_000n,
        },
      }),
      makeReportListItem({
        id: 2n,
        plateNumber: "D 5678 AB",
        vehicleName: "Honda Beat",
      }),
    ]);
    renderList();

    expect(await screen.findByText("Toyota Avanza")).toBeInTheDocument();
    expect(screen.getByText("Honda Beat")).toBeInTheDocument();
    expect(screen.getByText("B 1234 XYZ")).toBeInTheDocument();
    expect(screen.getByText("Rp 275.000")).toBeInTheDocument();
    expect(
      screen.getByText("2 laporan tercatat · 3 item harus diganti"),
    ).toBeInTheDocument();
  });

  it("passes the typed search term to the actor as the user types", async () => {
    const user = userEvent.setup();
    actorRef.current.listReports.mockResolvedValue([]);
    renderList();

    await screen.findByText("Belum ada laporan");
    await user.type(screen.getByLabelText("Cari laporan"), "avanza");

    await waitFor(() => {
      expect(actorRef.current.listReports).toHaveBeenLastCalledWith(
        "avanza",
        ReportFilter.all,
        ReportSort.newestFirst,
      );
    });
  });

  it("passes the selected status filter and sort to the actor", async () => {
    const user = userEvent.setup();
    actorRef.current.listReports.mockResolvedValue([]);
    renderList();

    await screen.findByText("Belum ada laporan");
    await user.click(screen.getByRole("tab", { name: "Ada Harus Diganti" }));

    await waitFor(() => {
      expect(actorRef.current.listReports).toHaveBeenLastCalledWith(
        "",
        ReportFilter.hasReplace,
        ReportSort.newestFirst,
      );
    });
  });

  it("shows a filtered empty state and resets it", async () => {
    const user = userEvent.setup();
    actorRef.current.listReports.mockResolvedValue([]);
    renderList();

    await screen.findByText("Belum ada laporan");
    await user.type(screen.getByLabelText("Cari laporan"), "tidak-ada");

    expect(
      await screen.findByText("Tidak ada laporan cocok"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset Filter" }));

    expect(await screen.findByText("Belum ada laporan")).toBeInTheDocument();
    await waitFor(() => {
      expect(actorRef.current.listReports).toHaveBeenLastCalledWith(
        "",
        ReportFilter.all,
        ReportSort.newestFirst,
      );
    });
  });

  it("shows an error state with a retry action when the actor rejects", async () => {
    actorRef.current.listReports.mockRejectedValue(new Error("gagal"));
    renderList();

    expect(await screen.findByText("Gagal memuat laporan")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Coba Lagi" }),
    ).toBeInTheDocument();
  });
});
