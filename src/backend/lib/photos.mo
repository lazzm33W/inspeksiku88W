import Runtime "mo:core/Runtime";
import Blob "mo:core/Blob";
import Common "../types/common";
import Photos "../types/photos";

module {
  /// Create a new photo record from caller input.
  public func newPhoto(id : Common.PhotoId, input : Photos.PhotoInput) : Photos.Photo {
    {
      id;
      blob = input.blob;
      filename = input.filename;
      mimeType = input.mimeType;
    };
  };

  /// Validate a photo payload, trapping when the blob is empty.
  public func validateInput(input : Photos.PhotoInput) : () {
    if (input.blob.size() == 0) {
      Runtime.trap("Berkas foto tidak boleh kosong");
    };
  };
};
