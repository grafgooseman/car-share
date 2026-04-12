import type { AppSettingKey, ExplainItem, ExplainKey, SettingsSnapshot } from '../types';

const DERIVED_EXPLAIN_ITEMS: Record<'gasCostPerKm' | 'totalCostPerKm' | 'costPerPerson', ExplainItem> = {
  gasCostPerKm: {
    key: 'gasCostPerKm',
    label: 'Gas cost / km',
    description: 'This converts fuel consumption and gas price into a per-kilometer fuel cost.',
    formula: 'gasPricePerLiter * gasPer100Km / 100',
    unit: 'CA$',
  },
  totalCostPerKm: {
    key: 'totalCostPerKm',
    label: 'Total cost / km',
    description: 'The combined driving cost per kilometer before parking is added.',
    formula:
      'gasCostPerKm + insurancePerKm + depreciationPerKm + maintenancePerKm + riskPerKm',
    unit: 'CA$',
  },
  costPerPerson: {
    key: 'costPerPerson',
    label: 'Cost per person',
    description: 'Final shared amount, rounded up to the next whole Canadian dollar.',
    formula: 'ceil((totalCostPerKm * kilometers + parkingPerDay * days) / personsInCar)',
    unit: 'CA$',
  },
};

export const getExplainItem = (
  explainKey: ExplainKey | null,
  settingsSnapshot: SettingsSnapshot,
): ExplainItem | null => {
  if (!explainKey) {
    return null;
  }

  if (explainKey in DERIVED_EXPLAIN_ITEMS) {
    return DERIVED_EXPLAIN_ITEMS[explainKey as keyof typeof DERIVED_EXPLAIN_ITEMS];
  }

  const setting = settingsSnapshot.settingsByKey[explainKey as AppSettingKey];
  if (!setting) {
    return null;
  }

  return {
    key: explainKey,
    label: setting.label,
    description: setting.helpText,
    rationale: setting.rationale,
    sourceNote: setting.sourceNote ?? undefined,
    unit: setting.unit || undefined,
  };
};
