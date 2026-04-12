import type { ConstantField, CostConstants, TripInputs } from '../types';

export const ADMIN_PASSWORD = 'test-password';

export const DEFAULT_TRIP_INPUTS: TripInputs = {
  kilometers: 120,
  days: 2,
  personsInCar: 3,
};

export const DEFAULT_CONSTANTS: CostConstants = {
  carName: 'Honda Civic LX 4DR Sedan 2012',
  gasPer100Km: 9.4,
  gasPricePerLiter: 1.78,
  insurancePerKm: 0.16,
  parkingPerDay: 2.4,
  depreciationPerKm: 0.03,
  maintenancePerKm: 0.065,
  riskPerKm: 0.04,
};

export const MAX_PERSONS = 5;

export const CONSTANT_FIELDS: ConstantField[] = [
  { key: 'carName', label: 'Car model', unit: '', decimals: 0, readOnly: true },
  { key: 'gasPer100Km', label: 'Gas / 100 km', unit: 'L', decimals: 1 },
  { key: 'gasPricePerLiter', label: 'Gas price / L', unit: 'CA$', decimals: 2 },
  { key: 'insurancePerKm', label: 'Insurance / km', unit: 'CA$', decimals: 2 },
  { key: 'parkingPerDay', label: 'Parking / day', unit: 'CA$', decimals: 2 },
  { key: 'depreciationPerKm', label: 'Depreciation / km', unit: 'CA$', decimals: 2 },
  { key: 'maintenancePerKm', label: 'Maintenance + tire wear / km', unit: 'CA$', decimals: 3 },
  { key: 'riskPerKm', label: 'Risk / km', unit: 'CA$', decimals: 2 },
];
