import type { FormEvent } from 'react';
import { preventScrollValueChange } from '../lib/input';
import {
  applyDraftsToSettings,
  createSettingsSnapshot,
  formatAppSettingValue,
  groupSettingDrafts,
} from '../lib/settings';
import { calculateDerivedCosts } from '../lib/calculations';
import { formatCurrency } from '../lib/format';
import type { AppSettingDraft, SettingsSnapshot, TripInputs } from '../types';
import { Modal } from './Modal';

type EditSettingsModalProps = {
  isOpen: boolean;
  draftSettings: AppSettingDraft[];
  settingsSnapshot: SettingsSnapshot;
  tripInputs: TripInputs;
  isSaving: boolean;
  saveError: string;
  onRawValueChange: (key: AppSettingDraft['key'], value: string) => void;
  onTextFieldChange: (
    key: AppSettingDraft['key'],
    field: 'label' | 'helpText' | 'rationale' | 'sourceNote',
    value: string,
  ) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const GROUP_TITLES: Record<string, string> = {
  costs: 'Cost settings',
  hero: 'Hero content',
  trip_defaults: 'Trip defaults',
  trip_rules: 'Trip rules',
};

export function EditSettingsModal({
  isOpen,
  draftSettings,
  settingsSnapshot,
  tripInputs,
  isSaving,
  saveError,
  onRawValueChange,
  onTextFieldChange,
  onClose,
  onSubmit,
}: EditSettingsModalProps) {
  const groupedDrafts = groupSettingDrafts(draftSettings);
  let previewSnapshot = settingsSnapshot;

  try {
    const previewSettings = applyDraftsToSettings(draftSettings, settingsSnapshot.settingsByKey);
    previewSnapshot = createSettingsSnapshot(previewSettings);
  } catch {
    previewSnapshot = settingsSnapshot;
  }

  const previewDerived = calculateDerivedCosts(tripInputs, previewSnapshot.constants);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit constants"
      size="wide"
      footer={
        <>
          <button type="button" className="secondary-button" onClick={onClose}>
            Discard unsaved changes
          </button>
          <button type="submit" form="edit-settings-form" className="primary-button" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </>
      }
    >
      <form id="edit-settings-form" className="stack-form" onSubmit={onSubmit}>
        {Object.entries(groupedDrafts).map(([groupKey, drafts]) => (
          <section key={groupKey} className="settings-group">
            <div className="settings-group__heading">
              <p className="eyebrow">Settings</p>
              <h3>{GROUP_TITLES[groupKey] ?? groupKey}</h3>
            </div>
            <div className="settings-group__grid">
              {drafts.map((draft) => (
                <article key={draft.key} className="setting-editor-card">
                  <div className="setting-editor-card__header">
                    <div>
                      <strong>{draft.label}</strong>
                      <p>{formatAppSettingValue(settingsSnapshot.settingsByKey[draft.key])}</p>
                    </div>
                    <span className="editor-chip">{draft.valueType}</span>
                  </div>
                  <div className="stack-form">
                    <label className="field">
                      <span>{draft.label} value</span>
                      <input
                        aria-label={`${draft.label} value`}
                        type={draft.valueType === 'text' ? 'text' : 'number'}
                        step={draft.valueType === 'integer' ? '1' : 'any'}
                        value={draft.rawValue}
                        onWheel={draft.valueType === 'text' ? undefined : preventScrollValueChange}
                        onChange={(event) => onRawValueChange(draft.key, event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Display label</span>
                      <input
                        aria-label={`${draft.label} display label`}
                        value={draft.label}
                        onChange={(event) => onTextFieldChange(draft.key, 'label', event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Explanation</span>
                      <textarea
                        aria-label={`${draft.label} explanation`}
                        rows={3}
                        value={draft.helpText}
                        onChange={(event) => onTextFieldChange(draft.key, 'helpText', event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Why this value</span>
                      <textarea
                        aria-label={`${draft.label} rationale`}
                        rows={3}
                        value={draft.rationale}
                        onChange={(event) => onTextFieldChange(draft.key, 'rationale', event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Source note</span>
                      <textarea
                        aria-label={`${draft.label} source note`}
                        rows={2}
                        value={draft.sourceNote}
                        onChange={(event) => onTextFieldChange(draft.key, 'sourceNote', event.target.value)}
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        {saveError ? <p className="error-text">{saveError}</p> : null}
      </form>
      <div className="preview-strip">
        <div>
          <span>Gas cost / km</span>
          <strong>{formatCurrency(previewDerived.gasCostPerKm, 5)}</strong>
        </div>
        <div>
          <span>Total cost / km</span>
          <strong>{formatCurrency(previewDerived.totalCostPerKm, 5)}</strong>
        </div>
        <div>
          <span>Current car</span>
          <strong>{previewSnapshot.constants.carName}</strong>
        </div>
      </div>
    </Modal>
  );
}
