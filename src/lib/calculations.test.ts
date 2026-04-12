import { calculateDerivedCosts } from './calculations';
import { DEFAULT_CONSTANTS } from './defaults';

describe('calculateDerivedCosts', () => {
  it('matches the spreadsheet-derived example', () => {
    const result = calculateDerivedCosts(
      {
        kilometers: 3333,
        days: 222,
        personsInCar: 5,
      },
      DEFAULT_CONSTANTS,
    );

    expect(result.gasCostPerKm).toBeCloseTo(0.16732, 5);
    expect(result.totalCostPerKm).toBeCloseTo(0.46232, 5);
    expect(result.tripTotal).toBeCloseTo(2073.71256, 5);
    expect(result.costPerPerson).toBe(415);
  });

  it('clamps invalid person counts to at least one and rounds up', () => {
    const result = calculateDerivedCosts(
      {
        kilometers: 10,
        days: 0,
        personsInCar: 0,
      },
      DEFAULT_CONSTANTS,
    );

    expect(result.costPerPerson).toBe(Math.ceil(result.tripTotal));
  });
});
