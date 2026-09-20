import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Common "../types/common";
import Items "../types/items";

module {
  /// Create a new inspection item from caller input.
  public func newItem(id : Common.ItemId, input : Items.ItemInput) : Items.InspectionItem {
    {
      id;
      category = input.category;
      name = input.name;
      status = input.status;
      note = input.note;
      part = input.part;
    };
  };

  /// Apply caller input to an existing inspection item, keeping its id.
  public func applyInput(item : Items.InspectionItem, input : Items.ItemInput) : Items.InspectionItem {
    {
      id = item.id;
      category = input.category;
      name = input.name;
      status = input.status;
      note = input.note;
      part = input.part;
    };
  };

  /// Validate an item payload, trapping when the name is empty.
  public func validateInput(input : Items.ItemInput) : () {
    if (input.name.trim(#predicate(func char = char == ' ')).size() == 0) {
      Runtime.trap("Nama item inspeksi wajib diisi");
    };
  };

  /// Whether an item counts toward the estimated part cost.
  public func countsTowardCost(item : Items.InspectionItem) : Bool {
    switch (item.status) {
      case (#replace) { true };
      case (_) { false };
    };
  };

  /// The part price of an item, or zero when it has no part.
  public func partPrice(item : Items.InspectionItem) : Nat {
    switch (item.part) {
      case (?part) { part.price };
      case null { 0 };
    };
  };
};
