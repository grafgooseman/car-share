import { getExplainItems } from '../lib/explain';
import { formatCurrency, formatNumber } from '../lib/format';
import type { CostConstants, DerivedCosts, ExplainKey } from '../types';
import { Modal } from './Modal';

type InfoModalProps = {
  isOpen: boolean;
  explainKey: ExplainKey | null;
  constants: CostConstants;
  derived: DerivedCosts;
  onClose: () => void;
};

const getCurrentValue = (key: ExplainKey, constants: CostConstants, derived: DerivedCosts) => {
  if (key in constants) {
    const constantValue = constants[key as keyof CostConstants];
    if (typeof constantValue === 'string') {
      return constantValue;
    }

    if (key === 'gasPer100Km') {
      return `${formatNumber(constantValue, 1)} L / 100 km`;
    }

    return formatCurrency(constantValue, key === 'maintenancePerKm' ? 3 : 2);
  }

  if (key === 'costPerPerson') {
    return formatCurrency(derived.costPerPerson, 0);
  }

  if (key === 'gasCostPerKm') {
    return formatCurrency(derived.gasCostPerKm, 5);
  }

  return formatCurrency(derived.totalCostPerKm, 5);
};

export function InfoModal({ isOpen, explainKey, constants, derived, onClose }: InfoModalProps) {
  const item = getExplainItems(constants).find((entry) => entry.key === explainKey);

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
          <strong>{getCurrentValue(explainKey, constants, derived)}</strong>
        </div>
        {explainKey === 'gasPer100Km' ? (
          <p className="support-note">Spreadsheet value: {formatNumber(constants.gasPer100Km, 1)} L / 100 km</p>
        ) : null}
      </div>
    </Modal>
  );
}
