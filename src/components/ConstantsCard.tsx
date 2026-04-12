import { CONSTANT_FIELDS } from '../lib/defaults';
import { formatCurrency, formatNumber } from '../lib/format';
import type { ConstantField, CostConstants, DerivedCosts, ExplainKey } from '../types';

type ConstantsCardProps = {
  constants: CostConstants;
  derived: DerivedCosts;
  onExplain: (key: ExplainKey) => void;
  onRequestEdit: () => void;
  editorName: string;
};

const renderFieldValue = (field: ConstantField, constants: CostConstants) => {
  const value = constants[field.key];
  if (typeof value === 'string') {
    return value;
  }

  if (field.unit === 'CA$') {
    return formatCurrency(value, field.decimals);
  }

  return `${formatNumber(value, field.decimals)} ${field.unit}`.trim();
};

export function ConstantsCard({
  constants,
  derived,
  onExplain,
  onRequestEdit,
  editorName,
}: ConstantsCardProps) {
  return (
    <section className="panel-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Constants</p>
          <h2>What this calculator uses</h2>
        </div>
        <div className="section-actions">
          {editorName ? <span className="editor-pill">Editing as {editorName}</span> : null}
          <button type="button" className="secondary-button" onClick={onRequestEdit}>
            Edit constants
          </button>
        </div>
      </div>
      <div className="constants-grid">
        {CONSTANT_FIELDS.map((field) => (
          <button
            key={field.key}
            type="button"
            className="constant-row"
            onClick={() => onExplain(field.key)}
          >
            <div>
              <span className="constant-label">{field.label}</span>
              <span className="constant-unit">{field.unit || 'Details'}</span>
            </div>
            <div className="constant-value-wrap">
              <span className="constant-value">{renderFieldValue(field, constants)}</span>
              <span className="constant-link">How it works</span>
            </div>
          </button>
        ))}
        <button
          type="button"
          className="constant-row constant-row--derived"
          onClick={() => onExplain('gasCostPerKm')}
        >
          <div>
            <span className="constant-label">Gas cost / km</span>
            <span className="constant-unit">Derived</span>
          </div>
          <div className="constant-value-wrap">
            <span className="constant-value">{formatCurrency(derived.gasCostPerKm, 5)}</span>
            <span className="constant-link">Formula</span>
          </div>
        </button>
        <button
          type="button"
          className="constant-row constant-row--derived"
          onClick={() => onExplain('totalCostPerKm')}
        >
          <div>
            <span className="constant-label">Total cost / km</span>
            <span className="constant-unit">Derived</span>
          </div>
          <div className="constant-value-wrap">
            <span className="constant-value">{formatCurrency(derived.totalCostPerKm, 5)}</span>
            <span className="constant-link">Formula</span>
          </div>
        </button>
      </div>
    </section>
  );
}
