import Common "common";

module {
  /// Condition of a single inspection item.
  public type ItemStatus = {
    #ok;
    #attention;
    #replace;
  };

  /// Availability of the part recorded for an item.
  public type PartAvailability = {
    #available;
    #unavailable;
    #order;
  };

  /// Part data recorded for an inspection item. `price` is in whole Rupiah.
  public type PartInfo = {
    name : Text;
    availability : PartAvailability;
    price : Nat;
  };

  /// A single inspection item belonging to a report.
  public type InspectionItem = {
    id : Common.ItemId;
    category : Text;
    name : Text;
    status : ItemStatus;
    note : Text;
    part : ?PartInfo;
  };

  /// Caller-supplied payload for creating or replacing an inspection item.
  public type ItemInput = {
    category : Text;
    name : Text;
    status : ItemStatus;
    note : Text;
    part : ?PartInfo;
  };
};
