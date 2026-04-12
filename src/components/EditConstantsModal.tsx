import type { FormEvent } from 'react';
import { CONSTANT_FIELDS, DEFAULT_CONSTANTS } from '../lib/defaults';
import { formatCurrency } from '../lib/format';
import type { CostConstants, DerivedCosts } from '../types';
import { Modal } from './Modal';

type EditConstantsModalProps = {
  isOpen: boolean;
  draftConstants: CostConstants;
  derivedPreview: DerivedCosts;
  onChange: <K extends keyof CostConstants>(field: K, value: CostConstants[K]) => void;
  onClose: () => void;
  onReset: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function EditConstantsModal({
  isOpen,
  draftConstants,
  derivedPreview,
  onChange,
  onClose,
  onReset,
  onSubmit,
}: EditConstantsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit constants"
      size="wide"
      footer={
        <>
          <button type="button" className="secondary-button" onClick={onReset}>
            Reset to defaults
          </button>
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="edit-constants-form" className="primary-button">
            Apply changes
          </button>
        </>
      }
    >
      <form id="edit-constants-form" className="edit-grid" onSubmit={onSubmit}>
        {CONSTANT_FIELDS.map((field) => {
          const value = draftConstants[field.key];

          return (
            <label key={field.key} className="field">
              <span>{field.label}</span>
              <input
                aria-label={field.label}
                type={typeof value === 'string' ? 'text' : 'number'}
                step={field.decimals > 0 ? `0.${'0'.repeat(Math.max(field.decimals - 1, 0))}1` : '1'}
                value={value}
                readOnly={field.readOnly}
                onChange={(event) => {
                  if (typeof value === 'string') {
                    onChange(field.key, event.target.value as CostConstants[typeof field.key]);
                    return;
                  }

                  onChange(
                    field.key,
                    (Number(event.target.value) || 0) as CostConstants[typeof field.key],
                  );
                }}
              />
              {field.readOnly ? <small>Locked to the sheet source</small> : null}
            </label>
          );
        })}
      </form>
      <div className="preview-strip">
        <div>
          <span>Gas cost / km</span>
          <strong>{formatCurrency(derivedPreview.gasCostPerKm, 5)}</strong>
        </div>
        <div>
          <span>Total cost / km</span>
          <strong>{formatCurrency(derivedPreview.totalCostPerKm, 5)}</strong>
        </div>
        <div>
          <span>Default car</span>
          <strong>{DEFAULT_CONSTANTS.carName}</strong>
        </div>
      </div>
    </Modal>
  );
}
