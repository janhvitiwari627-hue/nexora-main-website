'use client';

import AnimatedSection from './AnimatedSection';
import { Store, ArrowRight, Sparkles, Check, Globe } from 'lucide-react';

/*
 * NOTE: the href below is the real Owner PWA deployment, as referenced by
 * the repo's own PHASE21 verification report
 * (NEXORA_OWNER_PWA_ORIGIN=https://shop-onwer-pink-nexora-aap.vercel.app).
 * The banner is a solid pink gradient on purpose — it reads identically on
 * the light and dark themes.
 */

const benefits = [
  'Free custom domain',
  'Online booking system',
  'Payment gateway integrated',
  'SEO optimized',
  'Mobile responsive',
  '5-min setup',
];

export default function FreeWebsiteCTA() {
  return (
    <section className="py-16 md:py-20 relative" aria-label="Free salon website offer">
      <div className="container-nexora">
        <AnimatedSection>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-nexora-pink via-nexora-pink-vibrant to-rose-600 p-8 md:p-14 shadow-2xl">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl" aria-hidden="true" />

            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              {/* Left: Copy */}
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs font-bold mb-4">
                  <Sparkles className="w-3 h-3" />
                  FREE FOREVER
                </span>

                <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white font-playfair leading-tight">
                  Apne Salon Ki Website<br />
                  <span className="text-white/90">Free Mein Banaiye</span>
                </h2>

                <p className="text-white/90 mb-6 text-lg">
                  Get a professional website with booking, payments &amp; reviews in just 5 minutes. No coding required!
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="https://shop-onwer-pink-nexora-aap.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-nexora-pink font-bold hover:scale-105 transition-transform shadow-xl"
                  >
                    <Store className="w-5 h-5" />
                    Get Free Website
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-white/40 text-white font-bold hover:bg-white/10 transition-colors"
                  >
                    ▶ Watch Demo
                  </button>
                </div>
              </div>

              {/* Right: Benefits */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-white" />
                  <h3 className="font-bold text-white">What&apos;s included FREE:</h3>
                </div>
                <ul className="space-y-3">
                  {benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/95">
                      <div className="flex-none w-6 h-6 rounded-full bg-white/25 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 pt-5 border-t border-white/20 text-center">
                  <div className="text-3xl font-bold text-white">₹0</div>
                  <div className="text-xs text-white/80">Forever free for all shops</div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
