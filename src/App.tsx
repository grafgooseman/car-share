import { useState } from 'react';
import type { FormEvent } from 'react';
import { CalculatorPage } from './components/CalculatorPage';
import { EditConstantsModal } from './components/EditConstantsModal';
import { InfoModal } from './components/InfoModal';
import { VerifyModal } from './components/VerifyModal';
import { calculateDerivedCosts, sanitizeTripInputs } from './lib/calculations';
import { ADMIN_PASSWORD, DEFAULT_CONSTANTS, DEFAULT_TRIP_INPUTS } from './lib/defaults';
import type { CostConstants, ExplainKey, TripInputs } from './types';

function App() {
  const [tripInputs, setTripInputs] = useState<TripInputs>(DEFAULT_TRIP_INPUTS);
  const [constants, setConstants] = useState<CostConstants>(DEFAULT_CONSTANTS);
  const [draftConstants, setDraftConstants] = useState<CostConstants>(DEFAULT_CONSTANTS);
  const [explainKey, setExplainKey] = useState<ExplainKey | null>(null);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAuthenticatedForEdit, setIsAuthenticatedForEdit] = useState(false);
  const [authName, setAuthName] = useState('');
  const [editorName, setEditorName] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const sanitizedInputs = sanitizeTripInputs(tripInputs);
  const derived = calculateDerivedCosts(sanitizedInputs, constants);
  const draftPreview = calculateDerivedCosts(sanitizedInputs, draftConstants);

  const updateTripInput = (field: keyof TripInputs, value: number) => {
    setTripInputs((current) => sanitizeTripInputs({ ...current, [field]: value }));
  };

  const requestEditConstants = () => {
    setDraftConstants(constants);

    if (isAuthenticatedForEdit) {
      setIsEditOpen(true);
      return;
    }

    setAuthError('');
    setIsVerifyOpen(true);
  };

  const handleVerify = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (authPassword !== ADMIN_PASSWORD) {
      setAuthError('Incorrect password.');
      return;
    }

    setIsAuthenticatedForEdit(true);
    setEditorName(authName.trim() || 'Verified editor');
    setAuthError('');
    setAuthPassword('');
    setIsVerifyOpen(false);
    setIsEditOpen(true);
  };

  const handleDraftChange = <K extends keyof CostConstants>(field: K, value: CostConstants[K]) => {
    setDraftConstants((current) => ({
      ...current,
      [field]: typeof value === 'number' && !Number.isFinite(value) ? 0 : value,
    }));
  };

  const handleApplyConstants = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConstants(draftConstants);
    setIsEditOpen(false);
  };

  return (
    <>
      <CalculatorPage
        constants={constants}
        derived={derived}
        inputs={sanitizedInputs}
        editorName={editorName}
        onInputChange={updateTripInput}
        onExplain={setExplainKey}
        onRequestEdit={requestEditConstants}
      />
      <InfoModal
        isOpen={explainKey !== null}
        explainKey={explainKey}
        constants={constants}
        derived={derived}
        onClose={() => setExplainKey(null)}
      />
      <VerifyModal
        isOpen={isVerifyOpen}
        authName={authName}
        authPassword={authPassword}
        authError={authError}
        onNameChange={setAuthName}
        onPasswordChange={setAuthPassword}
        onClose={() => {
          setIsVerifyOpen(false);
          setAuthError('');
          setAuthPassword('');
        }}
        onSubmit={handleVerify}
      />
      <EditConstantsModal
        isOpen={isEditOpen}
        draftConstants={draftConstants}
        derivedPreview={draftPreview}
        onChange={handleDraftChange}
        onClose={() => {
          setDraftConstants(constants);
          setIsEditOpen(false);
        }}
        onReset={() => setDraftConstants(DEFAULT_CONSTANTS)}
        onSubmit={handleApplyConstants}
      />
    </>
  );
}

export default App;
