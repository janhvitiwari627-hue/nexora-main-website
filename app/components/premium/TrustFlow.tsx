'use client';

import AnimatedSection from './AnimatedSection';
import { Shield, Lock, RefreshCw, Phone, CheckCircle, Award, Star, Users } from 'lucide-react';

/*
 * NOTE: text-green-400 gets a darker green on the light theme via a
 * globals.css override (see the TrustFlow rules there) — the default
 * green-400 is nearly unreadable on light surfaces. Everything else is
 * theme-aware by token (nexora-ink / nexora-muted / glass-nexora).
 */

const trustPoints = [
  {
    icon: Shield,
    title: '100% Verified',
    description: 'Every salon & shop is manually verified by our team',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Lock,
    title: 'Secure Payments',
    description: 'Bank-grade encryption for all transactions',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: RefreshCw,
    title: 'Easy Refunds',
    description: '100% refund if cancelled 24hrs before',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Phone,
    title: '24/7 Support',
    description: 'Real humans available round the clock',
    color: 'from-nexora-pink to-nexora-pink-vibrant',
  },
];

const stats = [
  { value: '50K+', label: 'Happy Users', icon: Users },
  { value: '4.9★', label: 'Avg Rating', icon: Star },
  { value: '500+', label: 'Verified Places', icon: CheckCircle },
  { value: '100K+', label: 'Bookings', icon: Award },
];

export default function TrustFlow() {
  return (
    <section className="py-16 md:py-20 relative overflow-hidden" aria-label="Customer trust and safety">
      <div className="absolute inset-0 bg-gradient-to-br from-nexora-pink/5 via-transparent to-nexora-pink-vibrant/5" aria-hidden="true" />

      <div className="container-nexora relative">
        <AnimatedSection>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold mb-4">
              <Shield className="w-4 h-4" />
              TRUSTED BY THOUSANDS
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 font-playfair">
              <span className="text-nexora-ink">Customer Trust Ka</span>
              <br />
              <span className="bg-gradient-to-r from-nexora-pink to-nexora-pink-vibrant bg-clip-text text-transparent">
                Complete Flow
              </span>
            </h2>
            <p className="text-nexora-muted max-w-2xl mx-auto">
              Your safety and satisfaction is our #1 priority
            </p>
          </div>
        </AnimatedSection>

        {/* Trust Stats */}
        <AnimatedSection delay={0.2}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="text-center p-5 rounded-2xl glass-nexora hover:border-nexora-pink/30 transition-all"
              >
                <stat.icon className="w-6 h-6 text-nexora-pink mx-auto mb-2" aria-hidden="true" />
                <div className="text-2xl md:text-3xl font-bold text-nexora-ink mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-nexora-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* Trust Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {trustPoints.map((point, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <div className="group relative p-6 rounded-2xl glass-nexora hover:border-nexora-pink/40 transition-all hover:-translate-y-2 cursor-default">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${point.color} text-white shadow-lg mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                  <point.icon className="w-6 h-6" />
                </div>

                <h3 className="font-bold text-base mb-2 text-nexora-ink">{point.title}</h3>
                <p className="text-sm text-nexora-muted leading-relaxed">
                  {point.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Trust Badge */}
        <AnimatedSection delay={0.5}>
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass-nexora border-green-500/30">
              <Shield className="w-5 h-5 text-green-400" aria-hidden="true" />
              <span className="text-sm font-semibold text-nexora-ink">
                ISO 27001 Certified • GDPR Compliant • 100% Safe
              </span>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
