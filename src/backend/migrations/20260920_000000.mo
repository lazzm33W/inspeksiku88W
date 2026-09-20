import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";

module {
  type ItemStatus = { #ok; #attention; #replace };
  type PartAvailability = { #available; #unavailable; #order };
  type PartInfo = { name : Text; availability : PartAvailability; price : Nat };
  type InspectionItem = {
    id : Nat;
    category : Text;
    name : Text;
    status : ItemStatus;
    note : Text;
    part : ?PartInfo;
  };
  type Report = {
    id : Nat;
    plateNumber : Text;
    vehicleName : Text;
    year : Nat;
    inspectionDate : Text;
    items : [InspectionItem];
    createdAt : Int;
    updatedAt : Int;
  };
  type Photo = {
    id : Nat;
    blob : Blob;
    filename : Text;
    mimeType : Text;
  };

  type OldActor = {};

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    reports : Map.Map<Nat, Report>;
    photos : Map.Map<Nat, Photo>;
    owners : Map.Map<Nat, (Nat, Nat)>;
    state : {
      var nextReportId : Nat;
      var nextItemId : Nat;
      var nextPhotoId : Nat;
    };
  };

  public func migration(_old : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      reports = Map.empty();
      photos = Map.empty();
      owners = Map.empty();
      state = {
        var nextReportId = 0;
        var nextItemId = 0;
        var nextPhotoId = 0;
      };
    };
  };
};
