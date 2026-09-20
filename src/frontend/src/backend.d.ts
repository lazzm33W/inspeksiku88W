import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
import type { ExternalBlob } from "@caffeineai/object-storage";
export type { ExternalBlob } from "@caffeineai/object-storage";
export interface Cell {
    value: Value;
    name: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface InspectionItem {
    id: ItemId;
    status: ItemStatus;
    name: string;
    note: string;
    part?: PartInfo;
    category: string;
}
export type ItemId = bigint;
export interface ItemInput {
    status: ItemStatus;
    name: string;
    note: string;
    part?: PartInfo;
    category: string;
}
export interface PartInfo {
    name: string;
    availability: PartAvailability;
    price: bigint;
}
export interface Photo {
    id: PhotoId;
    blob: ExternalBlob;
    mimeType: string;
    filename: string;
}
export type PhotoId = bigint;
export interface PhotoInput {
    blob: ExternalBlob;
    mimeType: string;
    filename: string;
}
export type ReportId = bigint;
export interface ReportInput {
    vehicleName: string;
    inspectionDate: string;
    year: bigint;
    plateNumber: string;
}
export interface ReportListItem {
    id: ReportId;
    vehicleName: string;
    inspectionDate: string;
    createdAt: Timestamp;
    year: bigint;
    summary: ReportSummary;
    updatedAt: Timestamp;
    plateNumber: string;
}
export interface ReportSummary {
    replaceCount: bigint;
    attentionCount: bigint;
    okCount: bigint;
    totalItems: bigint;
    estimatedPartCost: bigint;
}
export interface ReportView {
    id: ReportId;
    vehicleName: string;
    inspectionDate: string;
    createdAt: Timestamp;
    year: bigint;
    summary: ReportSummary;
    updatedAt: Timestamp;
    plateNumber: string;
    items: Array<InspectionItem>;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Timestamp = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum ItemStatus {
    ok = "ok",
    replace = "replace",
    attention = "attention"
}
export enum PartAvailability {
    order = "order",
    available = "available",
    unavailable = "unavailable"
}
export enum ReportFilter {
    all = "all",
    hasReplace = "hasReplace",
    hasAttention = "hasAttention"
}
export enum ReportSort {
    newestFirst = "newestFirst",
    oldestFirst = "oldestFirst"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Add an inspection item to a report. Returns the new item id.
     */
    addItem(reportId: ReportId, input: ItemInput): Promise<ItemId | null>;
    /**
     * / Attach a photo to an inspection item. Returns the new photo id.
     */
    addPhoto(reportId: ReportId, itemId: ItemId, input: PhotoInput): Promise<PhotoId | null>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Create a new report and return its id.
     */
    createReport(input: ReportInput): Promise<ReportId>;
    /**
     * / Remove an inspection item from a report. Returns false when not found.
     */
    deleteItem(reportId: ReportId, itemId: ItemId): Promise<boolean>;
    /**
     * / Remove a photo from an inspection item. Returns false when not found.
     */
    deletePhoto(reportId: ReportId, itemId: ItemId, photoId: PhotoId): Promise<boolean>;
    /**
     * / Delete a report and all of its items and photos.
     */
    deleteReport(id: ReportId): Promise<boolean>;
    execute(qJson: string): Promise<Result>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Fetch a single report with its items and derived summary.
     */
    getReport(id: ReportId): Promise<ReportView | null>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / List the photos attached to an inspection item.
     */
    listPhotos(reportId: ReportId, itemId: ItemId): Promise<Array<Photo>>;
    /**
     * / List reports, newest first, optionally filtered by search term and status.
     */
    listReports(searchTerm: string, filter: ReportFilter, sort: ReportSort): Promise<Array<ReportListItem>>;
    schema(): Promise<string>;
    /**
     * / Replace an inspection item's fields. Returns false when not found.
     */
    updateItem(reportId: ReportId, itemId: ItemId, input: ItemInput): Promise<boolean>;
    /**
     * / Update a report header. Returns false when the report does not exist.
     */
    updateReport(id: ReportId, input: ReportInput): Promise<boolean>;
}
