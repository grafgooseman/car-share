import { calculateDerivedCosts, sanitizeTripInputs } from './calculations';
import { createSettingsSnapshot } from './settings';
import { seededAppSettings } from '../test/fixtures/appSettings';

describe('calculateDerivedCosts', () => {
  const snapshot = createSettingsSnapshot(seededAppSettings);

  it('matches the spreadsheet-derived example using seeded Supabase settings', () => {
    const inputs = sanitizeTripInputs(
      {
        kilometers: 3333,
        days: 222,
        personsInCar: 5,
      },
      snapshot.maxPersonsInCar,
    );
    const result = calculateDerivedCosts(inputs, snapshot.constants);

    expect(result.gasCostPerKm).toBeCloseTo(0.16732, 5);
    expect(result.totalCostPerKm).toBeCloseTo(0.46232, 5);
    expect(result.tripTotal).toBeCloseTo(2073.71256, 5);
    expect(result.costPerPerson).toBe(415);
  });

  it('clamps invalid person counts to the configured limit floor', () => {
    const inputs = sanitizeTripInputs(
      {
        kilometers: 10,
        days: 0,
        personsInCar: 0,
      },
      snapshot.maxPersonsInCar,
    );
    const result = calculateDerivedCosts(inputs, snapshot.constants);

    expect(inputs.personsInCar).toBe(1);
    expect(result.costPerPerson).toBe(Math.ceil(result.tripTotal));
  });
});
