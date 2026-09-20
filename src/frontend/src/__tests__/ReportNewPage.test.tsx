import { ReportNewPage } from "@/pages/ReportNewPage";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type MockActor, createMockActor, renderAppRoutes } from "./harness";

const actorRef: { current: MockActor } = { current: createMockActor() };

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: actorRef.current, isFetching: false }),
}));

vi.mock("@/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/backend")>();
  return { ...actual, createActor: vi.fn() };
});

function renderNew() {
  return renderAppRoutes(
    [
      { path: "/", component: () => <div>Halaman Daftar</div> },
      { path: "/laporan/baru", component: ReportNewPage },
      {
        path: "/laporan/$reportId",
        component: () => <div>Halaman Detail</div>,
      },
    ],
    "/laporan/baru",
  );
}

describe("ReportNewPage", () => {
  beforeEach(() => {
    actorRef.current = createMockActor();
  });

  it("blocks submission and shows required-field errors when both fields are empty", async () => {
    const user = userEvent.setup();
    renderNew();

    await user.click(await screen.findByTestId("report.submit_button"));

    expect(await screen.findByTestId("report.plate_error")).toHaveTextContent(
      "Nomor polisi wajib diisi.",
    );
    expect(screen.getByTestId("report.vehicle_error")).toHaveTextContent(
      "Nama kendaraan wajib diisi.",
    );
    expect(actorRef.current.createReport).not.toHaveBeenCalled();
  });

  it("creates a report with the typed header and navigates to its detail page", async () => {
    const user = userEvent.setup();
    actorRef.current.createReport.mockResolvedValue(42n);
    renderNew();

    await user.type(
      await screen.findByTestId("report.plate_input"),
      "b 1234 xyz",
    );
    await user.type(
      screen.getByTestId("report.vehicle_input"),
      "Toyota Avanza",
    );
    await user.type(screen.getByTestId("report.year_input"), "2019");
    await user.click(screen.getByTestId("report.submit_button"));

    await waitFor(() => {
      expect(actorRef.current.createReport).toHaveBeenCalledWith({
        plateNumber: "B 1234 XYZ",
        vehicleName: "Toyota Avanza",
        year: 2019n,
        inspectionDate: expect.any(String),
      });
    });

    expect(await screen.findByText("Halaman Detail")).toBeInTheDocument();
  });

  it("shows an error message when the create call rejects", async () => {
    const user = userEvent.setup();
    actorRef.current.createReport.mockRejectedValue(new Error("gagal"));
    renderNew();

    await user.type(
      await screen.findByTestId("report.plate_input"),
      "B 1234 XYZ",
    );
    await user.type(
      screen.getByTestId("report.vehicle_input"),
      "Toyota Avanza",
    );
    await user.click(screen.getByTestId("report.submit_button"));

    expect(await screen.findByTestId("report.create_error")).toHaveTextContent(
      "Gagal menyimpan laporan.",
    );
  });
});
