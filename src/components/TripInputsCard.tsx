import type { TripInputDraft } from '../types';

type TripInputsCardProps = {
  inputs: TripInputDraft;
  maxPersonsInCar?: number;
  isSettingsReady: boolean;
  isSettingsError: boolean;
  onRetrySettingsLoad: () => void;
  onChange: (field: keyof TripInputDraft, value: string) => void;
};

const MAX_KILOMETER_SLIDER = 500;

const getSliderValue = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.min(parsed, MAX_KILOMETER_SLIDER));
};

export function TripInputsCard({
  inputs,
  maxPersonsInCar,
  isSettingsReady,
  isSettingsError,
  onRetrySettingsLoad,
  onChange,
}: TripInputsCardProps) {
  // const personsHelpText = isSettingsReady
  //   ? `Including the driver.`
  //   : isSettingsError
  //     ? 'Trip settings are unavailable.'
  //     : ' ';

  return (
    <section className="panel-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Trip Inputs</p>
          <h2>Trip details</h2>
        </div>
        {/* <span className={`status-pill${isSettingsReady ? '' : ' status-pill--pending'}`}>
          {isSettingsReady ? 'Live limits active' : isSettingsError ? 'Live limits unavailable' : 'Loading live limits'}
        </span> */}
      </div>
      {isSettingsReady ? null : (
        <div className="inline-banner inline-banner--panel">
          <p>
            {isSettingsError
              ? 'Trip settings failed to load. Retry to enable calculation.'
              : 'Trip settings are loading. You can fill inputs now; calculation will start when ready.'}
          </p>
          {isSettingsError ? (
            <button type="button" className="secondary-button" onClick={onRetrySettingsLoad}>
              Retry settings load
            </button>
          ) : null}
        </div>
      )}
      <div className="input-grid">
        <div className="field field--kilometers">
          <span>Kilometers</span>
          <div className="slider-field">
            <input
              aria-label="Kilometers slider"
              className="slider-input"
              type="range"
              min="0"
              max={String(MAX_KILOMETER_SLIDER)}
              step="10"
              value={String(getSliderValue(inputs.kilometers))}
              onChange={(event) => onChange('kilometers', event.target.value)}
            />
            <input
              aria-label="Kilometers"
              type="number"
              inputMode="decimal"
              step="0.1"
              value={inputs.kilometers}
              onChange={(event) => onChange('kilometers', event.target.value)}
            />
          </div>
        </div>
        <label className="field field--days">
          <span>Days</span>
          <input
            aria-label="Days"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={inputs.days}
            onChange={(event) => onChange('days', event.target.value)}
          />
        </label>
        <label className="field field--persons">
          <span>Persons in car</span>
          {isSettingsReady && maxPersonsInCar ? (
            <select
              aria-label="Persons in car"
              value={inputs.personsInCar}
              onChange={(event) => onChange('personsInCar', event.target.value)}
            >
              {Array.from({ length: maxPersonsInCar }, (_, index) => {
                const value = String(index + 1);

                return (
                  <option key={value} value={value}>
                    {value}
                  </option>
                );
              })}
            </select>
          ) : (
            <input
              aria-label="Persons in car"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={inputs.personsInCar}
              onChange={(event) => onChange('personsInCar', event.target.value)}
            />
          )}
          <small>Including the driver</small>
        </label>
      </div>
    </section>
  );
}
