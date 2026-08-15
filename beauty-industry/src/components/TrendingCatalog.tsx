import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, ShieldCheck, Heart, ArrowLeftRight } from 'lucide-react';
import { Product } from '../types';
import { StarRating } from './StarRating';

interface TrendingCatalogProps {
  products: Product[];
  compareProductIds?: string[];
  onToggleCompare?: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onRequestQuote: (product: Product) => void;
}

export const TrendingCatalog: React.FC<TrendingCatalogProps> = ({
  products,
  compareProductIds = [],
  onToggleCompare,
  onSelectProduct,
  onRequestQuote
}) => {
  const [startIndex, setStartIndex] = useState(0);
  const itemsPerPage = 3;

  const handlePrev = () => {
    setStartIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev + 1) % products.length);
  };

  // Get 3 visible products in carousel
  const visibleProducts = [];
  for (let i = 0; i < itemsPerPage; i++) {
    const index = (startIndex + i) % products.length;
    visibleProducts.push(products[index]);
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Header Row: Title + Left/Right Arrow Nav */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F5] border border-[#FFD6E5] text-[#B8005A] text-xs font-bold uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Curated Wholesale Highlights
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
            Trending in Catalog
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="w-10 h-10 rounded-full border border-[#EAE5DE] bg-white hover:bg-[#FFF0F5] hover:border-[#FFD1E3] text-[#4A4A4A] hover:text-[#B8005A] flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
            aria-label="Previous Products"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="w-10 h-10 rounded-full border border-[#EAE5DE] bg-white hover:bg-[#FFF0F5] hover:border-[#FFD1E3] text-[#4A4A4A] hover:text-[#B8005A] flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
            aria-label="Next Products"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3 Product Cards Grid with Luxury Presentation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
        {visibleProducts.map((product) => {
          const isCompared = compareProductIds.includes(product.id);

          return (
            <motion.div
              key={product.id}
              onClick={() => onSelectProduct(product)}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={`bg-white border rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer relative ${
                isCompared 
                  ? 'border-[#B8005A] ring-2 ring-[#B8005A]/20 bg-[#FFFDFE]' 
                  : 'border-[#EAE5DE] hover:border-[#B8005A]/40'
              }`}
            >
              {/* Image Container with Luxury Badges */}
              <div className="relative w-full aspect-[4/3] bg-[#F7F5F0] overflow-hidden">
                <img
                  src={product.image || undefined}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                />

                {/* Gradient Scrim for Contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Top Left Tags */}
                <div className="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-1.5 z-10">
                  <span className="bg-white/95 backdrop-blur-md text-[#1A1A1A] text-xs font-semibold px-3 py-1 rounded-full shadow-xs border border-white/40">
                    {product.tag}
                  </span>

                  {product.isVerified && (
                    <span className="bg-gradient-to-r from-[#B8005A] to-[#931248] text-white text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <ShieldCheck className="w-3 h-3" />
                      VERIFIED
                    </span>
                  )}
                </div>

                {/* Compare Toggle Button on Image */}
                {onToggleCompare && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCompare(product);
                    }}
                    className={`absolute top-3.5 right-3.5 z-20 px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-all flex items-center gap-1 shadow-md cursor-pointer ${
                      isCompared
                        ? 'bg-[#B8005A] text-white border border-[#B8005A]'
                        : 'bg-white/95 hover:bg-[#FFF0F5] text-[#4A4A4A] hover:text-[#B8005A] border border-white/60 hover:border-[#FFD1E3]'
                    }`}
                    title={isCompared ? 'Remove from comparison' : 'Add to side-by-side comparison'}
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>{isCompared ? 'Comparing' : 'Compare'}</span>
                  </button>
                )}
              </div>

              {/* Content Container */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  {/* Brand & Wholesale Badge Row */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
                      {product.brand}
                    </span>

                    {product.isWholesale && (
                      <span className="text-[11px] font-bold text-[#B8005A] bg-[#FFF0F5] border border-[#FFD1E3] px-2.5 py-0.5 rounded-full">
                        Wholesale B2B
                      </span>
                    )}
                  </div>

                  {/* Product Name */}
                  <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] group-hover:text-[#B8005A] transition-colors line-clamp-1">
                    {product.name}
                  </h3>

                  {/* Star Rating with Verified Reviews Count */}
                  <div className="mt-2 flex items-center">
                    <StarRating rating={product.rating || 4.9} reviewsCount={product.reviewsCount || 48} size="xs" compact={true} />
                  </div>

                  {/* Price & MOQ Row */}
                  <div className="mt-4 pt-3.5 border-t border-[#F5F2EB] flex items-center justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl sm:text-2xl font-extrabold text-[#1A1A1A] tracking-tight">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-[#8E8E93] font-semibold">
                        / {product.unit}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-[#4A4A4A] bg-[#F5F2EB] border border-[#EAE5DE] px-3 py-1 rounded-lg">
                      MOQ: {product.moq} units
                    </span>
                  </div>
                </div>

                {/* Bottom Stock Status & Quick Action Details Link */}
                <div className="mt-5 pt-3.5 border-t border-[#F5F2EB] flex items-center justify-between text-xs">
                  {/* Stock Indicator */}
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        product.stockStatus === 'In Stock'
                          ? 'bg-[#10B981] animate-pulse'
                          : product.stockStatus === 'Low Stock'
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#6366F1]'
                      }`}
                    />
                    <span
                      className={
                        product.stockStatus === 'In Stock'
                          ? 'text-[#059669]'
                          : product.stockStatus === 'Low Stock'
                          ? 'text-[#D97706]'
                          : 'text-[#4F46E5]'
                      }
                    >
                      {product.stockStatus}
                    </span>
                  </div>

                  {/* Details Button */}
                  <div className="flex items-center gap-1.5 font-bold text-[#B8005A] group-hover:translate-x-1 transition-transform">
                    <span>View Specifications</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

