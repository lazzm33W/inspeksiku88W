import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Common "../types/common";
import Items "../types/items";
import Reports "../types/reports";
import ItemsLib "../lib/items";

mixin (
  reports : Map.Map<Common.ReportId, Reports.Report>,
  state : { var nextItemId : Nat },
) {
  /// Add an inspection item to a report. Returns the new item id.
  public func addItem(
    reportId : Common.ReportId,
    input : Items.ItemInput,
  ) : async ?Common.ItemId {
    ItemsLib.validateInput(input);
    switch (reports.get(reportId)) {
      case (?report) {
        let itemId = state.nextItemId;
        state.nextItemId := itemId + 1;
        let item = ItemsLib.newItem(itemId, input);
        reports.add(reportId, {
          report with
          items = report.items.concat([item]);
          updatedAt = Time.now();
        });
        ?itemId;
      };
      case null { null };
    };
  };

  /// Replace an inspection item's fields. Returns false when not found.
  public func updateItem(
    reportId : Common.ReportId,
    itemId : Common.ItemId,
    input : Items.ItemInput,
  ) : async Bool {
    ItemsLib.validateInput(input);
    switch (reports.get(reportId)) {
      case (?report) {
        var found = false;
        let updated = report.items.map(
          func item {
            if (item.id == itemId) {
              found := true;
              ItemsLib.applyInput(item, input)
            } else {
              item
            }
          }
        );
        if (found) {
          reports.add(reportId, { report with items = updated; updatedAt = Time.now() });
        };
        found;
      };
      case null { false };
    };
  };

  /// Remove an inspection item from a report. Returns false when not found.
  public func deleteItem(
    reportId : Common.ReportId,
    itemId : Common.ItemId,
  ) : async Bool {
    switch (reports.get(reportId)) {
      case (?report) {
        let remaining = report.items.filter(func item = item.id != itemId);
        if (remaining.size() == report.items.size()) {
          return false;
        };
        reports.add(reportId, { report with items = remaining; updatedAt = Time.now() });
        true;
      };
      case null { false };
    };
  };
};
