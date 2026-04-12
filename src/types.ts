export type TripInputs = {
  kilometers: number;
  days: number;
  personsInCar: number;
};

export type TripInputDraft = {
  kilometers: string;
  days: string;
  personsInCar: string;
};

export type CostConstants = {
  carName: string;
  gasPer100Km: number;
  gasPricePerLiter: number;
  insurancePerKm: number;
  parkingPerDay: number;
  depreciationPerKm: number;
  maintenancePerKm: number;
  riskPerKm: number;
};

export type DerivedCosts = {
  gasCostPerKm: number;
  totalCostPerKm: number;
  tripTotal: number;
  costPerPerson: number;
};

export type AppSettingKey =
  | keyof CostConstants
  | 'maxPersonsInCar'
  | 'defaultKilometers'
  | 'defaultDays'
  | 'defaultPersonsInCar';

export type AppSettingValueType = 'text' | 'number' | 'integer';

export type ExplainKey = AppSettingKey | 'gasCostPerKm' | 'totalCostPerKm' | 'costPerPerson';

export type ExplainItem = {
  key: ExplainKey;
  label: string;
  description: string;
  rationale?: string;
  formula?: string;
  sourceNote?: string;
  unit?: string;
};

export type AppSetting = {
  key: AppSettingKey;
  groupKey: string;
  label: string;
  helpText: string;
  rationale: string;
  sourceNote: string | null;
  valueType: AppSettingValueType;
  textValue: string | null;
  numericValue: number | null;
  unit: string;
  decimals: number;
  sortOrder: number;
  isPublic: boolean;
  editableByAdmin: boolean;
  updatedAt: string;
  updatedBy: string | null;
};

export type AppSettingDraft = {
  key: AppSettingKey;
  groupKey: string;
  label: string;
  helpText: string;
  rationale: string;
  sourceNote: string;
  valueType: AppSettingValueType;
  rawValue: string;
  unit: string;
  decimals: number;
  sortOrder: number;
  isPublic: boolean;
  editableByAdmin: boolean;
};

export type AppSettingUpdate = {
  key: AppSettingKey;
  label: string;
  helpText: string;
  rationale: string;
  sourceNote: string | null;
  valueType: AppSettingValueType;
  textValue: string | null;
  numericValue: number | null;
};

export type SettingsSnapshot = {
  settings: AppSetting[];
  settingsByKey: Record<AppSettingKey, AppSetting>;
  constants: CostConstants;
  publicConstantSettings: AppSetting[];
  editableSettings: AppSetting[];
  tripDefaults: TripInputs;
  maxPersonsInCar: number;
};

export type AdminUser = {
  userId: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  isActive: boolean;
  createdFromCodeId: number | null;
};

export type AdminSession = {
  authEmail: string | null;
  adminUser: AdminUser | null;
};
