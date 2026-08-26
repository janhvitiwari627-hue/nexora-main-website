import React, { useState } from 'react';
import { X, CheckCircle2, ArrowRight, Building2, ShoppingBag, Sparkles, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, Info } from 'lucide-react';
import { useSupabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: 'buyer' | 'supplier', isNewUser?: boolean) => void;
  initialMode?: 'login' | 'register';
  isFullPage?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  isFullPage = false
}) => {
  const {
    isConfigured,
    signInWithEmailPassword,
    signUpWithEmailPassword,
    signInWithOtp,
    verifyOtp,
    signInWithGoogle,
  } = useSupabase();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'buyer' | 'supplier'>('buyer');
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('otp');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [verified, setVerified] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!isOpen && !isFullPage) return null;

  const resetMessages = () => {
    setErrorMessage(null);
    setInfoMessage(null);
  };

  const handleOAuthGoogle = async () => {
    resetMessages();
    setIsGoogleLoading(true);

    if (isConfigured) {
      try {
        await signInWithGoogle();
        // PKCE detectSessionInUrl handles the redirect/callback.
      } catch (err: any) {
        setErrorMessage(err?.message || 'Google sign-in failed. Please try again.');
        setIsGoogleLoading(false);
      }
      return;
    }

    // Demo fallback (no remote Supabase project configured).
    setTimeout(() => {
      setIsGoogleLoading(false);
      const token = `nexora_oauth_token_${Date.now()}`;
      localStorage.setItem('nexora_user_session', JSON.stringify({
        token,
        email: 'priya.procurement@radiantbeauty.in',
        name: 'Priya Sharma',
        role,
        authenticatedAt: new Date().toISOString()
      }));
      localStorage.setItem('nexora_is_logged_in', 'true');
      localStorage.setItem('nexora_user_role', role);
      setVerified(true);
    }, 900);
  };

  const handleGuestContinue = () => {
    localStorage.setItem('nexora_is_logged_in', 'false');
    localStorage.setItem('nexora_user_role', 'buyer');
    localStorage.setItem('nexora_guest_mode', 'true');
    onSuccess('buyer', false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!phoneOrEmail.trim()) return;

    if (isConfigured) {
      if (authMethod === 'otp') {
        const { error } = await signInWithOtp(phoneOrEmail.trim());
        if (error) {
          setErrorMessage(error.message || 'Unable to send OTP. Please try again.');
          return;
        }
        setOtpMode(true);
        setInfoMessage(`A secure verification code was sent to ${phoneOrEmail.trim()}.`);
        return;
      }

      if (mode === 'register') {
        const { error, needsEmailConfirmation } = await signUpWithEmailPassword(
          phoneOrEmail.trim(),
          password,
          role,
        );
        if (error) {
          setErrorMessage(error.message || 'Registration failed. Please try again.');
          return;
        }
        if (needsEmailConfirmation) {
          setVerified(false);
          setInfoMessage('Registration received. Check your email to confirm your Nexora account, then sign in.');
          return;
        }
        setVerified(true);
        return;
      }

      const { error } = await signInWithEmailPassword(phoneOrEmail.trim(), password);
      if (error) {
        setErrorMessage(error.message || 'Sign in failed. Please verify your credentials.');
        return;
      }
      setVerified(true);
      return;
    }

    // Demo fallback (no remote Supabase project configured).
    if (authMethod === 'otp') {
      setOtpMode(true);
    } else {
      if (password.length >= 4) {
        const token = `nexora_jwt_${Date.now()}`;
        localStorage.setItem('nexora_user_session', JSON.stringify({
          token,
          email: phoneOrEmail,
          name: businessName || (role === 'buyer' ? 'Priya Sharma' : 'Aura Beauty Labs'),
          role,
          authenticatedAt: new Date().toISOString()
        }));
        localStorage.setItem('nexora_is_logged_in', 'true');
        localStorage.setItem('nexora_user_role', role);
        setVerified(true);
      } else {
        setErrorMessage('Please enter a password with at least 4 characters.');
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (isConfigured) {
      const { error } = await verifyOtp(phoneOrEmail.trim(), otp);
      if (error) {
        setErrorMessage(error.message || 'Invalid or expired verification code.');
        setOtp('');
        return;
      }
      setVerified(true);
      return;
    }

    // Demo fallback (no remote Supabase project configured).
    if (otp === '1234' || otp.length === 4) {
      const token = `nexora_jwt_${Date.now()}`;
      localStorage.setItem('nexora_user_session', JSON.stringify({
        token,
        email: phoneOrEmail,
        name: businessName || (role === 'buyer' ? 'Priya Sharma' : 'Aura Beauty Labs'),
        role,
        authenticatedAt: new Date().toISOString()
      }));
      localStorage.setItem('nexora_is_logged_in', 'true');
      localStorage.setItem('nexora_user_role', role);
      setVerified(true);
    } else {
      setErrorMessage('Invalid OTP. For Demo, please enter: 1234');
      setOtp('');
    }
  };

  const handleReset = () => {
    const isNew = mode === 'register';
    setOtpMode(false);
    setVerified(false);
    setOtp('');
    setPhoneOrEmail('');
    setPassword('');
    setBusinessName('');
    resetMessages();
    onSuccess(role, isNew);
    onClose();
  };

  const content = (
    <div className="bg-white rounded-3xl border border-[#e8e8e8] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

      {/* Modal Header */}
      <div className="p-5 border-b border-[#e8e8e8] flex items-center justify-between bg-[#fcf9f8]">
        <div>
          <h3 className="text-base font-black text-[#1c1b1b]">
            {verified ? 'Authentication Verified' : otpMode ? 'Verify Sourcing OTP' : mode === 'login' ? 'Sign In to Nexora Luxe' : 'Create Business Account'}
          </h3>
          <p className="text-[12px] text-[#594047] font-medium">
            {verified ? 'Session activated & security checks passed' : otpMode ? `OTP sent to ${phoneOrEmail}` : "Access India's premier B2B beauty sourcing network"}
          </p>
        </div>
        {!isFullPage && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-[#8c7077] hover:text-[#1c1b1b] hover:bg-[#f0edec] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Modal Body */}
      <div className="p-6">
        {errorMessage && (
          <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-[12px] font-semibold">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 flex items-start gap-2 bg-sky-50 border border-sky-200 text-sky-700 px-3 py-2.5 rounded-xl text-[12px] font-semibold">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {verified ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-black text-[#1c1b1b]">Verification Complete!</h4>
              <p className="text-[13px] text-[#594047] mt-1">
                You are securely logged in as a <strong>{role === 'buyer' ? 'Professional Buyer' : 'Verified Supplier'}</strong>.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="w-full bg-[#b90064] hover:bg-[#8e004b] text-white font-extrabold text-[13px] py-3 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Continue to {role === 'buyer' ? 'Buyer Dashboard' : 'Supplier Portal'}
            </button>
          </div>
        ) : otpMode ? (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="text-center space-y-6">
              <div>
                <p className="text-[13px] text-[#594047] mb-4">Please enter the 4-digit code sent to your device.</p>
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      value={otp[i] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*$/.test(val)) {
                          const newOtp = otp.split('');
                          newOtp[i] = val;
                          const combined = newOtp.join('');
                          setOtp(combined);

                          // Auto-focus next input
                          if (val && i < 3) {
                            const inputs = e.target.parentElement?.querySelectorAll('input');
                            if (inputs && inputs[i + 1]) inputs[i + 1].focus();
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[i] && i > 0) {
                          const inputs = (e.target as HTMLInputElement).parentElement?.querySelectorAll('input');
                          if (inputs && inputs[i - 1]) inputs[i - 1].focus();
                        }
                      }}
                      className="w-12 h-14 bg-[#f7f2f2] border-2 border-[#e8e8e8] focus:border-[#b90064] rounded-xl text-center text-xl font-bold text-[#1c1b1b] focus:outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* Demo Hint */}
              {!isConfigured && (
                <div className="inline-block bg-[#fde7f3] border border-[#b90064]/20 px-4 py-2 rounded-xl animate-pulse mx-auto">
                  <p className="text-[11px] font-black text-[#b90064] uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    For Demo, enter OTP: 1234
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={otp.length !== 4}
                className="w-full bg-[#b90064] hover:bg-[#8e004b] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-[13px] py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Verify &amp; Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setOtpMode(false)}
                className="w-full text-[12px] font-bold text-[#b90064] hover:underline cursor-pointer"
              >
                Change Contact Details
              </button>
            </div>

            <div className="text-center">
              <p className="text-[12px] text-[#8c7077]">
                Didn't receive code? {!isConfigured && <button type="button" onClick={() => setOtp('1234')} className="text-[#b90064] font-bold hover:underline cursor-pointer">Auto-fill 1234</button>}
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Role Toggle Selector (Buyer, Supplier) */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#f7f2f2] rounded-xl border border-[#e8e8e8]">
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`py-2 text-[12px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'buyer'
                    ? 'bg-white text-[#b90064] shadow-xs'
                    : 'text-[#594047] hover:text-[#1c1b1b]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Buyer Account</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('supplier')}
                className={`py-2 text-[12px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'supplier'
                    ? 'bg-white text-[#b90064] shadow-xs'
                    : 'text-[#594047] hover:text-[#1c1b1b]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Supplier Account</span>
              </button>
            </div>

            {/* Mode Toggle Tabs (Sign In vs Register) */}
            <div className="flex border-b border-[#e8e8e8] text-[13px] font-bold">
              <button
                type="button"
                onClick={() => { setMode('login'); resetMessages(); }}
                className={`flex-1 pb-2.5 border-b-2 transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'border-[#b90064] text-[#b90064]'
                    : 'border-transparent text-[#594047]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); resetMessages(); }}
                className={`flex-1 pb-2.5 border-b-2 transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'border-[#b90064] text-[#b90064]'
                    : 'border-transparent text-[#594047]'
                }`}
              >
                Register Business
              </button>
            </div>

            {/* Auth Method (OTP vs Password) */}
            <div className="flex items-center justify-end gap-3 text-[11px] font-bold text-[#594047]">
              <span>Sign in using:</span>
              <button
                type="button"
                onClick={() => { setAuthMethod('otp'); resetMessages(); }}
                className={`px-2 py-0.5 rounded cursor-pointer ${authMethod === 'otp' ? 'bg-[#fde7f3] text-[#b90064]' : 'hover:text-[#1c1b1b]'}`}
              >
                Mobile OTP
              </button>
              <span className="text-stone-300">|</span>
              <button
                type="button"
                onClick={() => { setAuthMethod('password'); resetMessages(); }}
                className={`px-2 py-0.5 rounded cursor-pointer ${authMethod === 'password' ? 'bg-[#fde7f3] text-[#b90064]' : 'hover:text-[#1c1b1b]'}`}
              >
                Password
              </button>
            </div>

            {/* Google OAuth Trigger */}
            <button
              type="button"
              onClick={handleOAuthGoogle}
              disabled={isGoogleLoading}
              className="w-full bg-white hover:bg-stone-50 border border-[#e8e8e8] hover:border-stone-300 text-[#1c1b1b] font-bold text-[13px] py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isGoogleLoading ? 'Connecting to Google...' : `Continue with Google (${role === 'buyer' ? 'Buyer' : 'Supplier'})`}</span>
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="h-px bg-[#e8e8e8] flex-1" />
              <span className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider">or</span>
              <div className="h-px bg-[#e8e8e8] flex-1" />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-[12px] font-bold text-[#1c1b1b] mb-1">
                  Business / Company Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Luxe Skin Clinic / Aura Cosmetics"
                  className="w-full bg-[#f7f2f2] border border-[#e8e8e8] focus:border-[#b90064] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1c1b1b] focus:outline-none"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-[12px] font-bold text-[#1c1b1b] mb-1">
                {authMethod === 'otp' ? 'Mobile Number / Business Email' : 'Business Email Address'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  placeholder={authMethod === 'otp' ? '+91 98201 54321 or name@business.com' : 'procurement@company.com'}
                  className="w-full bg-[#f7f2f2] border border-[#e8e8e8] focus:border-[#b90064] rounded-xl pl-9 pr-3.5 py-2.5 text-[13px] text-[#1c1b1b] focus:outline-none"
                  required
                />
                {authMethod === 'otp' ? (
                  <Phone className="w-4 h-4 text-[#8c7077] absolute left-3 top-1/2 -translate-y-1/2" />
                ) : (
                  <Mail className="w-4 h-4 text-[#8c7077] absolute left-3 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>

            {authMethod === 'password' && (
              <div>
                <label className="block text-[12px] font-bold text-[#1c1b1b] mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full bg-[#f7f2f2] border border-[#e8e8e8] focus:border-[#b90064] rounded-xl pl-9 pr-10 py-2.5 text-[13px] text-[#1c1b1b] focus:outline-none"
                    required
                  />
                  <Lock className="w-4 h-4 text-[#8c7077] absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#b90064] hover:bg-[#8e004b] text-white font-extrabold text-[13px] py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>
                {authMethod === 'otp'
                  ? mode === 'login' ? 'Get Login OTP' : 'Send Registration OTP'
                  : mode === 'login' ? 'Sign In Securely' : 'Complete Registration'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Continue as Guest option */}
            <div className="pt-2 text-center border-t border-[#f0edec]">
              <button
                type="button"
                onClick={handleGuestContinue}
                className="text-[12px] font-bold text-[#594047] hover:text-[#b90064] hover:underline cursor-pointer"
              >
                Continue Browsing as Guest
              </button>
            </div>

            <p className="text-[11px] text-[#8c7077] text-center">
              By continuing, you agree to Nexora Luxe's B2B Terms of Sourcing &amp; Verified Supplier Privacy Code.
            </p>

          </form>
        )}
      </div>

    </div>
  );

  if (isFullPage) {
    return (
      <div className="min-h-screen bg-[#fdf8f8] flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {content}
    </div>
  );
};
