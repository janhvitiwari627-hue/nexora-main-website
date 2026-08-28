/**
 * Screen shown after a sign-up when the account is created but its email is
 * not yet confirmed. Supabase returns `user` without a `session` in that case.
 *
 * WHY THIS EXISTS: the old handler turned this success into a red error
 * ("Your account was created, but a verification email must be confirmed
 * first…"), which looks like a failure and gave the user no control. This
 * screen states what happened, lets the user resend the link (provider-owned
 * `resendVerification`), and offers the way back to sign-in.
 *
 * Presentational only: callbacks come from the shell; no Supabase import.
 */

import React, { useEffect, useState } from 'react';
import { MailCheck, Send, LogIn, ArrowLeft } from 'lucide-react';
import { getErrorMessage } from '../../utils/errors';

interface VerifyEmailScreenProps {
  /** The email the verification link was just sent to. */
  email: string;
  /** Portal the user registered for, for the copy. */
  role: 'seeker' | 'employer';
  /** Resend the sign-up verification email (AuthProvider-owned). */
  onResendVerification: (email: string) => Promise<void> | void;
  /** Return to the sign-in screen (optionally prefilled with this email). */
  onBackToLogin: () => void;
  /** Return to the start of sign-up. */
  onBackToSignup?: () => void;
}

export const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({
  email,
  role,
  onResendVerification,
  onBackToLogin,
  onBackToSignup,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) return;
    setIsSending(true);
    setError(null);
    try {
      await onResendVerification(email);
      setSent(true);
      setCooldown(60);
    } catch (resendError) {
      console.error('[Nexora Jobs] resend verification failed:', resendError);
      setError(getErrorMessage(resendError, 'Unable to resend the verification email.'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-[#fdf8f8] text-[#1c1b1b] min-h-screen flex flex-col font-sans antialiased">
      <header className="sticky top-0 bg-white shadow-[0_4px_12px_rgba(90,63,71,0.05)] flex justify-between items-center px-5 h-16 w-full z-50 border-b border-[#e6e1e1]">
        <button
          type="button"
          onClick={onBackToSignup ?? onBackToLogin}
          aria-label="Go back"
          className="text-[#8e004b] hover:bg-[#e6e1e1] transition-colors p-2 rounded-full flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-xl text-[#8e004b] tracking-tight">Nexora Jobs</h1>
        <div className="w-10" />
      </header>

      <main className="flex-grow flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-md bg-white border border-[#e0bec6] rounded-2xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(90,63,71,0.08)] text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#ffd9e2] text-[#8e004b] flex items-center justify-center mb-4 shadow-sm">
            <MailCheck className="w-9 h-9 text-[#e2007c]" />
          </div>

          <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-wider mb-2">
            One last step
          </span>
          <h2 className="text-2xl font-extrabold text-[#1c1b1b] mb-2">Verify your email</h2>
          <p className="text-sm text-[#594047] leading-relaxed">
            Your {role === 'employer' ? 'Employer' : 'Job Seeker'} account was created for{' '}
            <strong className="text-[#8e004b] break-all">{email}</strong>. We sent a verification
            link to that address — open it to activate your account, then sign in.
          </p>
          <p className="mt-2 text-[11px] font-semibold text-[#8c7077]">
            The link opens this portal automatically. Check spam too, and use only the newest email.
          </p>

          {sent && (
            <p role="status" className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-[11px] font-semibold text-emerald-800">
              A fresh verification link was sent to <strong className="break-all">{email}</strong>.
            </p>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-[11px] font-medium text-rose-700">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={isSending || cooldown > 0}
              className="w-full h-12 bg-[#e2007c] hover:bg-[#8e004b] disabled:opacity-60 disabled:cursor-wait text-white rounded-full text-sm font-extrabold tracking-wide transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSending
                  ? 'Sending…'
                  : sent
                    ? cooldown > 0
                      ? `Resend available in ${cooldown}s`
                      : 'Resend verification email'
                    : 'Resend verification email'}
              </span>
            </button>
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full h-12 bg-[#f1edec] hover:bg-[#ffd9e2] text-[#8e004b] rounded-full text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>I've verified — go to Login</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
