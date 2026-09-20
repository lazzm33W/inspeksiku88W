import {
  ItemStatus,
  PartAvailability,
  formatInspectionDate,
  formatRupiah,
  formatRupiahInput,
  parseRupiah,
  summarizeItems,
} from "@/types";
import { describe, expect, it } from "vitest";
import { makeItem } from "./harness";

describe("formatRupiah", () => {
  it("formats whole Rupiah with dot thousand separators", () => {
    expect(formatRupiah(0n)).toBe("Rp 0");
    expect(formatRupiah(150000n)).toBe("Rp 150.000");
    expect(formatRupiah(1_250_000n)).toBe("Rp 1.250.000");
  });

  it("keeps a negative sign without converting currency", () => {
    expect(formatRupiah(-2500n)).toBe("-Rp 2.500");
  });
});

describe("parseRupiah", () => {
  it("ignores non-digit characters typed by the user", () => {
    expect(parseRupiah("Rp 150.000")).toBe(150000n);
    expect(parseRupiah("1.250.000")).toBe(1_250_000n);
  });

  it("returns zero for an empty or non-numeric value", () => {
    expect(parseRupiah("")).toBe(0n);
    expect(parseRupiah("abc")).toBe(0n);
  });
});

describe("formatRupiahInput", () => {
  it("groups digits for display inside a numeric input", () => {
    expect(formatRupiahInput(150000n)).toBe("150.000");
  });

  it("renders an empty string for zero or negative amounts", () => {
    expect(formatRupiahInput(0n)).toBe("");
    expect(formatRupiahInput(-1n)).toBe("");
  });
});

describe("formatInspectionDate", () => {
  it("formats an ISO date in Indonesian", () => {
    expect(formatInspectionDate("2024-03-12")).toBe("12 Maret 2024");
  });

  it("returns the input unchanged when it is not an ISO date", () => {
    expect(formatInspectionDate("bukan-tanggal")).toBe("bukan-tanggal");
  });
});

describe("summarizeItems", () => {
  it("counts each status and totals every item", () => {
    const summary = summarizeItems([
      makeItem({ id: 1n, status: ItemStatus.ok }),
      makeItem({ id: 2n, status: ItemStatus.attention }),
      makeItem({ id: 3n, status: ItemStatus.replace }),
      makeItem({ id: 4n, status: ItemStatus.replace }),
    ]);

    expect(summary).toEqual({
      okCount: 1n,
      attentionCount: 1n,
      replaceCount: 2n,
      totalItems: 4n,
      estimatedPartCost: 0n,
    });
  });

  it("only sums part prices on items marked Harus Diganti", () => {
    const summary = summarizeItems([
      makeItem({
        id: 1n,
        status: ItemStatus.ok,
        part: {
          name: "Oli",
          availability: PartAvailability.available,
          price: 999_999n,
        },
      }),
      makeItem({
        id: 2n,
        status: ItemStatus.attention,
        part: {
          name: "Busi",
          availability: PartAvailability.order,
          price: 500_000n,
        },
      }),
      makeItem({
        id: 3n,
        status: ItemStatus.replace,
        part: {
          name: "Kampas rem",
          availability: PartAvailability.order,
          price: 200_000n,
        },
      }),
      makeItem({
        id: 4n,
        status: ItemStatus.replace,
        part: {
          name: "Filter udara",
          availability: PartAvailability.unavailable,
          price: 75_000n,
        },
      }),
    ]);

    expect(summary.estimatedPartCost).toBe(275_000n);
    expect(summary.replaceCount).toBe(2n);
  });

  it("ignores a replace item that has no part recorded", () => {
    const summary = summarizeItems([
      makeItem({ id: 1n, status: ItemStatus.replace, part: undefined }),
    ]);

    expect(summary.replaceCount).toBe(1n);
    expect(summary.estimatedPartCost).toBe(0n);
  });
});
