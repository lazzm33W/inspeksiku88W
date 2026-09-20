import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Items "../types/items";
import Reports "../types/reports";
import ItemsLib "items";

module {
  /// Compute the derived summary for a report's items.
  public func summarize(items : [Items.InspectionItem]) : Reports.ReportSummary {
    var okCount = 0;
    var attentionCount = 0;
    var replaceCount = 0;
    var estimatedPartCost = 0;
    for (item in items.values()) {
      switch (item.status) {
        case (#ok) { okCount += 1 };
        case (#attention) { attentionCount += 1 };
        case (#replace) {
          replaceCount += 1;
          if (ItemsLib.countsTowardCost(item)) {
            estimatedPartCost += ItemsLib.partPrice(item);
          };
        };
      };
    };
    {
      okCount;
      attentionCount;
      replaceCount;
      totalItems = items.size();
      estimatedPartCost;
    };
  };

  /// Build the client-facing view of a report.
  public func toView(report : Reports.Report) : Reports.ReportView {
    {
      id = report.id;
      plateNumber = report.plateNumber;
      vehicleName = report.vehicleName;
      year = report.year;
      inspectionDate = report.inspectionDate;
      items = report.items;
      summary = summarize(report.items);
      createdAt = report.createdAt;
      updatedAt = report.updatedAt;
    };
  };

  /// Build the list-page projection of a report.
  public func toListItem(report : Reports.Report) : Reports.ReportListItem {
    {
      id = report.id;
      plateNumber = report.plateNumber;
      vehicleName = report.vehicleName;
      year = report.year;
      inspectionDate = report.inspectionDate;
      summary = summarize(report.items);
      createdAt = report.createdAt;
      updatedAt = report.updatedAt;
    };
  };

  /// Whether a report matches the free-text search term (plate or vehicle name).
  public func matchesSearch(report : Reports.Report, searchTerm : Text) : Bool {
    let term = searchTerm.trim(#predicate(func char = char == ' ')).toLower();
    if (term.size() == 0) {
      true
    } else {
      report.plateNumber.toLower().contains(#text term)
        or report.vehicleName.toLower().contains(#text term)
    };
  };

  /// Whether a report matches the status filter.
  public func matchesFilter(report : Reports.Report, filter : Reports.ReportFilter) : Bool {
    switch (filter) {
      case (#all) { true };
      case (#hasReplace) {
        report.items.any(func item = item.status == #replace)
      };
      case (#hasAttention) {
        report.items.any(func item = item.status == #attention)
      };
    };
  };

  /// Sort reports by inspection date in the requested direction.
  public func sortReports(reports : [Reports.Report], sort : Reports.ReportSort) : [Reports.Report] {
    reports.sort(
      func(a, b) {
        switch (sort) {
          case (#newestFirst) { compareReports(a, b) };
          case (#oldestFirst) { compareReports(b, a) };
        };
      }
    );
  };

  /// Order two reports newest-first by inspection date, then creation time.
  func compareReports(a : Reports.Report, b : Reports.Report) : Order.Order {
    switch (Text.compare(b.inspectionDate, a.inspectionDate)) {
      case (#equal) { Int.compare(b.createdAt, a.createdAt) };
      case (order) { order };
    };
  };

  /// Validate a report header payload, trapping when required fields are empty.
  public func validateInput(input : Reports.ReportInput) : () {
    if (input.plateNumber.trim(#predicate(func char = char == ' ')).size() == 0) {
      Runtime.trap("Nomor polisi wajib diisi");
    };
    if (input.vehicleName.trim(#predicate(func char = char == ' ')).size() == 0) {
      Runtime.trap("Nama kendaraan wajib diisi");
    };
  };
};
