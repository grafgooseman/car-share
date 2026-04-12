import type { AppSetting, CostConstants, DerivedCosts, ExplainKey, TripInputDraft, TripInputs } from '../types';
import civicImage from '../../images/civic-960.png';
import crashedCivicImage from '../../images/crashed-civic-320.png';
import { ConstantsCard } from './ConstantsCard';
import { HeroPanel } from './HeroPanel';
import { ResultCard } from './ResultCard';
import { TripInputsCard } from './TripInputsCard';

type CalculatorPageProps = {
  constants: CostConstants;
  constantSettings: AppSetting[];
  derived: DerivedCosts;
  inputDraft: TripInputDraft;
  inputs: TripInputs;
  maxPersonsInCar: number;
  editorName: string;
  isAdmin: boolean;
  onInputChange: (field: keyof TripInputDraft, value: string) => void;
  onExplain: (key: ExplainKey) => void;
  onRequestEdit: () => void;
  onSignOut: () => void;
};

export function CalculatorPage({
  constants,
  constantSettings,
  derived,
  inputDraft,
  inputs,
  maxPersonsInCar,
  editorName,
  isAdmin,
  onInputChange,
  onExplain,
  onRequestEdit,
  onSignOut,
}: CalculatorPageProps) {
  return (
    <div className="app-shell">
      <HeroPanel carName={constants.carName} imageSrc={civicImage} riskImageSrc={crashedCivicImage} />
      <main className="calculator-shell">
        <TripInputsCard inputs={inputDraft} maxPersonsInCar={maxPersonsInCar} onChange={onInputChange} />
        <ResultCard derived={derived} inputs={inputs} />
        <ConstantsCard
          settings={constantSettings}
          derived={derived}
          onExplain={onExplain}
          onRequestEdit={onRequestEdit}
          onSignOut={onSignOut}
          editorName={editorName}
          isAdmin={isAdmin}
        />
      </main>
    </div>
  );
}
