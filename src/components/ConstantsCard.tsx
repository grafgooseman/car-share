import { formatCurrency } from '../lib/format';
import { formatAppSettingValue } from '../lib/settings';
import type { AppSetting, DerivedCosts, ExplainKey } from '../types';

type ConstantsCardProps = {
  settings?: AppSetting[];
  derived?: DerivedCosts;
  onExplain: (key: ExplainKey) => void;
  onRequestEdit: () => void;
  onSignOut: () => void;
  editorName: string;
  isAdmin: boolean;
  isLoading: boolean;
  isError: boolean;
  isAdminSessionLoading: boolean;
  onRetry: () => void;
};

export function ConstantsCard({
  settings,
  derived,
  onExplain,
  onRequestEdit,
  onSignOut,
  editorName,
  isAdmin,
  isLoading,
  isError,
  isAdminSessionLoading,
  onRetry,
}: ConstantsCardProps) {
  const isEditDisabled = isLoading || isError || isAdminSessionLoading;
  const statusLabel = isError
    ? 'Constants unavailable'
    : isLoading
      ? 'Loading constants'
      : isAdminSessionLoading
        ? 'Checking admin access'
        : 'Live constants ready';

  return (
    <section className={`panel-card${isLoading ? ' panel-card--loading' : ''}`}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Constants</p>
          <h2>What this calculator uses</h2>
        </div>
        {/* <span className={`status-pill${isLoading || isError || isAdminSessionLoading ? ' status-pill--pending' : ''}`}>
          {statusLabel}
        </span> */}
        <div className="section-actions">
          {editorName ? <span className="editor-pill">Editing as {editorName}</span> : null}
          {isAdmin && !isAdminSessionLoading ? (
            <button type="button" className="secondary-button" onClick={onSignOut}>
              Sign out
            </button>
          ) : null}
          <button type="button" className="secondary-button" onClick={onRequestEdit} disabled={isEditDisabled}>
            {isAdminSessionLoading ? 'Checking admin access...' : 'Edit constants'}
          </button>
        </div>
      </div>
      {isError ? (
        <div className="inline-banner inline-banner--panel">
          <p>Constants could not be loaded from Supabase.</p>
          <button type="button" className="secondary-button" onClick={onRetry}>
            Retry settings load
          </button>
        </div>
      ) : null}
      {isLoading ? (
        <p className="section-note">Loading the current constants and explanations from Supabase.</p>
      ) : null}
      <div className="constants-grid">
        {isLoading || !settings || !derived ? (
          Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="constant-row constant-row--skeleton" data-testid="constants-skeleton-grid">
              <div>
                <span className="skeleton skeleton-line skeleton-line--constant-label" />
                <span className="skeleton skeleton-line skeleton-line--constant-unit skeleton-line--short" />
              </div>
              <div className="constant-value-wrap">
                <span className="skeleton skeleton-line skeleton-line--constant-value" />
                <span className="skeleton skeleton-line skeleton-line--constant-unit skeleton-line--short" />
              </div>
            </div>
          ))
        ) : (
          <>
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
          </>
        )}
      </div>
    </section>
  );
}
