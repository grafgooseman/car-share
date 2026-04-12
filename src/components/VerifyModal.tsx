import type { FormEvent } from 'react';
import { Modal } from './Modal';

type VerifyModalProps = {
  isOpen: boolean;
  authName: string;
  authPassword: string;
  authError: string;
  onNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function VerifyModal({
  isOpen,
  authName,
  authPassword,
  authError,
  onNameChange,
  onPasswordChange,
  onClose,
  onSubmit,
}: VerifyModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Please verify yourself"
      footer={
        <>
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="verify-form" className="primary-button">
            Verify
          </button>
        </>
      }
    >
      <form id="verify-form" className="stack-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Who are you</span>
          <input
            aria-label="Who are you"
            value={authName}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Your name"
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            aria-label="Password"
            type="password"
            value={authPassword}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="Enter password"
          />
        </label>
        {authError ? <p className="error-text">{authError}</p> : null}
      </form>
    </Modal>
  );
}
