import { PocketIc } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: _SERVICE;

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor } = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  }));
});

afterAll(async () => {
  await pic?.tearDown();
});

it("answers an empty-state read instead of trapping", async () => {
  await expect(actor.listReports("", { all: null }, { newestFirst: null })).resolves.toEqual([]);
});

it("round-trips a report through the real canister", async () => {
  const id = await actor.createReport({
    plateNumber: "B 1234 XYZ",
    vehicleName: "Toyota Avanza",
    year: 2019n,
    inspectionDate: "2024-03-12",
  });

  const reports = await actor.listReports("", { all: null }, { newestFirst: null });
  expect(reports).toHaveLength(1);
  expect(reports[0]).toMatchObject({
    id,
    plateNumber: "B 1234 XYZ",
    vehicleName: "Toyota Avanza",
    year: 2019n,
    inspectionDate: "2024-03-12",
  });

  const view = await actor.getReport(id);
  expect(view).toHaveLength(1);
  expect(view[0]?.items).toEqual([]);
});

it("adds, updates and deletes an inspection item", async () => {
  const reportId = await actor.createReport({
    plateNumber: "D 5678 AB",
    vehicleName: "Honda Beat",
    year: 2021n,
    inspectionDate: "2024-04-01",
  });

  const itemId = await actor.addItem(reportId, {
    name: "Kampas rem depan",
    category: "Rem",
    status: { replace: null },
    note: "Aus",
    part: [{ name: "Kampas rem", availability: { available: null }, price: 150000n }],
  });
  expect(itemId).toHaveLength(1);

  const updated = await actor.updateItem(reportId, itemId[0]!, {
    name: "Kampas rem depan",
    category: "Rem",
    status: { ok: null },
    note: "Sudah diganti",
    part: [],
  });
  expect(updated).toBe(true);

  const view = await actor.getReport(reportId);
  expect(view[0]?.items).toHaveLength(1);
  expect(view[0]?.items[0]).toMatchObject({
    name: "Kampas rem depan",
    status: { ok: null },
    note: "Sudah diganti",
    part: [],
  });

  expect(await actor.deleteItem(reportId, itemId[0]!)).toBe(true);
  const afterDelete = await actor.getReport(reportId);
  expect(afterDelete[0]?.items).toEqual([]);
});

it("derives the summary and only counts replace-status part prices", async () => {
  const reportId = await actor.createReport({
    plateNumber: "F 9012 CD",
    vehicleName: "Suzuki Ertiga",
    year: 2018n,
    inspectionDate: "2024-05-10",
  });

  await actor.addItem(reportId, {
    name: "Oli mesin",
    category: "Mesin",
    status: { ok: null },
    note: "",
    part: [],
  });
  await actor.addItem(reportId, {
    name: "Busi",
    category: "Mesin",
    status: { attention: null },
    note: "Perlu perhatian",
    part: [],
  });
  await actor.addItem(reportId, {
    name: "Kampas rem",
    category: "Rem",
    status: { replace: null },
    note: "",
    part: [{ name: "Kampas rem", availability: { order: null }, price: 200000n }],
  });
  await actor.addItem(reportId, {
    name: "Filter udara",
    category: "Mesin",
    status: { replace: null },
    note: "",
    part: [{ name: "Filter udara", availability: { unavailable: null }, price: 75000n }],
  });

  const view = await actor.getReport(reportId);
  expect(view[0]?.summary).toEqual({
    okCount: 1n,
    attentionCount: 1n,
    replaceCount: 2n,
    totalItems: 4n,
    estimatedPartCost: 275000n,
  });
});

it("filters and searches the report list", async () => {
  const withReplace = await actor.createReport({
    plateNumber: "G 1111 AA",
    vehicleName: "Daihatsu Xenia",
    year: 2020n,
    inspectionDate: "2024-06-01",
  });
  await actor.addItem(withReplace, {
    name: "Aki",
    category: "Kelistrikan",
    status: { replace: null },
    note: "",
    part: [],
  });

  const withAttention = await actor.createReport({
    plateNumber: "H 2222 BB",
    vehicleName: "Mitsubishi L300",
    year: 2017n,
    inspectionDate: "2024-06-02",
  });
  await actor.addItem(withAttention, {
    name: "Lampu depan",
    category: "Kelistrikan",
    status: { attention: null },
    note: "",
    part: [],
  });

  const replaceOnly = await actor.listReports("", { hasReplace: null }, { newestFirst: null });
  expect(replaceOnly.map((report) => report.id)).toContain(withReplace);
  expect(replaceOnly.map((report) => report.id)).not.toContain(withAttention);

  const attentionOnly = await actor.listReports("", { hasAttention: null }, { newestFirst: null });
  expect(attentionOnly.map((report) => report.id)).toContain(withAttention);
  expect(attentionOnly.map((report) => report.id)).not.toContain(withReplace);

  const byPlate = await actor.listReports("2222", { all: null }, { newestFirst: null });
  expect(byPlate.map((report) => report.id)).toEqual([withAttention]);

  const byVehicle = await actor.listReports("xenia", { all: null }, { newestFirst: null });
  expect(byVehicle.map((report) => report.id)).toEqual([withReplace]);
});

it("attaches, lists and deletes a photo on an item", async () => {
  const reportId = await actor.createReport({
    plateNumber: "J 3333 CC",
    vehicleName: "Toyota Kijang",
    year: 2015n,
    inspectionDate: "2024-07-01",
  });
  const itemId = await actor.addItem(reportId, {
    name: "Ban depan",
    category: "Ban & Kaki-kaki",
    status: { attention: null },
    note: "",
    part: [],
  });
  const resolvedItemId = itemId[0]!;

  const photoId = await actor.addPhoto(reportId, resolvedItemId, {
    blob: new Uint8Array([1, 2, 3, 4]),
    mimeType: "image/jpeg",
    filename: "ban-depan.jpg",
  });
  expect(photoId).toHaveLength(1);

  const photos = await actor.listPhotos(reportId, resolvedItemId);
  expect(photos).toHaveLength(1);
  expect(photos[0]).toMatchObject({
    id: photoId[0]!,
    filename: "ban-depan.jpg",
    mimeType: "image/jpeg",
  });

  expect(await actor.deletePhoto(reportId, resolvedItemId, photoId[0]!)).toBe(true);
  expect(await actor.listPhotos(reportId, resolvedItemId)).toEqual([]);
});

it("updates and deletes a report header", async () => {
  const reportId = await actor.createReport({
    plateNumber: "K 4444 DD",
    vehicleName: "Nissan Grand Livina",
    year: 2016n,
    inspectionDate: "2024-08-01",
  });

  expect(
    await actor.updateReport(reportId, {
      plateNumber: "K 4444 DD",
      vehicleName: "Nissan Grand Livina Facelift",
      year: 2017n,
      inspectionDate: "2024-08-02",
    }),
  ).toBe(true);

  const view = await actor.getReport(reportId);
  expect(view[0]).toMatchObject({
    vehicleName: "Nissan Grand Livina Facelift",
    year: 2017n,
    inspectionDate: "2024-08-02",
  });

  expect(await actor.deleteReport(reportId)).toBe(true);
  expect(await actor.getReport(reportId)).toEqual([]);
});
