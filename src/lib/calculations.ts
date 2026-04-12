import type { CostConstants, DerivedCosts, TripInputs } from '../types';

const clampNumber = (value: number, min: number, max?: number) => {
  const safeValue = Number.isFinite(value) ? value : min;
  const clamped = Math.max(min, safeValue);
  return max === undefined ? clamped : Math.min(max, clamped);
};

export const sanitizeTripInputs = (inputs: Partial<TripInputs>, maxPersonsInCar: number): TripInputs => ({
  kilometers: clampNumber(inputs.kilometers ?? 0, 0),
  days: clampNumber(inputs.days ?? 0, 0),
  personsInCar: Math.round(clampNumber(inputs.personsInCar ?? 1, 1, maxPersonsInCar)),
});

export const calculateDerivedCosts = (
  rawInputs: TripInputs,
  constants: CostConstants,
): DerivedCosts => {
  const inputs = rawInputs;
  const gasCostPerKm = (constants.gasPricePerLiter * constants.gasPer100Km) / 100;
  const totalCostPerKm =
    gasCostPerKm +
    constants.insurancePerKm +
    constants.depreciationPerKm +
    constants.maintenancePerKm +
    constants.riskPerKm;
  const tripTotal = totalCostPerKm * inputs.kilometers + constants.parkingPerDay * inputs.days;
  const costPerPerson = Math.ceil(tripTotal / inputs.personsInCar);

  return {
    gasCostPerKm,
    totalCostPerKm,
    tripTotal,
    costPerPerson,
  };
};
