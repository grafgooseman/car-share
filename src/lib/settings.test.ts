import { buildAppSettingUpdates, createSettingDrafts, createSettingsSnapshot } from './settings';
import { seededAppSettings } from '../test/fixtures/appSettings';

describe('createSettingsSnapshot', () => {
  it('maps Supabase rows into calculator runtime settings', () => {
    const snapshot = createSettingsSnapshot(seededAppSettings);

    expect(snapshot.constants.carName).toBe('Honda Civic Sedan 2012');
    expect(snapshot.heroContent.eyebrow).toBe('Trip Cost Splitter');
    expect(snapshot.heroContent.riskTitle).toBe('Risk coverage matters');
    expect(snapshot.constants.gasPricePerLiter).toBe(1.78);
    expect(snapshot.maxPersonsInCar).toBe(5);
    expect(snapshot.tripDefaults).toEqual({
      kilometers: 120,
      days: 1,
      personsInCar: 3,
    });
    expect(snapshot.publicConstantSettings).toHaveLength(8);
  });
});

describe('buildAppSettingUpdates', () => {
  it('returns only changed rows with parsed values', () => {
    const snapshot = createSettingsSnapshot(seededAppSettings);
    const drafts = createSettingDrafts(snapshot.editableSettings).map((draft) =>
      draft.key === 'gasPricePerLiter'
        ? {
            ...draft,
            rawValue: '2.05',
            helpText: 'Updated gas price help text.',
          }
        : draft,
    );

    const updates = buildAppSettingUpdates(drafts, snapshot.settingsByKey);

    expect(updates).toEqual([
      {
        key: 'gasPricePerLiter',
        label: 'Gas price / L',
        helpText: 'Updated gas price help text.',
        rationale:
          '1.78 CA$ / L is the assumed gas price the current calculator uses for every trip estimate until an admin updates it.',
        sourceNote: 'Spreadsheet cost input carried into the app.',
        valueType: 'number',
        textValue: null,
        numericValue: 2.05,
      },
    ]);
  });
});
