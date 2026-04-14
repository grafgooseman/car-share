import { startTransition, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AdminRegisterPage } from './components/AdminRegisterPage';
import { AdminSignInModal } from './components/AdminSignInModal';
import { CalculatorPage } from './components/CalculatorPage';
import { EditSettingsModal } from './components/EditSettingsModal';
import { InfoModal } from './components/InfoModal';
import { calculateDerivedCosts, sanitizeTripInputs } from './lib/calculations';
import {
  clearLocalAdminSession,
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
import type {
  AdminSession,
  AppSettingDraft,
  ExplainKey,
  LoadStatus,
  SettingsSnapshot,
  TripInputDraft,
} from './types';

const EMPTY_TRIP_DRAFT: TripInputDraft = {
  kilometers: '',
  days: '',
  personsInCar: '',
};

const EMPTY_ADMIN_SESSION: AdminSession = {
  authEmail: null,
  adminUser: null,
};

const ADMIN_SIGN_UP_HASH = '#admin-sign-up';
const SETTINGS_LOAD_TIMEOUT_MS = 12000;
const ADMIN_SESSION_TIMEOUT_MS = 4000;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong.';

const getCurrentHash = () => (typeof window === 'undefined' ? '' : window.location.hash);

const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, message: string) =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });

function App() {
  const [settingsSnapshot, setSettingsSnapshot] = useState<SettingsSnapshot | null>(null);
  const [inputDraft, setInputDraft] = useState<TripInputDraft>(EMPTY_TRIP_DRAFT);
  const [adminSession, setAdminSession] = useState<AdminSession>(EMPTY_ADMIN_SESSION);
  const [settingsStatus, setSettingsStatus] = useState<LoadStatus>('loading');
  const [adminSessionStatus, setAdminSessionStatus] = useState<LoadStatus>('ready');
  const [explainKey, setExplainKey] = useState<ExplainKey | null>(null);
  const [draftSettings, setDraftSettings] = useState<AppSettingDraft[]>([]);
  const [loadError, setLoadError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [currentHash, setCurrentHash] = useState(getCurrentHash);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState('');
  const [signInNotice, setSignInNotice] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputDraftRef = useRef<TripInputDraft>(EMPTY_TRIP_DRAFT);

  useEffect(() => {
    inputDraftRef.current = inputDraft;
  }, [inputDraft]);

  useEffect(() => {
    if (settingsStatus === 'ready') {
      return;
    }

    setExplainKey(null);
    setIsEditOpen(false);
  }, [settingsStatus]);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(getCurrentHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadAdminSessionState = async (recoverLocalSession: boolean) => {
      if (!recoverLocalSession) {
        setAdminSessionStatus('loading');
      }

      try {
        const nextAdminSession = await withTimeout(
          fetchAdminSession(),
          ADMIN_SESSION_TIMEOUT_MS,
          'Loading your admin session timed out.',
        );
        if (!isActive) {
          return;
        }

        startTransition(() => {
          setAdminSession(nextAdminSession);
          setAdminSessionStatus('ready');
        });
      } catch {
        if (recoverLocalSession) {
          try {
            await clearLocalAdminSession();
          } catch {
            // Fall back to a signed-out UI even if local cleanup fails.
          }
        }

        if (!isActive) {
          return;
        }

        startTransition(() => {
          setAdminSession(EMPTY_ADMIN_SESSION);
          setAdminSessionStatus('error');
        });
      }
    };

    const loadApp = async () => {
      setSettingsStatus('loading');
      setLoadError('');

      try {
        const settings = await withTimeout(
          fetchPublicSettings(),
          SETTINGS_LOAD_TIMEOUT_MS,
          'Loading calculator settings timed out.',
        );
        if (!isActive) {
          return;
        }

        const nextSnapshot = createSettingsSnapshot(settings);
        const nextInputs = sanitizeTripInputs(
          parseTripInputDraft(inputDraftRef.current, nextSnapshot.tripDefaults),
          nextSnapshot.maxPersonsInCar,
        );

        startTransition(() => {
          setSettingsSnapshot(nextSnapshot);
          setInputDraft(toTripInputDraft(nextInputs));
          setSettingsStatus('ready');
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setLoadError(getErrorMessage(error));
        setSettingsSnapshot(null);
        setSettingsStatus('error');
      }
    };

    void loadApp();
    void loadAdminSessionState(true);

    const unsubscribe = subscribeToAuthChanges(async () => {
      await loadAdminSessionState(false);
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [reloadToken]);

  const isRegisterPage = currentHash === ADMIN_SIGN_UP_HASH;
  const isSettingsReady = settingsStatus === 'ready' && settingsSnapshot !== null;
  const parsedInputs = isSettingsReady ? parseTripInputDraft(inputDraft, settingsSnapshot.tripDefaults) : null;
  const sanitizedInputs =
    isSettingsReady && parsedInputs ? sanitizeTripInputs(parsedInputs, settingsSnapshot.maxPersonsInCar) : undefined;
  const derived =
    isSettingsReady && sanitizedInputs ? calculateDerivedCosts(sanitizedInputs, settingsSnapshot.constants) : undefined;
  const editorName = adminSession.adminUser?.displayName ?? adminSession.adminUser?.email ?? '';

  const navigateToRegisterPage = () => {
    window.location.hash = ADMIN_SIGN_UP_HASH;
  };

  const navigateToCalculatorPage = () => {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    setCurrentHash('');
  };

  const openEditModal = () => {
    if (!settingsSnapshot) {
      return;
    }

    setDraftSettings(createSettingDrafts(settingsSnapshot.editableSettings));
    setSaveError('');
    setIsEditOpen(true);
  };

  const handleRequestEdit = () => {
    if (!isSettingsReady) {
      return;
    }

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
    setAdminSessionStatus('loading');
    setSignInError('');
    setSignInNotice('');

    try {
      await signInAdmin(signInEmail, signInPassword);
      const nextAdminSession = await fetchAdminSession();
      setAdminSession(nextAdminSession);
      setAdminSessionStatus('ready');

      if (!nextAdminSession.adminUser) {
        setSignInError('This account is not registered as an admin.');
        return;
      }

      setIsSignInOpen(false);
      setSignInPassword('');
      openEditModal();
    } catch (error) {
      setAdminSessionStatus('error');
      setSignInError(getErrorMessage(error));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleOpenRegister = () => {
    setRegisterError('');
    setSignInError('');
    setSignInNotice('');
    setIsSignInOpen(false);
    navigateToRegisterPage();
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

      setRegisterError('');
      navigateToCalculatorPage();
      setIsSignInOpen(true);
      setSignInEmail(registerEmail.trim());
      setSignInPassword('');
      setSignInNotice('Registration created. Confirm your email, then sign in as an admin.');
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegistrationCode('');
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
      setAdminSessionStatus('ready');
      setIsEditOpen(false);
    } catch (error) {
      setSignInError(getErrorMessage(error));
      setIsSignInOpen(true);
    }
  };

  const handleRetrySettingsLoad = () => {
    setReloadToken((current) => current + 1);
  };

  const handleSaveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settingsSnapshot) {
      return;
    }

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

  if (isRegisterPage) {
    return (
      <AdminRegisterPage
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
        onBack={() => {
          setRegisterError('');
          navigateToCalculatorPage();
          setIsSignInOpen(true);
        }}
        onSubmit={handleRegister}
      />
    );
  }

  return (
    <>
      <CalculatorPage
        settingsStatus={settingsStatus}
        settingsError={loadError || null}
        onRetrySettingsLoad={handleRetrySettingsLoad}
        constants={settingsSnapshot?.constants}
        constantSettings={settingsSnapshot?.publicConstantSettings}
        derived={derived}
        heroContent={settingsSnapshot?.heroContent}
        inputDraft={inputDraft}
        inputs={sanitizedInputs}
        maxPersonsInCar={settingsSnapshot?.maxPersonsInCar}
        editorName={editorName}
        isAdmin={Boolean(adminSession.adminUser)}
        isAdminSessionLoading={adminSessionStatus === 'loading'}
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
      {isSettingsReady && derived ? (
        <InfoModal
          isOpen={explainKey !== null}
          explainKey={explainKey}
          settingsSnapshot={settingsSnapshot}
          derived={derived}
          onClose={() => setExplainKey(null)}
        />
      ) : null}
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
      {isSettingsReady && sanitizedInputs ? (
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
      ) : null}
    </>
  );
}

export default App;
