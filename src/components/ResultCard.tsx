import type { DerivedCosts, TripInputs } from '../types';
import { formatCurrency, formatSmartNumber } from '../lib/format';

type ResultCardProps = {
  derived?: DerivedCosts;
  inputs?: TripInputs;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

export function ResultCard({ derived, inputs, isLoading, isError, onRetry }: ResultCardProps) {
  return (
    <section className={`panel-card panel-card--result${isLoading ? ' panel-card--loading' : ''}`}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Live Result</p>
          <h2>How much each person owes</h2>
        </div>
        {/* <span className={`status-pill status-pill--result${isLoading ? ' status-pill--pending' : ''}`}>
          {isError ? 'Result paused' : isLoading ? 'Waiting for settings' : 'Calculation ready'}
        </span> */}
      </div>
      {isError ? (
        <div className="inline-banner inline-banner--result">
          <p>Calculator settings could not be loaded, so the live result is unavailable.</p>
          <button type="button" className="secondary-button" onClick={onRetry}>
            Retry settings load
          </button>
        </div>
      ) : isLoading || !derived || !inputs ? (
        <>
          <div className="result-layout" data-testid="result-skeleton">
            <div>
              <p className="result-label">Per person</p>
              <div className="skeleton skeleton-block skeleton-block--result-amount" />
            </div>
            <dl className="result-stats result-stats--skeleton">
              <div>
                <dt>Total trip cost</dt>
                <dd>
                  <span className="skeleton skeleton-line skeleton-line--result-stat" />
                </dd>
              </div>
              <div>
                <dt>Total cost / km</dt>
                <dd>
                  <span className="skeleton skeleton-line skeleton-line--result-stat" />
                </dd>
              </div>
              <div>
                <dt>Passengers</dt>
                <dd>
                  <span className="skeleton skeleton-line skeleton-line--result-stat skeleton-line--short" />
                </dd>
              </div>
            </dl>
          </div>
          <p className="formula-line">Waiting for calculator settings from Supabase before running the formula.</p>
        </>
      ) : (
        <>
          <div className="result-layout">
            <div>
              <p className="result-label">Per person</p>
              <p className="result-amount" aria-live="polite">
                {formatCurrency(derived.costPerPerson, 0)}
              </p>
            </div>
            <dl className="result-stats">
              <div>
                <dt>Total trip cost</dt>
                <dd>{formatCurrency(derived.tripTotal)}</dd>
              </div>
              <div>
                <dt>Total cost / km</dt>
                <dd>{formatCurrency(derived.totalCostPerKm, 5)}</dd>
              </div>
              <div>
                <dt>Passengers</dt>
                <dd>{formatSmartNumber(inputs.personsInCar, 0)}</dd>
              </div>
            </dl>
          </div>
          <p className="formula-line">Formula: ceil((total cost/km * km + parking/day * days) / persons in car)</p>
        </>
      )}
    </section>
  );
}
