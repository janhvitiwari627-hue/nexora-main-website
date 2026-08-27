'use client';

import AnimatedSection from './AnimatedSection';
import StatsCounter from './StatsCounter';
import { TrendingUp, Users, Sparkles, Award } from 'lucide-react';

const stats = [
  { icon: Users, end: 50000, suffix: '+', label: 'Happy Customers' },
  { icon: TrendingUp, end: 500, suffix: '+', label: 'Verified Salons' },
  { icon: Sparkles, end: 100000, suffix: '+', label: 'Bookings Done' },
  { icon: Award, end: 4.9, suffix: '★', label: 'User Rating' },
];

export default function StatsSection() {
  return (
    <section className="py-16 md:py-20 relative overflow-hidden" aria-label="Nexora platform statistics">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-nexora-pink/5 via-transparent to-nexora-pink-vibrant/5" aria-hidden="true" />

      <div className="container-nexora relative">
        <AnimatedSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="group relative p-6 md:p-8 rounded-2xl bg-gradient-to-br from-nexora-pink-soft/20 to-white/5 border border-nexora-pink/10 hover:border-nexora-pink/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(185,0,100,0.15)]"
              >
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-nexora-pink to-nexora-pink-vibrant text-white shadow-lg group-hover:scale-110 transition-transform">
                  <stat.icon className="w-6 h-6" />
                </div>

                {/* Counter */}
                <StatsCounter
                  end={stat.end}
                  suffix={stat.suffix}
                  label={stat.label}
                  duration={2 + i * 0.2}
                />

                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-nexora-pink/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" aria-hidden="true" />
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
