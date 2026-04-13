import type {
  AppSetting,
  AppSettingDraft,
  AppSettingKey,
  AppSettingUpdate,
  SettingsSnapshot,
  TripInputDraft,
  TripInputs,
} from '../types';
import { formatCurrency, formatNumber } from './format';

const REQUIRED_SETTING_KEYS: AppSettingKey[] = [
  'carName',
  'eyebrow',
  'description',
  'badgePrimary',
  'badgeSecondary',
  'badgeTertiary',
  'riskTitle',
  'riskBody',
  'gasPer100Km',
  'gasPricePerLiter',
  'insurancePerKm',
  'parkingPerDay',
  'depreciationPerKm',
  'maintenancePerKm',
  'riskPerKm',
  'maxPersonsInCar',
  'defaultKilometers',
  'defaultDays',
  'defaultPersonsInCar',
];

const getSetting = (settingsByKey: Partial<Record<AppSettingKey, AppSetting>>, key: AppSettingKey) => {
  const setting = settingsByKey[key];
  if (!setting) {
    throw new Error(`Missing required app setting: ${key}`);
  }

  return setting;
};

const getNumericSetting = (
  settingsByKey: Partial<Record<AppSettingKey, AppSetting>>,
  key: AppSettingKey,
) => {
  const setting = getSetting(settingsByKey, key);
  if (setting.numericValue === null) {
    throw new Error(`Expected numeric value for app setting: ${key}`);
  }

  return Number(setting.numericValue);
};

const getTextSetting = (settingsByKey: Partial<Record<AppSettingKey, AppSetting>>, key: AppSettingKey) => {
  const setting = getSetting(settingsByKey, key);
  if (setting.textValue === null) {
    throw new Error(`Expected text value for app setting: ${key}`);
  }

  return setting.textValue;
};

export const createSettingsSnapshot = (settings: AppSetting[]): SettingsSnapshot => {
  const settingsByKey = settings.reduce<Partial<Record<AppSettingKey, AppSetting>>>((accumulator, setting) => {
    accumulator[setting.key] = setting;
    return accumulator;
  }, {});

  for (const key of REQUIRED_SETTING_KEYS) {
    getSetting(settingsByKey, key);
  }

  return {
    settings,
    settingsByKey: settingsByKey as Record<AppSettingKey, AppSetting>,
    constants: {
      carName: getTextSetting(settingsByKey, 'carName'),
      gasPer100Km: getNumericSetting(settingsByKey, 'gasPer100Km'),
      gasPricePerLiter: getNumericSetting(settingsByKey, 'gasPricePerLiter'),
      insurancePerKm: getNumericSetting(settingsByKey, 'insurancePerKm'),
      parkingPerDay: getNumericSetting(settingsByKey, 'parkingPerDay'),
      depreciationPerKm: getNumericSetting(settingsByKey, 'depreciationPerKm'),
      maintenancePerKm: getNumericSetting(settingsByKey, 'maintenancePerKm'),
      riskPerKm: getNumericSetting(settingsByKey, 'riskPerKm'),
    },
    heroContent: {
      eyebrow: getTextSetting(settingsByKey, 'eyebrow'),
      description: getTextSetting(settingsByKey, 'description'),
      badgePrimary: getTextSetting(settingsByKey, 'badgePrimary'),
      badgeSecondary: getTextSetting(settingsByKey, 'badgeSecondary'),
      badgeTertiary: getTextSetting(settingsByKey, 'badgeTertiary'),
      riskTitle: getTextSetting(settingsByKey, 'riskTitle'),
      riskBody: getTextSetting(settingsByKey, 'riskBody'),
    },
    publicConstantSettings: settings.filter((setting) => setting.groupKey === 'costs'),
    editableSettings: settings.filter((setting) => setting.editableByAdmin),
    tripDefaults: {
      kilometers: getNumericSetting(settingsByKey, 'defaultKilometers'),
      days: getNumericSetting(settingsByKey, 'defaultDays'),
      personsInCar: getNumericSetting(settingsByKey, 'defaultPersonsInCar'),
    },
    maxPersonsInCar: getNumericSetting(settingsByKey, 'maxPersonsInCar'),
  };
};

export const toTripInputDraft = (inputs: TripInputs): TripInputDraft => ({
  kilometers: String(inputs.kilometers),
  days: String(inputs.days),
  personsInCar: String(inputs.personsInCar),
});

const parseDraftNumber = (value: string, fallback: number) => {
  if (value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const parseTripInputDraft = (
  draft: TripInputDraft,
  defaults: TripInputs,
): TripInputs => ({
  kilometers: parseDraftNumber(draft.kilometers, defaults.kilometers),
  days: parseDraftNumber(draft.days, defaults.days),
  personsInCar: parseDraftNumber(draft.personsInCar, defaults.personsInCar),
});

export const createSettingDrafts = (settings: AppSetting[]): AppSettingDraft[] =>
  settings.map((setting) => ({
    key: setting.key,
    groupKey: setting.groupKey,
    label: setting.label,
    helpText: setting.helpText,
    rationale: setting.rationale,
    sourceNote: setting.sourceNote ?? '',
    valueType: setting.valueType,
    rawValue:
      setting.valueType === 'text' ? (setting.textValue ?? '') : String(setting.numericValue ?? ''),
    unit: setting.unit,
    decimals: setting.decimals,
    sortOrder: setting.sortOrder,
    isPublic: setting.isPublic,
    editableByAdmin: setting.editableByAdmin,
  }));

const parseDraftValue = (draft: AppSettingDraft) => {
  if (draft.valueType === 'text') {
    return {
      textValue: draft.rawValue,
      numericValue: null,
    };
  }

  if (draft.rawValue.trim() === '') {
    throw new Error(`${draft.label} requires a value.`);
  }

  const parsed = Number(draft.rawValue);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${draft.label} must be a valid number.`);
  }

  if (draft.valueType === 'integer' && !Number.isInteger(parsed)) {
    throw new Error(`${draft.label} must be a whole number.`);
  }

  return {
    textValue: null,
    numericValue: parsed,
  };
};

export const buildAppSettingUpdates = (
  drafts: AppSettingDraft[],
  settingsByKey: Record<AppSettingKey, AppSetting>,
): AppSettingUpdate[] => {
  const updates: AppSettingUpdate[] = [];

  for (const draft of drafts) {
    const current = settingsByKey[draft.key];
    const { textValue, numericValue } = parseDraftValue(draft);
    const normalizedSourceNote = draft.sourceNote.trim() || null;

    const changed =
      current.label !== draft.label ||
      current.helpText !== draft.helpText ||
      current.rationale !== draft.rationale ||
      current.sourceNote !== normalizedSourceNote ||
      current.textValue !== textValue ||
      current.numericValue !== numericValue;

    if (!changed) {
      continue;
    }

    updates.push({
      key: draft.key,
      label: draft.label,
      helpText: draft.helpText,
      rationale: draft.rationale,
      sourceNote: normalizedSourceNote,
      valueType: draft.valueType,
      textValue,
      numericValue,
    });
  }

  return updates;
};

export const applyDraftsToSettings = (
  drafts: AppSettingDraft[],
  settingsByKey: Record<AppSettingKey, AppSetting>,
): AppSetting[] =>
  drafts.map((draft) => {
    const current = settingsByKey[draft.key];
    const { textValue, numericValue } = parseDraftValue(draft);

    return {
      ...current,
      label: draft.label,
      helpText: draft.helpText,
      rationale: draft.rationale,
      sourceNote: draft.sourceNote.trim() || null,
      textValue,
      numericValue,
    };
  });

export const groupSettingDrafts = (drafts: AppSettingDraft[]) =>
  drafts.reduce<Record<string, AppSettingDraft[]>>((accumulator, draft) => {
    accumulator[draft.groupKey] ??= [];
    accumulator[draft.groupKey].push(draft);
    return accumulator;
  }, {});

export const formatAppSettingValue = (setting: AppSetting) => {
  if (setting.valueType === 'text') {
    return setting.textValue ?? '';
  }

  if (setting.numericValue === null) {
    return '';
  }

  if (setting.unit === 'CA$') {
    return formatCurrency(Number(setting.numericValue), setting.decimals);
  }

  return `${formatNumber(Number(setting.numericValue), setting.decimals)} ${setting.unit}`.trim();
};
