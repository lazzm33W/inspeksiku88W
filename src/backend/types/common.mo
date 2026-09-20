module {
  /// Identifier for an inspection report.
  public type ReportId = Nat;

  /// Identifier for an inspection item inside a report.
  public type ItemId = Nat;

  /// Identifier for a photo attached to an inspection item.
  public type PhotoId = Nat;

  /// Nanoseconds since the epoch (Time.now()).
  public type Timestamp = Int;
};
