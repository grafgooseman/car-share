import type { FormEvent } from 'react';
import { Modal } from './Modal';

type AdminRegisterModalProps = {
  isOpen: boolean;
  displayName: string;
  email: string;
  password: string;
  registrationCode: string;
  error: string;
  isSubmitting: boolean;
  onDisplayNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRegistrationCodeChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function AdminRegisterModal({
  isOpen,
  displayName,
  email,
  password,
  registrationCode,
  error,
  isSubmitting,
  onDisplayNameChange,
  onEmailChange,
  onPasswordChange,
  onRegistrationCodeChange,
  onClose,
  onSubmit,
}: AdminRegisterModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register as admin"
      footer={
        <>
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="admin-register-form"
            className="primary-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Create admin account'}
          </button>
        </>
      }
    >
      <form id="admin-register-form" className="stack-form" onSubmit={onSubmit}>
        <p className="modal-note">
          Create an email/password admin account. The special code is required, and email confirmation
          must be completed before sign in.
        </p>
        <label className="field">
          <span>Name</span>
          <input
            aria-label="Admin display name"
            value={displayName}
            onChange={(event) => onDisplayNameChange(event.target.value)}
            placeholder="Stepan"
          />
        </label>
        <label className="field">
          <span>Email</span>
          <input
            aria-label="Registration email"
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
            aria-label="Registration password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="Create password"
          />
        </label>
        <label className="field">
          <span>Special code</span>
          <input
            aria-label="Special code"
            value={registrationCode}
            onChange={(event) => onRegistrationCodeChange(event.target.value)}
            placeholder="stepanjew"
          />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
      </form>
    </Modal>
  );
}
