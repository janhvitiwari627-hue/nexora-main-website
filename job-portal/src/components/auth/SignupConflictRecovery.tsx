/**
 * Recovery actions for a duplicate-email sign-up.
 *
 * WHY THIS EXISTS: the portal used to answer an already-registered email with
 * "This email is already registered as a Job Seeker. Please sign in through the
 * Job Seeker portal." — a dead end, because that is the screen the user is
 * already on. Worse, an account whose verification email was never opened can
 * neither sign up (duplicate) nor sign in ("Email not confirmed"), which locked
 * the user out permanently.
 *
 * The message (built in utils/errors.ts) is the explanation; this component is
 * the way out — one tap to the sign-in screen with the email prefilled, or a
 * fresh verification link for the unverified case.
 *
 * Presentational only: it receives the typed conflict plus callbacks, and never
 * imports the Supabase client or the auth context.
 */

import React, { useState } from 'react';
import { getErrorMessage, type PortalEmailConflictError } from '../../utils/errors';
import { LogIn, Send } from 'lucide-react';

interface SignupConflictRecoveryProps {
  conflict: PortalEmailConflictError;
  /** Jump to the sign-in screen with the conflicting email prefilled. */
  onSignInInstead?: (email: string) => void;
  /** Resend the sign-up verification email (unverified accounts only). */
  onResendVerification?: (email: string) => Promise<void> | void;
  /** Surface a failure of the recovery action in the screen's error area. */
  onError?: (message: string) => void;
}

export const SignupConflictRecovery: React.FC<SignupConflictRecoveryProps> = ({
  conflict,
  onSignInInstead,
  onResendVerification,
  onError,
}) => {
  const [isResending, setIsResending] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const email = conflict.email;
  const canResendVerification = conflict.emailConfirmed === false && Boolean(onResendVerification);

  const handleResendVerification = async () => {
    if (!onResendVerification || !email) return;
    setIsResending(true);
    try {
      await onResendVerification(email);
      setVerificationSent(true);
    } catch (resendError) {
      console.error('[Nexora Jobs] resend verification failed:', resendError);
      onError?.(getErrorMessage(resendError, 'Unable to resend the verification email.'));
    } finally {
      setIsResending(false);
    }
  };

  if (!email || (!onSignInInstead && !canResendVerification)) return null;

  return (
    <div className="flex flex-col gap-2">
      {verificationSent && (
        <p role="status" className="text-[11px] font-semibold leading-relaxed text-emerald-700">
          Verification email sent to <strong>{email}</strong> — open the link inside it, then sign in here.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {canResendVerification && (
          <button
            type="button"
            disabled={isResending || verificationSent}
            onClick={() => void handleResendVerification()}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#e2007c] px-3.5 py-2 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-[#b90064] active:scale-95 disabled:cursor-wait disabled:opacity-60 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isResending ? 'Sending…' : verificationSent ? 'Verification link sent' : 'Send verification email'}</span>
          </button>
        )}
        {onSignInInstead && (
          <button
            type="button"
            onClick={() => onSignInInstead(email)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e0bec6] bg-white px-3.5 py-2 text-[11px] font-bold text-[#8e004b] transition-colors hover:bg-[#f7f2f2] active:scale-95 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign in instead</span>
          </button>
        )}
      </div>
    </div>
  );
};
