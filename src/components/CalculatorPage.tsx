import type { CostConstants, DerivedCosts, ExplainKey, TripInputs } from '../types';
import civicImage from '../../images/civic.png';
import crashedCivicImage from '../../images/crashed-civic.png';
import { ConstantsCard } from './ConstantsCard';
import { HeroPanel } from './HeroPanel';
import { ResultCard } from './ResultCard';
import { TripInputsCard } from './TripInputsCard';

type CalculatorPageProps = {
  constants: CostConstants;
  derived: DerivedCosts;
  inputs: TripInputs;
  editorName: string;
  onInputChange: (field: keyof TripInputs, value: number) => void;
  onExplain: (key: ExplainKey) => void;
  onRequestEdit: () => void;
};

export function CalculatorPage({
  constants,
  derived,
  inputs,
  editorName,
  onInputChange,
  onExplain,
  onRequestEdit,
}: CalculatorPageProps) {
  return (
    <div className="app-shell">
      <HeroPanel carName={constants.carName} imageSrc={civicImage} riskImageSrc={crashedCivicImage} />
      <main className="calculator-shell">
        <TripInputsCard inputs={inputs} onChange={onInputChange} />
        <ResultCard derived={derived} inputs={inputs} />
        <ConstantsCard
          constants={constants}
          derived={derived}
          onExplain={onExplain}
          onRequestEdit={onRequestEdit}
          editorName={editorName}
        />
      </main>
    </div>
  );
}
