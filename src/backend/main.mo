import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import IntValue "mo:caffeineai-oql/IntValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import Map "mo:core/Map";
import Common "types/common";
import Photos "types/photos";
import Reports "types/reports";
import ReportsApi "mixins/reports-api";
import ItemsApi "mixins/items-api";
import PhotosApi "mixins/photos-api";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let reports : Map.Map<Common.ReportId, Reports.Report>;
  let photos : Map.Map<Common.PhotoId, Photos.Photo>;
  let owners : Map.Map<Common.PhotoId, (Common.ReportId, Common.ItemId)>;
  let state : {
    var nextReportId : Nat;
    var nextItemId : Nat;
    var nextPhotoId : Nat;
  };

  include MixinAuthorization(accessControlState, null);
  include MixinObjectStorage();
  include ReportsApi(reports, photos, owners, state);
  include ItemsApi(reports, state);
  include PhotosApi(reports, photos, owners, state);
  include Expose({
    entities = [
      Entity.manual<Reports.Report>("report", func () = reports.values(), "Report", "id")
        .sample({
          id = 0;
          plateNumber = "";
          vehicleName = "";
          year = 0;
          inspectionDate = "";
          items = [];
          createdAt = 0;
          updatedAt = 0;
        })
        .payload("plateNumber", func report = report.plateNumber)
        .payload("vehicleName", func report = report.vehicleName)
        .payload("year", func report = report.year)
        .payload("inspectionDate", func report = report.inspectionDate)
        .payload("itemCount", func report = report.items.size())
        .payload("createdAt", func report = report.createdAt)
        .payload("updatedAt", func report = report.updatedAt)
        .controllerOnly()
        .build(),
    ];
  });
};
