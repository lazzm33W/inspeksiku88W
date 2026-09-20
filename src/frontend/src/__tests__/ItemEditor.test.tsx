import { ItemEditor } from "@/components/ItemEditor";
import { ItemStatus, PartAvailability } from "@/types";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type MockActor,
  createMockActor,
  makeItem,
  renderWithQueryClient,
} from "./harness";

const actorRef: { current: MockActor } = { current: createMockActor() };

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: actorRef.current, isFetching: false }),
}));

vi.mock("@/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/backend")>();
  return { ...actual, createActor: vi.fn() };
});

interface RenderEditorOptions {
  item?: Parameters<typeof makeItem>[0];
}

function renderEditor(options: RenderEditorOptions = {}) {
  const onSave = vi.fn();
  const onDelete = vi.fn();
  renderWithQueryClient(
    <ItemEditor
      item={makeItem(options.item)}
      index={0}
      reportId={1n}
      isSaving={false}
      onSave={onSave}
      onDelete={onDelete}
    />,
  );
  return { onSave, onDelete };
}

describe("ItemEditor", () => {
  beforeEach(() => {
    actorRef.current = createMockActor();
  });

  it("keeps the editor fields hidden until the card is expanded", async () => {
    const user = userEvent.setup();
    renderEditor({ item: { name: "Oli mesin", category: "Mesin" } });

    expect(screen.queryByTestId("item.name_input.1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("item.note_input.1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("item.part_toggle.1")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("item.toggle.1"));

    expect(screen.getByTestId("item.name_input.1")).toBeInTheDocument();
    expect(screen.getByTestId("item.note_input.1")).toBeInTheDocument();
    expect(screen.getByTestId("item.part_toggle.1")).toBeInTheDocument();
  });

  it("collapses the editor again when the card header is toggled", async () => {
    const user = userEvent.setup();
    renderEditor({ item: { name: "Oli mesin" } });

    const toggle = screen.getByTestId("item.toggle.1");
    await user.click(toggle);
    expect(screen.getByTestId("item.name_input.1")).toBeInTheDocument();

    await user.click(toggle);
    expect(screen.queryByTestId("item.name_input.1")).not.toBeInTheDocument();
  });

  it("shows the recorded part price on the collapsed card summary", () => {
    renderEditor({
      item: {
        name: "Kampas rem",
        category: "Rem",
        status: ItemStatus.replace,
        part: {
          name: "Kampas rem",
          availability: PartAvailability.order,
          price: 200_000n,
        },
      },
    });

    expect(screen.getByText("Rp 200.000")).toBeInTheDocument();
  });

  it("does not show a price on the collapsed card when no part is recorded", () => {
    renderEditor({ item: { name: "Oli mesin", part: undefined } });

    expect(screen.queryByText(/^Rp /)).not.toBeInTheDocument();
  });

  it("shows the part price input as soon as the card is expanded, without the checkbox", async () => {
    const user = userEvent.setup();
    renderEditor({ item: { name: "Kampas rem", part: undefined } });

    expect(
      screen.queryByTestId("item.part_price_input.1"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByTestId("item.toggle.1"));

    expect(screen.getByTestId("item.part_price_input.1")).toBeInTheDocument();
    expect(screen.getByLabelText("Harga Part (Rupiah)")).toBeInTheDocument();
    expect(screen.getByTestId("item.part_toggle.1")).not.toBeChecked();
    expect(
      screen.queryByTestId("item.part_name_input.1"),
    ).not.toBeInTheDocument();
  });

  it("treats an empty price as Rp 0 when the part checkbox is checked", async () => {
    const user = userEvent.setup();
    const { onSave } = renderEditor({
      item: { name: "Kampas rem", category: "Rem" },
    });

    await user.click(screen.getByTestId("item.toggle.1"));
    await user.click(screen.getByTestId("item.part_toggle.1"));
    await user.click(screen.getByTestId("item.save_button.1"));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Kampas rem",
          part: {
            name: "Kampas rem",
            availability: PartAvailability.available,
            price: 0n,
          },
        }),
      );
    });
  });

  it("saves a part price typed without checking the optional checkbox", async () => {
    const user = userEvent.setup();
    const { onSave } = renderEditor({
      item: { name: "Kampas rem", category: "Rem" },
    });

    await user.click(screen.getByTestId("item.toggle.1"));
    await user.type(screen.getByTestId("item.part_price_input.1"), "150000");
    await user.click(screen.getByTestId("item.save_button.1"));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          part: {
            name: "Kampas rem",
            availability: PartAvailability.available,
            price: 150_000n,
          },
        }),
      );
    });
  });

  it("keeps the optional part checkbox and reveals the part fields when checked", async () => {
    const user = userEvent.setup();
    renderEditor({ item: { name: "Kampas rem", part: undefined } });

    await user.click(screen.getByTestId("item.toggle.1"));

    const checkbox = screen.getByTestId("item.part_toggle.1");
    expect(checkbox).not.toBeChecked();
    expect(
      screen.queryByTestId("item.part_name_input.1"),
    ).not.toBeInTheDocument();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(screen.getByTestId("item.part_name_input.1")).toBeInTheDocument();
    expect(
      screen.getByTestId("item.part_availability_select.1"),
    ).toBeInTheDocument();
  });

  it("saves the part name, availability and price through onSave", async () => {
    const user = userEvent.setup();
    const { onSave } = renderEditor({
      item: { name: "Kampas rem depan", category: "Rem" },
    });

    await user.click(screen.getByTestId("item.toggle.1"));
    await user.click(screen.getByTestId("item.part_toggle.1"));
    await user.type(screen.getByTestId("item.part_name_input.1"), "Kampas rem");
    await user.type(screen.getByTestId("item.part_price_input.1"), "150000");
    await user.click(screen.getByTestId("item.save_button.1"));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Kampas rem depan",
          category: "Rem",
          part: {
            name: "Kampas rem",
            availability: PartAvailability.available,
            price: 150_000n,
          },
        }),
      );
    });
  });

  it("saves no part when the optional checkbox is left unchecked", async () => {
    const user = userEvent.setup();
    const { onSave } = renderEditor({
      item: { name: "Oli mesin", category: "Mesin" },
    });

    await user.click(screen.getByTestId("item.toggle.1"));
    await user.click(screen.getByTestId("item.save_button.1"));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Oli mesin", part: undefined }),
      );
    });
  });

  it("resets unsaved edits and collapses when Tutup is pressed", async () => {
    const user = userEvent.setup();
    const { onSave } = renderEditor({
      item: { name: "Oli mesin", category: "Mesin", note: "Awal" },
    });

    await user.click(screen.getByTestId("item.toggle.1"));
    await user.clear(screen.getByTestId("item.name_input.1"));
    await user.type(screen.getByTestId("item.name_input.1"), "Diubah");
    await user.click(screen.getByTestId("item.cancel_button.1"));

    expect(screen.queryByTestId("item.name_input.1")).not.toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();

    await user.click(screen.getByTestId("item.toggle.1"));
    expect(screen.getByTestId("item.name_input.1")).toHaveValue("Oli mesin");
  });

  it("deletes the item through the card delete button", async () => {
    const user = userEvent.setup();
    const { onDelete } = renderEditor({ item: { name: "Oli mesin" } });

    await user.click(screen.getByTestId("item.delete_button.1"));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
