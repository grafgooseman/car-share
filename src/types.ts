export type TripInputs = {
  kilometers: number;
  days: number;
  personsInCar: number;
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

export type ExplainKey = keyof CostConstants | 'gasCostPerKm' | 'totalCostPerKm' | 'costPerPerson';

export type ExplainItem = {
  key: ExplainKey;
  label: string;
  description: string;
  formula?: string;
  unit?: string;
};

export type ConstantField = {
  key: keyof CostConstants;
  label: string;
  unit: string;
  decimals: number;
  readOnly?: boolean;
};
