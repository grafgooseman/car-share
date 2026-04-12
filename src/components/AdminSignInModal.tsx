import type { FormEvent } from 'react';
import { Modal } from './Modal';

type AdminSignInModalProps = {
  isOpen: boolean;
  email: string;
  password: string;
  error: string;
  notice: string;
  signedInEmail: string | null;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onClose: () => void;
  onOpenRegister: () => void;
  onSignOut: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function AdminSignInModal({
  isOpen,
  email,
  password,
  error,
  notice,
  signedInEmail,
  isSubmitting,
  onEmailChange,
  onPasswordChange,
  onClose,
  onOpenRegister,
  onSignOut,
  onSubmit,
}: AdminSignInModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Admin sign in"
      footer={
        <>
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          {signedInEmail ? (
            <button type="button" className="secondary-button" onClick={onSignOut}>
              Sign out
            </button>
          ) : (
            <button type="button" className="secondary-button" onClick={onOpenRegister}>
              Register as admin
            </button>
          )}
          <button type="submit" form="admin-sign-in-form" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </>
      }
    >
      <form id="admin-sign-in-form" className="stack-form" onSubmit={onSubmit}>
        <p className="modal-note">
          Sign in with an admin account to edit the calculator settings stored in Supabase.
        </p>
        {signedInEmail ? (
          <p className="modal-note">Signed in as {signedInEmail}, but this account is not an active app admin.</p>
        ) : null}
        <label className="field">
          <span>Email</span>
          <input
            aria-label="Admin email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="admin@example.com"
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            aria-label="Admin password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="Enter password"
          />
        </label>
        {notice ? <p className="success-text">{notice}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </form>
    </Modal>
  );
}
