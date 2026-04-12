import { getExplainItem } from '../lib/explain';
import { formatCurrency } from '../lib/format';
import { formatAppSettingValue } from '../lib/settings';
import type { DerivedCosts, ExplainKey, SettingsSnapshot } from '../types';
import { Modal } from './Modal';

type InfoModalProps = {
  isOpen: boolean;
  explainKey: ExplainKey | null;
  settingsSnapshot: SettingsSnapshot;
  derived: DerivedCosts;
  onClose: () => void;
};

const getCurrentValue = (
  key: ExplainKey,
  settingsSnapshot: SettingsSnapshot,
  derived: DerivedCosts,
) => {
  const setting = settingsSnapshot.settingsByKey[key as keyof typeof settingsSnapshot.settingsByKey];
  if (setting) {
    return formatAppSettingValue(setting);
  }

  if (key === 'costPerPerson') {
    return formatCurrency(derived.costPerPerson, 0);
  }

  if (key === 'gasCostPerKm') {
    return formatCurrency(derived.gasCostPerKm, 5);
  }

  return formatCurrency(derived.totalCostPerKm, 5);
};

export function InfoModal({ isOpen, explainKey, settingsSnapshot, derived, onClose }: InfoModalProps) {
  const item = getExplainItem(explainKey, settingsSnapshot);

  if (!item || !explainKey) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.label}
      footer={
        <button type="button" className="primary-button" onClick={onClose}>
          Close
        </button>
      }
    >
      <div className="modal-copy">
        <p>{item.description}</p>
        {item.formula ? (
          <div className="formula-box">
            <span>Formula</span>
            <strong>{item.formula}</strong>
          </div>
        ) : null}
        <div className="value-box">
          <span>Current value</span>
          <strong>{getCurrentValue(explainKey, settingsSnapshot, derived)}</strong>
        </div>
        {item.rationale ? (
          <div className="value-box">
            <span>Why this value</span>
            <strong>{item.rationale}</strong>
          </div>
        ) : null}
        {item.sourceNote ? <p className="support-note">Source note: {item.sourceNote}</p> : null}
      </div>
    </Modal>
  );
}
