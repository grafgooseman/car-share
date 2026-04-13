import type { FormEvent } from 'react';

type AdminRegisterPageProps = {
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
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function AdminRegisterPage({
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
  onBack,
  onSubmit,
}: AdminRegisterPageProps) {
  return (
    <main className="auth-page-shell">
      <section className="modal-shell auth-page-card" aria-labelledby="admin-sign-up-title">
        <div className="modal-head">
          <div>
            <p className="eyebrow">Admin Access</p>
            <h1 id="admin-sign-up-title">Admin sign up</h1>
          </div>
        </div>
        <div className="modal-body">
          <form id="admin-register-page-form" className="stack-form" onSubmit={onSubmit}>
            <p className="modal-note">
              Create an admin account. This page requires the special password before signup is
              accepted, and email confirmation must be completed before sign in.
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
              <span>Special password</span>
              <input
                aria-label="Special password"
                type="password"
                autoComplete="off"
                value={registrationCode}
                onChange={(event) => onRegistrationCodeChange(event.target.value)}
                placeholder="Enter special password"
              />
            </label>
            {error ? <p className="error-text">{error}</p> : null}
          </form>
        </div>
        <div className="modal-footer">
          <button type="button" className="secondary-button" onClick={onBack}>
            Back to sign in
          </button>
          <button
            type="submit"
            form="admin-register-page-form"
            className="primary-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Create admin account'}
          </button>
        </div>
      </section>
    </main>
  );
}
