'use client';

import { motion } from 'framer-motion';
import AnimatedSection from './AnimatedSection';
import { TrendingUp, DollarSign, Gift, BarChart3, Users, Award } from 'lucide-react';

/*
 * NOTE ( adaptations from the original snippet ):
 * 1) The CTA href follows the owner-provided canonical deployment list:
 *    https://pink-growth-partner.vercel.app
 * 2) `glass-nexora` and the pink-light token are theme-aware (globals.css):
 *    readable on both light and dark surfaces.
 */

const features = [
  {
    icon: TrendingUp,
    title: '10x Business Growth',
    description: 'Average shop sees 10x customer base in 6 months',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: DollarSign,
    title: 'Earn More',
    description: 'Top partners earn ₹5L+/month with Nexora',
    color: 'from-amber-400 to-orange-500',
  },
  {
    icon: Gift,
    title: 'Get Rewarded',
    description: 'Exclusive rewards, cashback & bonuses monthly',
    color: 'from-fuchsia-500 to-pink-500',
  },
  {
    icon: BarChart3,
    title: 'Smart Dashboard',
    description: 'Real-time analytics, insights & recommendations',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    icon: Users,
    title: 'More Customers',
    description: 'Reach 50K+ active beauty customers in Jaipur',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Award,
    title: 'Verified Badge',
    description: 'Build trust with official Nexora verification',
    color: 'from-emerald-500 to-teal-500',
  },
];

export default function GrowMoreSection() {
  return (
    <section className="py-16 md:py-20 relative overflow-hidden" aria-label="Grow more with Nexora — for business owners">
      <div className="absolute inset-0 bg-gradient-to-b from-nexora-pink/5 via-transparent to-transparent" aria-hidden="true" />

      <div className="container-nexora relative">
        <AnimatedSection>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nexora-pink-soft/20 border border-nexora-pink/30 text-nexora-pink-light text-xs font-bold mb-4">
              <TrendingUp className="w-4 h-4" />
              FOR BUSINESS OWNERS
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 font-playfair">
              <span className="bg-gradient-to-r from-nexora-pink to-nexora-pink-vibrant bg-clip-text text-transparent">
                Grow More. Earn More.
              </span>
              <br />
              <span className="text-nexora-ink">Get Rewarded.</span>
            </h2>
            <p className="text-nexora-muted max-w-2xl mx-auto">
              Join 500+ successful beauty businesses growing with Nexora
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="group relative p-6 rounded-2xl glass-nexora hover:border-nexora-pink/40 transition-all cursor-default overflow-hidden"
              >
                {/* Background gradient on hover */}
                <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500`} aria-hidden="true" />

                <div className={`relative inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-lg mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                  <feature.icon className="w-6 h-6" />
                </div>

                <h3 className="font-bold text-lg mb-2 text-nexora-ink">{feature.title}</h3>
                <p className="text-sm text-nexora-muted">{feature.description}</p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

        {/* CTA */}
        <AnimatedSection delay={0.4}>
          <div className="text-center mt-12">
            <a
              href="https://pink-growth-partner.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-nexora-pink to-nexora-pink-vibrant text-white font-bold hover:scale-105 transition-transform shadow-[0_10px_30px_rgba(185,0,100,0.4)]"
            >
              Join as Business Partner
              <span className="text-xl" aria-hidden="true">→</span>
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
