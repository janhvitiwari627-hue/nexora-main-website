'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle, Phone, Mail } from 'lucide-react';
import AnimatedSection from './AnimatedSection';

/*
 * NOTE ( adaptations from the original snippet ):
 * 1) Accordion buttons carry aria-expanded/aria-controls and the answer
 *    panels are labelled regions — the repo's accessibility discipline
 *    (screen readers must perceive open/closed state).
 * 2) The dark-designed bg-white/5 card tint is invisible on the light
 *    theme; globals.css gives light mode a faint blush tint instead
 *    (see the FAQ card rules there).
 */

const faqs = [
  {
    q: 'Nexora par booking kaise kare?',
    a: 'Simply search for a salon near you, select your service, choose a time slot, and confirm booking. You can pay online or at the salon. Our AI also suggests the best options based on your preferences!',
  },
  {
    q: 'Kya refund milta hai agar cancel kare?',
    a: 'Haan! 24 hours pehle cancel karne par 100% refund milta hai. No questions asked. For Pro members, instant refunds available within 5 minutes.',
  },
  {
    q: 'Apni shop kaise list kare?',
    a: '"List Your Business" button par click kare, basic details fill kare, aur hum aapko 24 hours me verify kar denge. Shop Owner App se bhi kar sakte ho with just 2 minutes setup.',
  },
  {
    q: 'Free website kaise banaye?',
    a: 'Shop Owner App download kare, "Create Website" select kare, aur 5 minutes me aapki professional website ready with booking, payments, and reviews included!',
  },
  {
    q: 'Membership ka kya fayda hai?',
    a: 'Members ko cashback (up to 50%), priority booking, AI recommendations, exclusive offers, and free salon visits milte hain. Pro plan se 20% tak bachat on every booking.',
  },
  {
    q: 'Customer support kaise contact kare?',
    a: '24/7 support available - chat in app, call +91-98765-43210, ya email help@nexora.in. Pro members get priority support with 5-minute response time guaranteed.',
  },
  {
    q: '6 apps ka kya matlab hai?',
    a: 'Nexora ecosystem me 6 powerful apps hain: Beauty Shop, Salon Booking, Pink Growth Partner, Shop Owner, Job Portal, aur Template Studio. Ek hi login se sab access karo - unified experience!',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-16 md:py-20 relative" aria-label="Frequently asked questions">
      <div className="container-nexora max-w-4xl">
        <AnimatedSection>
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-nexora-pink to-nexora-pink-vibrant mb-4 shadow-lg">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 font-playfair">
              <span className="bg-gradient-to-r from-nexora-pink to-nexora-pink-vibrant bg-clip-text text-transparent">
                Frequently Asked
              </span>
            </h2>
            <p className="text-nexora-muted">Everything you need to know about Nexora</p>
          </div>
        </AnimatedSection>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <AnimatedSection key={i} delay={i * 0.05}>
              <motion.div
                layout
                className="rounded-xl border border-nexora-pink/10 bg-white/5 backdrop-blur overflow-hidden hover:border-nexora-pink/30 transition-colors"
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  aria-controls={`faq-panel-${i}`}
                  id={`faq-button-${i}`}
                  className="w-full p-5 flex items-center justify-between gap-4 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold text-nexora-ink">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: open === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-none w-8 h-8 rounded-full bg-nexora-pink/15 flex items-center justify-center"
                  >
                    {open === i ? (
                      <Minus className="w-4 h-4 text-nexora-pink" />
                    ) : (
                      <Plus className="w-4 h-4 text-nexora-pink" />
                    )}
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div
                        id={`faq-panel-${i}`}
                        role="region"
                        aria-labelledby={`faq-button-${i}`}
                        className="px-5 pb-5 text-nexora-muted leading-relaxed"
                      >
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.3}>
          <div className="mt-12 text-center p-8 rounded-2xl bg-gradient-to-br from-nexora-pink/10 to-nexora-pink-vibrant/5 border border-nexora-pink/20 backdrop-blur">
            <p className="text-nexora-ink mb-4 font-medium">
              Still have questions? We're here to help 24/7
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="tel:+919876543210"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-nexora-pink to-nexora-pink-vibrant text-white font-semibold hover:scale-105 transition-transform shadow-lg"
              >
                <Phone className="w-4 h-4" />
                Call Now
              </a>
              <a
                href="mailto:help@nexora.in"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-nexora-pink text-nexora-pink font-semibold hover:bg-nexora-pink/10 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Email Us
              </a>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
