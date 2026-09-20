import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Common "../types/common";
import Photos "../types/photos";
import Reports "../types/reports";
import ReportsLib "../lib/reports";

mixin (
  reports : Map.Map<Common.ReportId, Reports.Report>,
  photos : Map.Map<Common.PhotoId, Photos.Photo>,
  owners : Map.Map<Common.PhotoId, (Common.ReportId, Common.ItemId)>,
  state : { var nextReportId : Nat },
) {
  /// List reports, newest first, optionally filtered by search term and status.
  public query func listReports(
    searchTerm : Text,
    filter : Reports.ReportFilter,
    sort : Reports.ReportSort,
  ) : async [Reports.ReportListItem] {
    let matched = reports.values().filter(
      func report = ReportsLib.matchesSearch(report, searchTerm) and ReportsLib.matchesFilter(report, filter)
    ).toArray();
    ReportsLib.sortReports(matched, sort).map(func report = ReportsLib.toListItem(report));
  };

  /// Fetch a single report with its items and derived summary.
  public query func getReport(id : Common.ReportId) : async ?Reports.ReportView {
    switch (reports.get(id)) {
      case (?report) { ?ReportsLib.toView(report) };
      case null { null };
    };
  };

  /// Create a new report and return its id.
  public func createReport(input : Reports.ReportInput) : async Common.ReportId {
    ReportsLib.validateInput(input);
    let id = state.nextReportId;
    state.nextReportId := id + 1;
    let now = Time.now();
    reports.add(id, {
      id;
      plateNumber = input.plateNumber;
      vehicleName = input.vehicleName;
      year = input.year;
      inspectionDate = input.inspectionDate;
      items = [];
      createdAt = now;
      updatedAt = now;
    });
    id;
  };

  /// Update a report header. Returns false when the report does not exist.
  public func updateReport(id : Common.ReportId, input : Reports.ReportInput) : async Bool {
    ReportsLib.validateInput(input);
    switch (reports.get(id)) {
      case (?report) {
        reports.add(id, {
          report with
          plateNumber = input.plateNumber;
          vehicleName = input.vehicleName;
          year = input.year;
          inspectionDate = input.inspectionDate;
          updatedAt = Time.now();
        });
        true;
      };
      case null { false };
    };
  };

  /// Delete a report and all of its items and photos.
  public func deleteReport(id : Common.ReportId) : async Bool {
    switch (reports.get(id)) {
      case (?_) {
        let owned = owners.entries().filter(
          func(entry) {
            let (_, owner) = entry;
            let (ownerReport, _) = owner;
            ownerReport == id;
          }
        ).toArray();
        for (entry in owned.values()) {
          let (photoId, _) = entry;
          owners.remove(photoId);
          photos.remove(photoId);
        };
        reports.remove(id);
        true;
      };
      case null { false };
    };
  };
};
