import { formatCurrency } from '../lib/format';
import { formatAppSettingValue } from '../lib/settings';
import type { AppSetting, DerivedCosts, ExplainKey } from '../types';

type ConstantsCardProps = {
  settings: AppSetting[];
  derived: DerivedCosts;
  onExplain: (key: ExplainKey) => void;
  onRequestEdit: () => void;
  onSignOut: () => void;
  editorName: string;
  isAdmin: boolean;
};

export function ConstantsCard({
  settings,
  derived,
  onExplain,
  onRequestEdit,
  onSignOut,
  editorName,
  isAdmin,
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
          {isAdmin ? (
            <button type="button" className="secondary-button" onClick={onSignOut}>
              Sign out
            </button>
          ) : null}
          <button type="button" className="secondary-button" onClick={onRequestEdit}>
            Edit constants
          </button>
        </div>
      </div>
      <div className="constants-grid">
        {settings.map((setting) => (
          <button
            key={setting.key}
            type="button"
            className="constant-row"
            onClick={() => onExplain(setting.key)}
          >
            <div>
              <span className="constant-label">{setting.label}</span>
              <span className="constant-unit">{setting.unit || 'Details'}</span>
            </div>
            <div className="constant-value-wrap">
              <span className="constant-value">{formatAppSettingValue(setting)}</span>
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
