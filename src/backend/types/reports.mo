import Common "common";
import Items "items";

module {
  /// An inspection report for one vehicle. No customer data is stored.
  public type Report = {
    id : Common.ReportId;
    plateNumber : Text;
    vehicleName : Text;
    year : Nat;
    inspectionDate : Text;
    items : [Items.InspectionItem];
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
  };

  /// Caller-supplied payload for creating or updating a report header.
  public type ReportInput = {
    plateNumber : Text;
    vehicleName : Text;
    year : Nat;
    inspectionDate : Text;
  };

  /// Counts and cost estimate derived from a report's items.
  public type ReportSummary = {
    okCount : Nat;
    attentionCount : Nat;
    replaceCount : Nat;
    totalItems : Nat;
    estimatedPartCost : Nat;
  };

  /// A report together with its derived summary, as returned to clients.
  public type ReportView = {
    id : Common.ReportId;
    plateNumber : Text;
    vehicleName : Text;
    year : Nat;
    inspectionDate : Text;
    items : [Items.InspectionItem];
    summary : ReportSummary;
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
  };

  /// Filter applied when listing reports.
  public type ReportFilter = {
    #all;
    #hasReplace;
    #hasAttention;
  };

  /// Sort direction applied when listing reports.
  public type ReportSort = {
    #newestFirst;
    #oldestFirst;
  };

  /// A report header without its items, used by the list page.
  public type ReportListItem = {
    id : Common.ReportId;
    plateNumber : Text;
    vehicleName : Text;
    year : Nat;
    inspectionDate : Text;
    summary : ReportSummary;
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
  };
};
