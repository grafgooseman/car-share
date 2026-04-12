import type { ChangeEvent } from 'react';
import type { TripInputs } from '../types';

type TripInputsCardProps = {
  inputs: TripInputs;
  onChange: (field: keyof TripInputs, value: number) => void;
};

const parseFieldValue = (event: ChangeEvent<HTMLInputElement>) => {
  const next = Number(event.target.value);
  return Number.isFinite(next) ? next : 0;
};

export function TripInputsCard({ inputs, onChange }: TripInputsCardProps) {
  return (
    <section className="panel-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Trip Inputs</p>
          <h2>Trip details</h2>
        </div>
      </div>
      <div className="input-grid">
        <label className="field">
          <span>Kilometers</span>
          <input
            aria-label="Kilometers"
            type="number"
            min="0"
            step="0.1"
            value={inputs.kilometers}
            onChange={(event) => onChange('kilometers', parseFieldValue(event))}
          />
        </label>
        <label className="field">
          <span>Days</span>
          <input
            aria-label="Days"
            type="number"
            min="0"
            step="0.1"
            value={inputs.days}
            onChange={(event) => onChange('days', parseFieldValue(event))}
          />
        </label>
        <label className="field">
          <span>Persons in car</span>
          <input
            aria-label="Persons in car"
            type="number"
            min="1"
            max="5"
            step="1"
            value={inputs.personsInCar}
            onChange={(event) => onChange('personsInCar', parseFieldValue(event))}
          />
          <small>Including driver</small>
        </label>
      </div>
    </section>
  );
}
