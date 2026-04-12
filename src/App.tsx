import { startTransition, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AdminRegisterModal } from './components/AdminRegisterModal';
import { AdminSignInModal } from './components/AdminSignInModal';
import { CalculatorPage } from './components/CalculatorPage';
import { EditSettingsModal } from './components/EditSettingsModal';
import { InfoModal } from './components/InfoModal';
import { calculateDerivedCosts, sanitizeTripInputs } from './lib/calculations';
import {
  fetchAdminSession,
  fetchPublicSettings,
  signInAdmin,
  signOutAdmin,
  signUpAdmin,
  subscribeToAuthChanges,
  updateAppSettings,
} from './lib/supabaseApi';
import {
  buildAppSettingUpdates,
  createSettingDrafts,
  createSettingsSnapshot,
  parseTripInputDraft,
  toTripInputDraft,
} from './lib/settings';
import type { AdminSession, AppSettingDraft, ExplainKey, SettingsSnapshot, TripInputDraft } from './types';

const EMPTY_TRIP_DRAFT: TripInputDraft = {
  kilometers: '',
  days: '',
  personsInCar: '',
};

const EMPTY_ADMIN_SESSION: AdminSession = {
  authEmail: null,
  adminUser: null,
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong.';

function App() {
  const [settingsSnapshot, setSettingsSnapshot] = useState<SettingsSnapshot | null>(null);
  const [inputDraft, setInputDraft] = useState<TripInputDraft>(EMPTY_TRIP_DRAFT);
  const [adminSession, setAdminSession] = useState<AdminSession>(EMPTY_ADMIN_SESSION);
  const [explainKey, setExplainKey] = useState<ExplainKey | null>(null);
  const [draftSettings, setDraftSettings] = useState<AppSettingDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState('');
  const [signInNotice, setSignInNotice] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState('testcode');
  const [registerError, setRegisterError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadApp = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const [settings, nextAdminSession] = await Promise.all([fetchPublicSettings(), fetchAdminSession()]);
        if (!isActive) {
          return;
        }

        const nextSnapshot = createSettingsSnapshot(settings);
        startTransition(() => {
          setSettingsSnapshot(nextSnapshot);
          setInputDraft(toTripInputDraft(nextSnapshot.tripDefaults));
          setAdminSession(nextAdminSession);
          setIsLoading(false);
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setLoadError(getErrorMessage(error));
        setIsLoading(false);
      }
    };

    void loadApp();

    const unsubscribe = subscribeToAuthChanges(async () => {
      try {
        const nextAdminSession = await fetchAdminSession();
        if (!isActive) {
          return;
        }

        startTransition(() => {
          setAdminSession(nextAdminSession);
        });
      } catch {
        if (!isActive) {
          return;
        }

        startTransition(() => {
          setAdminSession(EMPTY_ADMIN_SESSION);
        });
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [reloadToken]);

  if (isLoading || !settingsSnapshot) {
    return (
      <main className="status-shell">
        <section className="status-card">
          <p className="eyebrow">Supabase</p>
          <h1>{loadError ? 'Failed to load calculator settings' : 'Loading calculator settings'}</h1>
          <p>{loadError || 'Fetching the current calculator configuration from Supabase.'}</p>
          {loadError ? (
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setReloadToken((current) => current + 1);
              }}
            >
              Retry
            </button>
          ) : null}
        </section>
      </main>
    );
  }

  const parsedInputs = parseTripInputDraft(inputDraft, settingsSnapshot.tripDefaults);
  const sanitizedInputs = sanitizeTripInputs(parsedInputs, settingsSnapshot.maxPersonsInCar);
  const derived = calculateDerivedCosts(sanitizedInputs, settingsSnapshot.constants);
  const editorName = adminSession.adminUser?.displayName ?? adminSession.adminUser?.email ?? '';

  const openEditModal = () => {
    setDraftSettings(createSettingDrafts(settingsSnapshot.editableSettings));
    setSaveError('');
    setIsEditOpen(true);
  };

  const handleRequestEdit = () => {
    if (adminSession.adminUser) {
      openEditModal();
      return;
    }

    setSignInError(adminSession.authEmail ? 'This account is not registered as an admin.' : '');
    setSignInNotice('');
    setIsSignInOpen(true);
  };

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSigningIn(true);
    setSignInError('');
    setSignInNotice('');

    try {
      await signInAdmin(signInEmail, signInPassword);
      const nextAdminSession = await fetchAdminSession();
      setAdminSession(nextAdminSession);

      if (!nextAdminSession.adminUser) {
        setSignInError('This account is not registered as an admin.');
        return;
      }

      setIsSignInOpen(false);
      setSignInPassword('');
      openEditModal();
    } catch (error) {
      setSignInError(getErrorMessage(error));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleOpenRegister = () => {
    setRegisterError('');
    setIsSignInOpen(false);
    setIsRegisterOpen(true);
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsRegistering(true);
    setRegisterError('');

    try {
      await signUpAdmin({
        displayName: registerName.trim(),
        email: registerEmail.trim(),
        password: registerPassword,
        code: registrationCode.trim(),
      });

      setIsRegisterOpen(false);
      setIsSignInOpen(true);
      setSignInEmail(registerEmail.trim());
      setSignInNotice('Registration created. Confirm your email, then sign in as an admin.');
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegistrationCode('testcode');
    } catch (error) {
      setRegisterError(getErrorMessage(error));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutAdmin();
      setAdminSession(EMPTY_ADMIN_SESSION);
      setIsEditOpen(false);
    } catch (error) {
      setSignInError(getErrorMessage(error));
      setIsSignInOpen(true);
    }
  };

  const handleSaveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveError('');

    try {
      const updates = buildAppSettingUpdates(draftSettings, settingsSnapshot.settingsByKey);
      if (updates.length === 0) {
        setIsEditOpen(false);
        return;
      }

      const updatedSettings = await updateAppSettings(updates);
      const nextSnapshot = createSettingsSnapshot(updatedSettings);
      const nextInputs = sanitizeTripInputs(
        parseTripInputDraft(inputDraft, nextSnapshot.tripDefaults),
        nextSnapshot.maxPersonsInCar,
      );

      setSettingsSnapshot(nextSnapshot);
      setInputDraft(toTripInputDraft(nextInputs));
      setIsEditOpen(false);
    } catch (error) {
      setSaveError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <CalculatorPage
        constants={settingsSnapshot.constants}
        constantSettings={settingsSnapshot.publicConstantSettings}
        derived={derived}
        inputDraft={inputDraft}
        inputs={sanitizedInputs}
        maxPersonsInCar={settingsSnapshot.maxPersonsInCar}
        editorName={editorName}
        isAdmin={Boolean(adminSession.adminUser)}
        onInputChange={(field, value) => {
          setInputDraft((current) => ({
            ...current,
            [field]: value,
          }));
        }}
        onExplain={setExplainKey}
        onRequestEdit={handleRequestEdit}
        onSignOut={() => {
          void handleSignOut();
        }}
      />
      <InfoModal
        isOpen={explainKey !== null}
        explainKey={explainKey}
        settingsSnapshot={settingsSnapshot}
        derived={derived}
        onClose={() => setExplainKey(null)}
      />
      <AdminSignInModal
        isOpen={isSignInOpen}
        email={signInEmail}
        password={signInPassword}
        error={signInError}
        notice={signInNotice}
        signedInEmail={adminSession.authEmail && !adminSession.adminUser ? adminSession.authEmail : null}
        isSubmitting={isSigningIn}
        onEmailChange={setSignInEmail}
        onPasswordChange={setSignInPassword}
        onClose={() => {
          setIsSignInOpen(false);
          setSignInError('');
          setSignInNotice('');
          setSignInPassword('');
        }}
        onOpenRegister={handleOpenRegister}
        onSignOut={() => {
          void handleSignOut();
        }}
        onSubmit={handleSignIn}
      />
      <AdminRegisterModal
        isOpen={isRegisterOpen}
        displayName={registerName}
        email={registerEmail}
        password={registerPassword}
        registrationCode={registrationCode}
        error={registerError}
        isSubmitting={isRegistering}
        onDisplayNameChange={setRegisterName}
        onEmailChange={setRegisterEmail}
        onPasswordChange={setRegisterPassword}
        onRegistrationCodeChange={setRegistrationCode}
        onClose={() => {
          setIsRegisterOpen(false);
          setRegisterError('');
        }}
        onSubmit={handleRegister}
      />
      <EditSettingsModal
        isOpen={isEditOpen}
        draftSettings={draftSettings}
        settingsSnapshot={settingsSnapshot}
        tripInputs={sanitizedInputs}
        isSaving={isSaving}
        saveError={saveError}
        onRawValueChange={(key, value) => {
          setDraftSettings((current) =>
            current.map((draft) => (draft.key === key ? { ...draft, rawValue: value } : draft)),
          );
        }}
        onTextFieldChange={(key, field, value) => {
          setDraftSettings((current) =>
            current.map((draft) => (draft.key === key ? { ...draft, [field]: value } : draft)),
          );
        }}
        onClose={() => {
          setDraftSettings(createSettingDrafts(settingsSnapshot.editableSettings));
          setIsEditOpen(false);
          setSaveError('');
        }}
        onSubmit={handleSaveSettings}
      />
    </>
  );
}

export default App;
