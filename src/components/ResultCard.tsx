import type { DerivedCosts, TripInputs } from '../types';
import { formatCurrency, formatSmartNumber } from '../lib/format';

type ResultCardProps = {
  derived: DerivedCosts;
  inputs: TripInputs;
};

export function ResultCard({ derived, inputs }: ResultCardProps) {
  return (
    <section className="panel-card panel-card--result">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Live Result</p>
          <h2>How much each person owes</h2>
        </div>
      </div>
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
    </section>
  );
}
