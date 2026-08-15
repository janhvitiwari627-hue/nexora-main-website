import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface ListBusinessBannerProps {
  onStartRegistration: () => void;
}

export const ListBusinessBanner: React.FC<ListBusinessBannerProps> = ({
  onStartRegistration
}) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFF7FA] via-[#FFF0F5] to-[#FFE6F0] border border-[#FFD6E5] p-8 sm:p-12 md:p-14 shadow-xs">
        {/* Subtle background glow effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFB8D6]/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left Text & Steps */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#FFD1E3] text-[#B8005A] text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Supplier & Wholesaler Network
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1E1E1E] tracking-tight">
              List Your Beauty Business — Free
            </h2>

            <p className="mt-3 text-sm sm:text-base text-[#525252] leading-relaxed">
              Join the exclusive network of premium beauty suppliers. Get discovered by salons, spas, and retailers globally.
            </p>

            {/* 3 Step Sequence */}
            <div className="mt-8 flex flex-wrap items-center gap-6 sm:gap-8">
              {/* Step 1 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-[#B8005A] text-[#B8005A] font-bold text-xs flex items-center justify-center shadow-xs">
                  1
                </div>
                <div className="text-xs sm:text-sm font-semibold text-[#1E1E1E]">
                  Create Account
                </div>
              </div>

              {/* Connector line on desktop */}
              <div className="hidden sm:block w-6 h-px bg-[#FFD1E3]" />

              {/* Step 2 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-[#B8005A] text-[#B8005A] font-bold text-xs flex items-center justify-center shadow-xs">
                  2
                </div>
                <div className="text-xs sm:text-sm font-semibold text-[#1E1E1E]">
                  Add Business
                </div>
              </div>

              {/* Connector line on desktop */}
              <div className="hidden sm:block w-6 h-px bg-[#FFD1E3]" />

              {/* Step 3 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-[#B8005A] text-[#B8005A] font-bold text-xs flex items-center justify-center shadow-xs">
                  3
                </div>
                <div className="text-xs sm:text-sm font-semibold text-[#1E1E1E]">
                  Add Products
                </div>
              </div>
            </div>
          </div>

          {/* Right CTA Button */}
          <div className="shrink-0">
            <button
              onClick={onStartRegistration}
              className="w-full sm:w-auto bg-white hover:bg-[#B8005A] text-[#1E1E1E] hover:text-white font-bold text-sm sm:text-base px-8 py-4 rounded-2xl border border-[#EDEDED] hover:border-[#B8005A] shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Start Registration</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
