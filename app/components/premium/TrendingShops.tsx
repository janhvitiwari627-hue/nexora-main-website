'use client';

import { motion } from 'framer-motion';
import AnimatedSection from './AnimatedSection';
import { TrendingUp, Medal, Crown } from 'lucide-react';

/*
 * NOTE ( adaptations from the original snippet ):
 * 1) Shop images are LOCAL generated assets in /public/products/ instead of
 *    remote Unsplash URLs — this sandbox (and the repo's own convention: "no
 *    expiring remote image URL") both call for self-contained assets.
 * 2) Plain <img> instead of next/image — next/image is not used anywhere in
 *    this codebase and the vinext renderer is not verified against it; the
 *    hero already establishes the plain-<img> pattern.
 * 3) The Book Now button is wired to the existing /salons discovery route
 *    via the optional `navigate` prop (a dead button helps nobody). The card
 *    wrapper keeps its hover motion but drops the misleading cursor-pointer.
 */

const trending = [
  {
    rank: 1,
    name: 'Luxe Beauty Studio',
    category: 'Premium Salon',
    bookings: 1234,
    growth: 45,
    image: '/products/luxe-beauty-studio.jpg',
    icon: Crown,
    color: 'from-yellow-400 to-amber-500',
  },
  {
    rank: 2,
    name: 'Glow & Co Salon',
    category: 'Hair & Makeup',
    bookings: 987,
    growth: 32,
    image: '/products/glow-co-salon.jpg',
    icon: Medal,
    color: 'from-slate-300 to-slate-500',
  },
  {
    rank: 3,
    name: 'Beauty Hub Jaipur',
    category: 'Skincare & Spa',
    bookings: 856,
    growth: 28,
    image: '/products/beauty-hub-jaipur.jpg',
    icon: Medal,
    color: 'from-orange-400 to-amber-600',
  },
];

export default function TrendingShops({ navigate }: { navigate?: (path: string) => void }) {
  return (
    <section className="py-16 md:py-20 relative" aria-label="Top 3 trending shops this week">
      <div className="container-nexora">
        <AnimatedSection>
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-nexora-pink to-nexora-pink-vibrant">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-bold tracking-widest text-nexora-pink uppercase">
              Weekly Trending
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-3 font-playfair">
            <span className="bg-gradient-to-r from-nexora-pink to-nexora-pink-vibrant bg-clip-text text-transparent">
              Top 3 Trending Shops
            </span>
            <span className="text-nexora-ink"> This Week</span>
          </h2>
          <p className="text-nexora-muted mb-8">Most booked places in Jaipur this week</p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6">
          {trending.map((shop, i) => (
            <AnimatedSection key={i} delay={i * 0.15}>
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="relative group"
              >
                {/* Rank Badge */}
                <div className={`absolute -top-3 -left-3 z-10 w-12 h-12 rounded-full bg-gradient-to-br ${shop.color} flex items-center justify-center shadow-lg border-2 border-nexora-pink`}>
                  <span className="text-white font-bold text-lg">#{shop.rank}</span>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-nexora-pink/20 group-hover:border-nexora-pink/50 transition-all bg-nexora-pink-soft/10">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={shop.image}
                      alt={`${shop.name} — ${shop.category}`}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" aria-hidden="true" />

                    {/* Growth Badge */}
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-green-500/90 backdrop-blur text-white text-xs font-bold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{shop.growth}%
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-1 text-nexora-ink">{shop.name}</h3>
                    <p className="text-sm text-nexora-muted mb-3">{shop.category}</p>

                    <div className="flex items-center justify-between pt-3 border-t border-nexora-pink/10">
                      <div>
                        <div className="text-xs text-nexora-muted">This week</div>
                        <div className="text-lg font-bold text-nexora-pink">
                          {shop.bookings.toLocaleString()}
                        </div>
                        <div className="text-xs text-nexora-muted">bookings</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate?.("/salons")}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-nexora-pink to-nexora-pink-vibrant text-white text-sm font-semibold hover:scale-105 transition-transform"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
