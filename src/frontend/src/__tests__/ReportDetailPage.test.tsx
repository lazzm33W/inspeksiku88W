import { ReportDetailPage } from "@/pages/ReportDetailPage";
import { ItemStatus, PartAvailability } from "@/types";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type MockActor,
  createMockActor,
  makeItem,
  makePhoto,
  makeReportView,
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

function renderDetail() {
  return renderAppRoutes(
    [
      { path: "/", component: () => <div>Halaman Daftar</div> },
      { path: "/laporan/baru", component: () => <div>Halaman Baru</div> },
      { path: "/laporan/$reportId", component: ReportDetailPage },
    ],
    "/laporan/1",
  );
}

describe("ReportDetailPage", () => {
  beforeEach(() => {
    actorRef.current = createMockActor();
  });

  it("shows the summary counts and Rupiah cost estimate for the report", async () => {
    actorRef.current.getReport.mockResolvedValue(
      makeReportView({
        items: [
          makeItem({ id: 1n, name: "Oli mesin", status: ItemStatus.ok }),
          makeItem({ id: 2n, name: "Busi", status: ItemStatus.attention }),
          makeItem({
            id: 3n,
            name: "Kampas rem",
            status: ItemStatus.replace,
            part: {
              name: "Kampas rem",
              availability: PartAvailability.order,
              price: 200_000n,
            },
          }),
        ],
        summary: {
          okCount: 1n,
          attentionCount: 1n,
          replaceCount: 1n,
          totalItems: 3n,
          estimatedPartCost: 200_000n,
        },
      }),
    );
    renderDetail();

    const panel = await screen.findByTestId("report.summary_panel");
    expect(within(panel).getByText("OK")).toBeInTheDocument();
    expect(within(panel).getByText("Perhatian")).toBeInTheDocument();
    expect(within(panel).getByText("Ganti")).toBeInTheDocument();
    expect(within(panel).getByText("Total Item")).toBeInTheDocument();
    expect(screen.getByTestId("report.summary_cost")).toHaveTextContent(
      "Rp 200.000",
    );
  });

  it("groups items by category and shows the empty state when there are none", async () => {
    actorRef.current.getReport.mockResolvedValue(makeReportView({ items: [] }));
    renderDetail();

    expect(
      await screen.findByTestId("report.items_empty_state"),
    ).toBeInTheDocument();
  });

  it("saves an item's status, note and part data through the actor", async () => {
    const user = userEvent.setup();
    actorRef.current.getReport.mockResolvedValue(
      makeReportView({
        items: [
          makeItem({ id: 7n, name: "Kampas rem depan", category: "Rem" }),
        ],
      }),
    );
    renderDetail();

    await user.click(await screen.findByTestId("item.toggle.1"));
    await user.click(screen.getByTestId("item.status_replace.1"));
    await user.type(
      screen.getByTestId("item.note_input.1"),
      "Aus, harus diganti",
    );
    await user.click(screen.getByTestId("item.part_toggle.1"));
    await user.type(screen.getByTestId("item.part_name_input.1"), "Kampas rem");
    await user.type(screen.getByTestId("item.part_price_input.1"), "150000");
    await user.click(screen.getByTestId("item.save_button.1"));

    await waitFor(() => {
      expect(actorRef.current.updateItem).toHaveBeenCalledWith(
        1n,
        7n,
        expect.objectContaining({
          name: "Kampas rem depan",
          category: "Rem",
          status: ItemStatus.replace,
          note: "Aus, harus diganti",
          part: {
            name: "Kampas rem",
            availability: PartAvailability.available,
            price: 150_000n,
          },
        }),
      );
    });
  });

  it("adds a new inspection item with the chosen category and status", async () => {
    const user = userEvent.setup();
    actorRef.current.getReport.mockResolvedValue(makeReportView({ items: [] }));
    renderDetail();

    await user.type(
      await screen.findByTestId("report.new_item_input"),
      "Filter udara",
    );
    await user.click(screen.getByTestId("report.add_item_button"));

    await waitFor(() => {
      expect(actorRef.current.addItem).toHaveBeenCalledWith(
        1n,
        expect.objectContaining({
          name: "Filter udara",
          category: "Mesin",
          status: ItemStatus.ok,
        }),
      );
    });
  });

  it("shows the part price input on the new item form and saves the typed price", async () => {
    const user = userEvent.setup();
    actorRef.current.getReport.mockResolvedValue(makeReportView({ items: [] }));
    renderDetail();

    const priceInput = await screen.findByTestId(
      "report.new_item_part_price_input",
    );
    expect(priceInput).toBeInTheDocument();
    expect(screen.getByLabelText("Harga Part (Rupiah)")).toBeInTheDocument();

    await user.type(
      screen.getByTestId("report.new_item_input"),
      "Filter udara",
    );
    await user.type(priceInput, "150000");
    await user.click(screen.getByTestId("report.add_item_button"));

    await waitFor(() => {
      expect(actorRef.current.addItem).toHaveBeenCalledWith(
        1n,
        expect.objectContaining({
          name: "Filter udara",
          part: {
            name: "Filter udara",
            availability: PartAvailability.available,
            price: 150_000n,
          },
        }),
      );
    });
  });

  it("adds a new item without a part when the price is left empty", async () => {
    const user = userEvent.setup();
    actorRef.current.getReport.mockResolvedValue(makeReportView({ items: [] }));
    renderDetail();

    await user.type(
      await screen.findByTestId("report.new_item_input"),
      "Filter udara",
    );
    await user.click(screen.getByTestId("report.add_item_button"));

    await waitFor(() => {
      expect(actorRef.current.addItem).toHaveBeenCalledWith(
        1n,
        expect.objectContaining({ name: "Filter udara", part: undefined }),
      );
    });
  });

  it("updates the estimated part cost after saving a price on an item", async () => {
    const user = userEvent.setup();
    actorRef.current.getReport.mockResolvedValue(
      makeReportView({
        items: [
          makeItem({
            id: 7n,
            name: "Kampas rem depan",
            category: "Rem",
            status: ItemStatus.replace,
          }),
        ],
      }),
    );
    renderDetail();

    expect(await screen.findByTestId("report.summary_cost")).toHaveTextContent(
      "Rp 0",
    );

    await user.click(await screen.findByTestId("item.toggle.1"));
    await user.type(screen.getByTestId("item.part_price_input.1"), "150000");
    await user.click(screen.getByTestId("item.save_button.1"));

    await waitFor(() => {
      expect(actorRef.current.updateItem).toHaveBeenCalledWith(
        1n,
        7n,
        expect.objectContaining({
          part: expect.objectContaining({ price: 150_000n }),
        }),
      );
    });
  });

  it("requires an item name before adding", async () => {
    const user = userEvent.setup();
    actorRef.current.getReport.mockResolvedValue(makeReportView({ items: [] }));
    renderDetail();

    await user.click(await screen.findByTestId("report.add_item_button"));

    expect(
      await screen.findByTestId("report.new_item_error"),
    ).toHaveTextContent("Nama item inspeksi wajib diisi.");
    expect(actorRef.current.addItem).not.toHaveBeenCalled();
  });

  it("opens WhatsApp with a pre-filled summary message", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    actorRef.current.getReport.mockResolvedValue(
      makeReportView({
        plateNumber: "B 1234 XYZ",
        vehicleName: "Toyota Avanza",
        year: 2019n,
        inspectionDate: "2024-03-12",
        items: [
          makeItem({
            id: 1n,
            name: "Kampas rem",
            category: "Rem",
            status: ItemStatus.replace,
            part: {
              name: "Kampas rem",
              availability: PartAvailability.order,
              price: 200_000n,
            },
          }),
        ],
        summary: {
          okCount: 0n,
          attentionCount: 0n,
          replaceCount: 1n,
          totalItems: 1n,
          estimatedPartCost: 200_000n,
        },
      }),
    );
    renderDetail();

    await user.click(await screen.findByTestId("report.share_whatsapp_button"));

    expect(openSpy).toHaveBeenCalledTimes(1);
    const [url] = openSpy.mock.calls[0]!;
    expect(String(url)).toContain("https://wa.me/?text=");
    const message = decodeURIComponent(String(url).split("text=")[1] ?? "");
    expect(message).toContain("Nomor Polisi: B 1234 XYZ");
    expect(message).toContain("Kendaraan: Toyota Avanza (2019)");
    expect(message).toContain("Harus Diganti: 1 item");
    expect(message).toContain("Estimasi biaya part: Rp 200.000");
    openSpy.mockRestore();
  });

  it("edits the report header and saves it through the actor", async () => {
    const user = userEvent.setup();
    actorRef.current.getReport.mockResolvedValue(
      makeReportView({
        plateNumber: "B 1234 XYZ",
        vehicleName: "Toyota Avanza",
        year: 2019n,
        inspectionDate: "2024-03-12",
      }),
    );
    renderDetail();

    await user.click(await screen.findByTestId("report.edit_button"));
    const vehicleInput = screen.getByTestId("report.edit_vehicle_input");
    await user.clear(vehicleInput);
    await user.type(vehicleInput, "Toyota Avanza Facelift");
    await user.click(screen.getByTestId("report.edit_save_button"));

    await waitFor(() => {
      expect(actorRef.current.updateReport).toHaveBeenCalledWith(
        1n,
        expect.objectContaining({
          plateNumber: "B 1234 XYZ",
          vehicleName: "Toyota Avanza Facelift",
          year: 2019n,
          inspectionDate: "2024-03-12",
        }),
      );
    });
  });

  it("requires a plate and vehicle name before saving the header", async () => {
    const user = userEvent.setup();
    actorRef.current.getReport.mockResolvedValue(makeReportView());
    renderDetail();

    await user.click(await screen.findByTestId("report.edit_button"));
    await user.clear(screen.getByTestId("report.edit_plate_input"));
    await user.click(screen.getByTestId("report.edit_save_button"));

    expect(
      await screen.findByTestId("report.edit_header_error"),
    ).toHaveTextContent("Nomor polisi dan nama kendaraan wajib diisi.");
    expect(actorRef.current.updateReport).not.toHaveBeenCalled();
  });

  it("deletes the report after confirmation and returns to the list", async () => {
    const user = userEvent.setup();
    actorRef.current.getReport.mockResolvedValue(makeReportView());
    renderDetail();

    await user.click(await screen.findByTestId("report.delete_button"));
    await user.click(screen.getByTestId("report.delete_confirm_button"));

    await waitFor(() => {
      expect(actorRef.current.deleteReport).toHaveBeenCalledWith(1n);
    });
    expect(await screen.findByText("Halaman Daftar")).toBeInTheDocument();
  });

  it("renders photo thumbnails and deletes a photo", async () => {
    const user = userEvent.setup();
    actorRef.current.getReport.mockResolvedValue(
      makeReportView({
        items: [
          makeItem({ id: 5n, name: "Ban depan", category: "Ban & Kaki-kaki" }),
        ],
      }),
    );
    actorRef.current.listPhotos.mockResolvedValue([
      makePhoto({ id: 9n, filename: "ban-depan.jpg" }),
    ]);
    renderDetail();

    await user.click(await screen.findByTestId("item.toggle.1"));

    const thumbnail = await screen.findByTestId("item.photo.1.1");
    expect(thumbnail).toBeInTheDocument();
    expect(
      within(thumbnail).getByAltText("Foto kondisi ban-depan.jpg"),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId("item.photo_delete_button.1.1"));

    await waitFor(() => {
      expect(actorRef.current.deletePhoto).toHaveBeenCalledWith(1n, 5n, 9n);
    });
  });
});
