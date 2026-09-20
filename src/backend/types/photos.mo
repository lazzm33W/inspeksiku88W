import Common "common";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  /// A photo attached to an inspection item. `blob` is the off-chain file
  /// reference; `filename` and `mimeType` are kept for display and type checks.
  public type Photo = {
    id : Common.PhotoId;
    blob : Storage.ExternalBlob;
    filename : Text;
    mimeType : Text;
  };

  /// Caller-supplied payload for attaching a photo to an inspection item.
  public type PhotoInput = {
    blob : Storage.ExternalBlob;
    filename : Text;
    mimeType : Text;
  };
};
