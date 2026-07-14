export type AuthStackParamList = {
  Login: undefined;
};

export type PropertiesStackParamList = {
  PropertyList: undefined;
  PropertyDetail: { propertyId: string };
  InspectionForm: { propertyId: string; inspectionLocalId: string };
};

export type InspectionsStackParamList = {
  MyInspections: undefined;
  InspectionDetail: { inspectionLocalId: string };

  InspectionForm: { propertyId: string; inspectionLocalId: string };
};

export type MainTabParamList = {
  PropertiesTab: undefined;
  InspectionsTab: undefined;
};
