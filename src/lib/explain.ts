import type { CostConstants, ExplainItem } from '../types';

export const getExplainItems = (_constants: CostConstants): ExplainItem[] => [
  {
    key: 'carName',
    label: 'Car model',
    description: 'The calculator is configured for this specific car and its operating costs.',
  },
  {
    key: 'gasPer100Km',
    label: 'Gas / 100 km',
    description: 'Fuel consumption baseline taken from the car specification in the spreadsheet.',
    unit: 'L',
  },
  {
    key: 'gasPricePerLiter',
    label: 'Gas price / L',
    description: 'Current gas price used as the fuel input for the trip.',
    unit: 'CA$',
  },
  {
    key: 'gasCostPerKm',
    label: 'Gas price / km',
    description: 'This converts fuel consumption and gas price into a per-kilometer fuel cost.',
    formula: 'gasPricePerLiter × gasPer100Km ÷ 100',
    unit: 'CA$',
  },
  {
    key: 'insurancePerKm',
    label: 'Insurance / km',
    description: 'Fixed insurance allocation charged for each kilometer driven.',
    unit: 'CA$',
  },
  {
    key: 'parkingPerDay',
    label: 'Parking / day',
    description: 'Flat daily parking amount carried over from the spreadsheet.',
    unit: 'CA$',
  },
  {
    key: 'depreciationPerKm',
    label: 'Depreciation / km',
    description: 'Wear on the car value attributed to each kilometer.',
    unit: 'CA$',
  },
  {
    key: 'maintenancePerKm',
    label: 'Maintenance + tire wear / km',
    description: 'Routine maintenance and tire usage distributed across distance driven.',
    unit: 'CA$',
  },
  {
    key: 'riskPerKm',
    label: 'Risk / km',
    description: 'Allowance for collision, towing, tickets, small damage, or cleaning risk.',
    unit: 'CA$',
  },
  {
    key: 'totalCostPerKm',
    label: 'Total cost / km',
    description: 'The combined driving cost per kilometer before parking is added.',
    formula:
      'gasCostPerKm + insurancePerKm + depreciationPerKm + maintenancePerKm + riskPerKm',
    unit: 'CA$',
  },
  {
    key: 'costPerPerson',
    label: 'Cost per person',
    description: 'Final shared amount, rounded up to the next whole Canadian dollar.',
    formula: 'ceil((totalCostPerKm × kilometers + parkingPerDay × days) ÷ personsInCar)',
    unit: 'CA$',
  },
];
