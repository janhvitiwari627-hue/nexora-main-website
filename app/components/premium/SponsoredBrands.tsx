'use client';

import AnimatedSection from './AnimatedSection';
import { Sparkles } from 'lucide-react';

/*
 * NOTE ( adaptations from the original snippet ):
 * 1) The `marquee` keyframes live in globals.css (translateX 0 → -50% over
 *    the duplicated brand list = seamless loop).
 * 2) The duplicated half of the marquee is aria-hidden so screen readers
 *    announce each brand exactly once.
 * 3) Cards are static trust chips — the misleading cursor-pointer is dropped.
 */

const brands = [
  { name: 'Lakme', logo: '💄' },
  { name: "L'Oreal", logo: '✨' },
  { name: 'Nykaa', logo: '🌸' },
  { name: 'Mamaearth', logo: '🌿' },
  { name: 'Plum', logo: '🍑' },
  { name: 'Mcaffeine', logo: '☕' },
  { name: 'Sugar', logo: '🍬' },
  { name: 'Wow', logo: '⭐' },
  { name: 'Dot & Key', logo: '🔑' },
  { name: 'Minimalist', logo: '🧪' },
  { name: 'Cetaphil', logo: '🧴' },
  { name: 'Nivea', logo: '💙' },
];

export default function SponsoredBrands() {
  return (
    <section className="py-12 md:py-16 relative overflow-hidden" aria-label="Sponsored brands partnering with Nexora">
      <div className="container-nexora">
        <AnimatedSection>
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nexora-pink-soft/20 border border-nexora-pink/30 text-nexora-pink-light text-xs font-bold mb-3">
              <Sparkles className="w-3 h-3" />
              TRUSTED BY TOP BRANDS
            </span>
            <p className="text-nexora-muted">
              Premium brands partner with Nexora for verified distribution
            </p>
          </div>
        </AnimatedSection>

        {/* Marquee Container */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-nexora-pink-soft/10 to-transparent z-10 pointer-events-none" aria-hidden="true" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-nexora-pink-soft/10 to-transparent z-10 pointer-events-none" aria-hidden="true" />

          <div className="overflow-hidden">
            <div className="flex gap-8 animate-marquee">
              {[...brands, ...brands].map((brand, i) => (
                <div
                  key={i}
                  className="flex-none group"
                  aria-hidden={i >= brands.length ? true : undefined}
                >
                  <div className="w-32 h-20 rounded-xl glass-nexora flex flex-col items-center justify-center gap-1 hover:border-nexora-pink/40 transition-all hover:scale-105">
                    <div className="text-3xl group-hover:scale-110 transition-transform" aria-hidden="true">
                      {brand.logo}
                    </div>
                    <div className="text-xs font-semibold text-nexora-ink">
                      {brand.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
