"use client";

import { useEffect, useState } from "react";

/**
 * Nexora SalonoS splash screen — pure presentation.
 *
 * Renders the animated brand splash. It has no routing or auth logic of its
 * own: the parent overlay (<SplashOverlay>) decides when to fade it out; the
 * Main Website Dashboard renders underneath the whole time. When
 * `showFallback` is true the loading dots are replaced by a manual
 * "Continue" button so the user is never trapped on the splash.
 */
export function SplashScreen({
  showFallback = false,
  onContinue,
}: {
  showFallback?: boolean;
  onContinue?: () => void;
}) {
  const [entered, setEntered] = useState(false);

  // Entrance reveal.
  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className="w-full min-h-[100dvh] flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#fcf9f8] via-[#f9f0f2] to-[#fcf9f8]">
      {/* Decorative background glows */}
      <div
        aria-hidden
        className="absolute w-[500px] h-[500px] rounded-full bg-[#fde7f3] blur-[80px] opacity-60 z-0"
      />
      <div
        aria-hidden
        className="absolute w-[300px] h-[300px] rounded-full bg-[#b90064]/10 blur-[60px] opacity-40 top-1/4 right-1/4 z-0"
      />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-5">
        <div className="bg-white/30 backdrop-blur-md rounded-[2rem] p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.03)] border border-white/50 flex flex-col items-center w-full transition-all duration-300">
          {/* Logo */}
          <div
            className="w-[190px] aspect-square mb-8 transition-all duration-[600ms] ease-out"
            style={{ opacity: entered ? 1 : 0, transform: entered ? "scale(1)" : "scale(0.94)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- remote brand asset from the locked visual identity set; next/image is deliberately not used in this repo. */}
            <img
              alt="Nexora SalonoS"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMp2YUtoao1inoRUbyQMo-sftVQYAn9f_cBlHhkZXv8mTTYvmftFclnIXjOQXxDZFlZ4qvKID8cIQU4RBFs-xeuK6LjL2zTuLVkY_jfmsD7RijrYlIlGCNteHknHtMm_KstbzNH2Vfv0KD1LRT_8puEQt75m2z0PW6t051bpj6Yd8eVBLVIa7OTFLznLcejgKJewicKr15GrmERbgyey1k9X3pRX6DBh3Texy1OePHeobiatnEuXxxY7A1UjVDh1qGURE"
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>

          {/* Typography */}
          <div className="text-center flex flex-col items-center">
            <h1
              className="text-[#1c1b1b] text-[34px] tracking-tight mb-2 font-semibold transition-all duration-700 ease-out"
              style={{ opacity: entered ? 1 : 0, transform: entered ? "translateY(0)" : "translateY(8px)" }}
            >
              NEXORA SALONOS
            </h1>
            <p
              className="text-[#5a3f47] text-[13px] tracking-wider uppercase mb-10 transition-all duration-700 ease-out"
              style={{ opacity: entered ? 1 : 0, transform: entered ? "translateY(0)" : "translateY(4px)" }}
            >
              Your Salon. Your Brand. Your Success.
            </p>
          </div>

          {/* Loading indicator / fallback action */}
          {!showFallback ? (
            <div
              role="status"
              aria-label="Loading Nexora..."
              className="flex gap-2 items-center justify-center h-6"
            >
              <div
                className="w-2 h-2 rounded-full bg-[#b90064] shadow-[0_0_8px_rgba(185,0,100,0.5)] animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-2 h-2 rounded-full bg-[#b90064] shadow-[0_0_8px_rgba(185,0,100,0.5)] animate-bounce"
                style={{ animationDelay: "200ms" }}
              />
              <div
                className="w-2 h-2 rounded-full bg-[#b90064] shadow-[0_0_8px_rgba(185,0,100,0.5)] animate-bounce"
                style={{ animationDelay: "400ms" }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center mt-6 transition-opacity duration-500">
              <p className="text-sm text-[#594047] mb-4">Taking longer than expected?</p>
              <button
                onClick={onContinue}
                className="px-8 py-3 bg-[#8e004b] text-white rounded-full text-[12px] font-semibold tracking-[0.05em] uppercase hover:shadow-[0_0_15px_rgba(230,0,126,0.3)] transition-all active:scale-95"
              >
                Continue Manually
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
