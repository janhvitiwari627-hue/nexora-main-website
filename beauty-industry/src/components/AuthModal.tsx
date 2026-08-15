import React, { useState } from 'react';
import { X, Lock, Mail, Building2, Store, ArrowRight } from 'lucide-react';
import { redirectToNexoraLogin, redirectToNexoraSignup } from '../auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose
}) => {
  const [email, setEmail] = useState('salon.buyer@luxe-paris.com');
  const [password, setPassword] = useState('••••••••••••');

  if (!isOpen) return null;

  // No local/mock sign-in is performed here: every login path hands off to the
  // canonical Nexora Login route, which uses the shared Supabase project and
  // preserves the single session / auth.users.id.
  const handleQuickLogin = (_role: 'buyer' | 'supplier') => {
    onClose();
    redirectToNexoraLogin();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
    redirectToNexoraLogin();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-[#EDEDED] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white hover:bg-[#FFF0F5] text-[#555] hover:text-[#B8005A] border border-[#E5E5E5] flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#FFF5F8] to-white border-b border-[#F0E6EC]">
          <span className="text-xs font-bold text-[#B8005A] uppercase tracking-wider bg-[#FFF0F5] border border-[#FFD1E3] px-2.5 py-0.5 rounded-full">
            B2B Partner Portal
          </span>
          <h2 className="text-2xl font-bold text-[#1E1E1E] mt-2">Sign In to Nexora Luxe</h2>
          <p className="text-xs text-[#737373] mt-1">Access verified wholesale pricing & direct supplier messaging</p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Quick Demo Accounts */}
          <div>
            <span className="text-[11px] font-bold text-[#8E8E93] uppercase block mb-2">
              Instant Demo Sign-in
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('buyer')}
                className="p-3 rounded-xl border border-[#E5E5E5] hover:border-[#B8005A] hover:bg-[#FFF0F5] text-left transition-all group cursor-pointer"
              >
                <Store className="w-4 h-4 text-[#B8005A] mb-1" />
                <div className="text-xs font-bold text-[#1E1E1E] group-hover:text-[#B8005A]">Salon Buyer</div>
                <div className="text-[10px] text-[#737373]">Spa Place Vendôme</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('supplier')}
                className="p-3 rounded-xl border border-[#E5E5E5] hover:border-[#B8005A] hover:bg-[#FFF0F5] text-left transition-all group cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-[#B8005A] mb-1" />
                <div className="text-xs font-bold text-[#1E1E1E] group-hover:text-[#B8005A]">Wholesaler</div>
                <div className="text-[10px] text-[#737373]">Luxe Elite Dist.</div>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#EDEDED]" />
            <span className="flex-shrink mx-3 text-[11px] text-[#8E8E93] uppercase font-bold">Or Email</span>
            <div className="flex-grow border-t border-[#EDEDED]" />
          </div>

          {/* Standard Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-[#525252] uppercase block mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#B8005A]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#525252] uppercase block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#B8005A]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#B8005A] hover:bg-[#A0004E] text-white py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-[#737373]">
            New supplier or salon?{' '}
            <button
              onClick={() => {
                onClose();
                redirectToNexoraSignup();
              }}
              className="text-[#B8005A] font-bold hover:underline cursor-pointer"
            >
              List your business free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
