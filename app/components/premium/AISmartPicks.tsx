'use client';

import { motion } from 'framer-motion';
import AnimatedSection from './AnimatedSection';
import { Sparkles, Star } from 'lucide-react';

/*
 * NOTE ( adaptations from the original snippet ):
 * 1) Product images are LOCAL generated assets in /public/products/ instead of
 *    remote Unsplash URLs — this sandbox (and the repo's own convention: "no
 *    expiring remote image URL") both call for self-contained assets.
 * 2) Plain <img> instead of next/image — next/image is not used anywhere in
 *    this codebase and the vinext renderer is not verified against it; the
 *    hero already establishes the plain-<img> responsive pattern.
 * 3) text-nexora-ink is theme-aware (globals.css overrides the token under
 *    html.dark) so product names stay readable on both themes.
 */

const aiPicks = [
  {
    name: 'Vitamin C Brightening Serum',
    brand: 'Glowveda Labs',
    price: '₹1,250',
    originalPrice: '₹1,800',
    discount: 31,
    rating: 4.8,
    image: '/products/vitamin-c-serum.jpg',
    reason: '🔥 Trending in Jaipur',
  },
  {
    name: 'Anti-Acne Gel Cream',
    brand: 'Botanica Beauty',
    price: '₹95',
    originalPrice: '₹150',
    discount: 37,
    rating: 4.7,
    image: '/products/anti-acne-gel.jpg',
    reason: '✨ AI pick for you',
  },
  {
    name: 'Keratin Hair Repair',
    brand: 'Herbiome Naturals',
    price: '₹450',
    originalPrice: '₹650',
    discount: 30,
    rating: 4.6,
    image: '/products/keratin-hair-repair.jpg',
    reason: '💎 Best for your hair',
  },
  {
    name: 'Matte Liquid Lipstick',
    brand: 'Elegance Formulations',
    price: '₹349',
    originalPrice: '₹499',
    discount: 30,
    rating: 4.9,
    image: '/products/matte-lipstick.jpg',
    reason: '❤️ Most loved',
  },
];

export default function AISmartPicks() {
  return (
    <section className="py-16 md:py-20 relative" aria-label="AI smart picks — curated beauty products">
      <div className="container-nexora">
        <AnimatedSection>
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-nexora-pink to-nexora-pink-vibrant">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-bold tracking-widest text-nexora-pink uppercase">
              AI Smart Picks
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-nexora-pink to-nexora-pink-vibrant bg-clip-text text-transparent">
              Curated Just For You
            </span>
          </h2>

          <p className="text-nexora-muted mb-8 max-w-2xl">
            Our AI analyzes your preferences to recommend the best products in Jaipur
          </p>
        </AnimatedSection>

        {/* AI Handpicked Banner */}
        <AnimatedSection delay={0.2}>
          <div className="nx-handpicked-card mb-8">
            <div className="nx-handpicked-icon">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="nx-handpicked-copy">
              <h3>Handpicked by Nexora AI</h3>
              <p>Based on 50,000+ customer reviews and your browsing patterns in Jaipur</p>
            </div>
          </div>
        </AnimatedSection>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {aiPicks.map((product, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-nexora-pink-soft/30 border border-nexora-pink/10 group-hover:border-nexora-pink/30 transition-all">
                {/* eslint-disable-next-line @next/next/no-img-element -- local generated assets from /public; this repo deliberately does not use next/image (see NOTE 2 above). */}
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />

                {/* Discount Badge */}
                <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-gradient-to-r from-nexora-pink to-nexora-pink-vibrant text-white text-xs font-bold">
                  -{product.discount}%
                </div>

                {/* AI Reason Chip */}
                <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur text-nexora-pink text-xs font-bold text-center">
                  {product.reason}
                </div>
              </div>

              <div className="mt-3">
                <h3 className="font-semibold text-sm md:text-base line-clamp-1 text-nexora-ink">
                  {product.name}
                </h3>
                <p className="text-xs text-nexora-muted">{product.brand}</p>

                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-semibold">{product.rating}</span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-base font-bold text-nexora-pink">{product.price}</span>
                  <span className="text-xs text-nexora-muted line-through">{product.originalPrice}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
