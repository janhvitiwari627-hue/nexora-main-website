'use client';

import { motion } from 'framer-motion';
import AnimatedSection from './AnimatedSection';
import { Smartphone, Apple, PlayCircle, Globe, ArrowRight } from 'lucide-react';
import Link from 'next/link';

/*
 * NOTE ( adaptations from the original snippet ):
 * App URLs follow the owner-provided canonical deployment list (main site,
 * beauty-shop-2, remix-final-salon-app, pink-growth-partner,
 * shop-onwer-pink-nexora-aap, job-portal-nexora, final-new-app-templete).
 * The Web App CTA points at "/" (this site IS the web app); the App Store /
 * Google Play buttons keep their "#" placeholders until real store listings
 * exist.
 */

const apps = [
  {
    name: 'Beauty Shop',
    description: 'Premium products at best prices',
    icon: '🛍️',
    color: 'from-pink-500 to-rose-500',
    url: 'https://beauty-shop-2.vercel.app/',
  },
  {
    name: 'Salon Booking',
    description: 'Book in seconds',
    icon: '💇',
    color: 'from-purple-500 to-pink-500',
    url: 'https://remix-final-salon-app.vercel.app/',
  },
  {
    name: 'Growth Partner',
    description: 'Grow your business',
    icon: '📈',
    color: 'from-fuchsia-500 to-pink-500',
    url: 'https://pink-growth-partner.vercel.app/',
  },
  {
    name: 'Shop Owner',
    description: 'Manage your shop',
    icon: '🏪',
    color: 'from-rose-500 to-red-500',
    url: 'https://shop-onwer-pink-nexora-aap.vercel.app/',
  },
  {
    name: 'Job Portal',
    description: 'Find beauty jobs',
    icon: '💼',
    color: 'from-indigo-500 to-purple-500',
    url: 'https://job-portal-nexora.vercel.app/',
  },
  {
    name: 'Template Studio',
    description: 'Website templates',
    icon: '🎨',
    color: 'from-amber-500 to-pink-500',
    url: 'https://final-new-app-templete.vercel.app/',
  },
];

export default function InstallApps() {
  return (
    <section className="py-16 md:py-20 relative overflow-hidden" aria-label="Install Nexora apps">
      <div className="container-nexora">
        <AnimatedSection>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nexora-pink-soft/20 border border-nexora-pink/30 text-nexora-pink-light text-xs font-bold mb-4">
              <Smartphone className="w-4 h-4" />
              NEXORA ECOSYSTEM
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 font-playfair">
              <span className="bg-gradient-to-r from-nexora-pink to-nexora-pink-vibrant bg-clip-text text-transparent">
                Install All 6 Nexora Apps
              </span>
            </h2>
            <p className="text-nexora-muted max-w-2xl mx-auto">
              One login. Six powerful apps. Endless possibilities.
            </p>
          </div>
        </AnimatedSection>

        {/* Apps Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-12">
          {apps.map((app, i) => (
            <AnimatedSection key={i} delay={i * 0.08}>
              <motion.a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="group block relative p-5 rounded-2xl glass-nexora hover:border-nexora-pink/50 transition-all overflow-hidden"
              >
                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500`} aria-hidden="true" />

                <div className="relative">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${app.color} text-3xl shadow-lg mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all`} aria-hidden="true">
                    {app.icon}
                  </div>

                  <h3 className="font-bold text-base mb-1 text-nexora-ink flex items-center gap-2">
                    {app.name}
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-nexora-pink" aria-hidden="true" />
                  </h3>
                  <p className="text-xs text-nexora-muted">{app.description}</p>
                </div>
              </motion.a>
            </AnimatedSection>
          ))}
        </div>

        {/* Download CTAs */}
        <AnimatedSection delay={0.5}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-nexora-pink via-nexora-pink-vibrant to-rose-600 p-8 md:p-12 text-center shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" aria-hidden="true" />

            <div className="relative">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 font-playfair">
                Download Nexora App
              </h3>
              <p className="text-white/90 mb-6 max-w-xl mx-auto">
                Get the complete beauty ecosystem in your pocket. Available on all platforms.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* Placeholder until a real App Store listing exists. */}
                <a
                  href="#"
                  aria-label="Download on the App Store (coming soon)"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-semibold hover:scale-105 transition-transform shadow-lg"
                >
                  <Apple className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-[10px] opacity-80">Download on</div>
                    <div className="text-sm font-bold leading-none">App Store</div>
                  </div>
                </a>
                {/* Placeholder until a real Google Play listing exists. */}
                <a
                  href="#"
                  aria-label="Get it on Google Play (coming soon)"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-semibold hover:scale-105 transition-transform shadow-lg"
                >
                  <PlayCircle className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-[10px] opacity-80">Get it on</div>
                    <div className="text-sm font-bold leading-none">Google Play</div>
                  </div>
                </a>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/20 backdrop-blur text-white font-semibold hover:bg-white/30 transition-colors border border-white/30"
                >
                  <Globe className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-[10px] opacity-80">Use on</div>
                    <div className="text-sm font-bold leading-none">Web App</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
