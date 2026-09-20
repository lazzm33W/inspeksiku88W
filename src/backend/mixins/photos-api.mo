import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Common "../types/common";
import Photos "../types/photos";
import Reports "../types/reports";
import PhotosLib "../lib/photos";

mixin (
  reports : Map.Map<Common.ReportId, Reports.Report>,
  photos : Map.Map<Common.PhotoId, Photos.Photo>,
  owners : Map.Map<Common.PhotoId, (Common.ReportId, Common.ItemId)>,
  state : { var nextPhotoId : Nat },
) {
  /// Attach a photo to an inspection item. Returns the new photo id.
  public func addPhoto(
    reportId : Common.ReportId,
    itemId : Common.ItemId,
    input : Photos.PhotoInput,
  ) : async ?Common.PhotoId {
    PhotosLib.validateInput(input);
    switch (reports.get(reportId)) {
      case (?report) {
        if (not report.items.any(func item = item.id == itemId)) {
          return null;
        };
        let photoId = state.nextPhotoId;
        state.nextPhotoId := photoId + 1;
        photos.add(photoId, PhotosLib.newPhoto(photoId, input));
        owners.add(photoId, (reportId, itemId));
        ?photoId;
      };
      case null { null };
    };
  };

  /// List the photos attached to an inspection item.
  public query func listPhotos(
    reportId : Common.ReportId,
    itemId : Common.ItemId,
  ) : async [Photos.Photo] {
    photos.values().filter(
      func photo {
        switch (owners.get(photo.id)) {
          case (?(ownerReport, ownerItem)) { ownerReport == reportId and ownerItem == itemId };
          case null { false };
        }
      }
    ).toArray();
  };

  /// Remove a photo from an inspection item. Returns false when not found.
  public func deletePhoto(
    reportId : Common.ReportId,
    itemId : Common.ItemId,
    photoId : Common.PhotoId,
  ) : async Bool {
    switch (owners.get(photoId)) {
      case (?(ownerReport, ownerItem)) {
        if (ownerReport != reportId or ownerItem != itemId) {
          return false;
        };
        owners.remove(photoId);
        photos.remove(photoId);
        true;
      };
      case null { false };
    };
  };
};
