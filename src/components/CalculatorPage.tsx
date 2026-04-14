import type {
  AppSetting,
  LoadStatus,
  CostConstants,
  DerivedCosts,
  ExplainKey,
  HeroContent,
  TripInputDraft,
  TripInputs,
} from '../types';
import civicImage from '../../images/civic-960.png';
import crashedCivicImage from '../../images/crashed-civic-320.png';
import { ConstantsCard } from './ConstantsCard';
import { HeroPanel } from './HeroPanel';
import { ResultCard } from './ResultCard';
import { TripInputsCard } from './TripInputsCard';

type CalculatorPageProps = {
  settingsStatus: LoadStatus;
  settingsError: string | null;
  onRetrySettingsLoad: () => void;
  constants?: CostConstants;
  constantSettings?: AppSetting[];
  derived?: DerivedCosts;
  heroContent?: HeroContent;
  inputDraft: TripInputDraft;
  inputs?: TripInputs;
  maxPersonsInCar?: number;
  editorName: string;
  isAdmin: boolean;
  isAdminSessionLoading: boolean;
  onInputChange: (field: keyof TripInputDraft, value: string) => void;
  onExplain: (key: ExplainKey) => void;
  onRequestEdit: () => void;
  onSignOut: () => void;
};

export function CalculatorPage({
  settingsStatus,
  settingsError,
  onRetrySettingsLoad,
  constants,
  constantSettings,
  derived,
  heroContent,
  inputDraft,
  inputs,
  maxPersonsInCar,
  editorName,
  isAdmin,
  isAdminSessionLoading,
  onInputChange,
  onExplain,
  onRequestEdit,
  onSignOut,
}: CalculatorPageProps) {
  const isLoading = settingsStatus === 'loading';
  const isError = settingsStatus === 'error';

  return (
    <div className="app-shell">
      <HeroPanel
        carName={constants?.carName}
        content={heroContent}
        imageSrc={civicImage}
        riskImageSrc={crashedCivicImage}
        isLoading={isLoading}
        isError={isError && Boolean(settingsError)}
      />
      <main className="calculator-shell">
        <TripInputsCard
          inputs={inputDraft}
          maxPersonsInCar={maxPersonsInCar}
          isSettingsReady={settingsStatus === 'ready'}
          isSettingsError={isError}
          onRetrySettingsLoad={onRetrySettingsLoad}
          onChange={onInputChange}
        />
        <ResultCard
          derived={derived}
          inputs={inputs}
          isLoading={isLoading}
          isError={isError}
          onRetry={onRetrySettingsLoad}
        />
        <ConstantsCard
          settings={constantSettings}
          derived={derived}
          isLoading={isLoading}
          isError={isError}
          isAdminSessionLoading={isAdminSessionLoading}
          onRetry={onRetrySettingsLoad}
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
