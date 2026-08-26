import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Film, Play, Sparkles, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { SponsoredVideoItem, VideoPlatform } from '../types';
import { getStoredSponsoredReels, INITIAL_SPONSORED_REELS, validateSponsoredVideo } from '../data/sponsoredReelsData';
import { recordSponsoredAnalyticsEvent } from '../data/sponsoredAnalyticsStore';
import { SponsoredVideoLightboxModal } from './SponsoredVideoLightboxModal';

interface SponsoredReelsSectionProps {
  onOpenAdManager?: () => void;
  onViewProduct?: (productId: string, sellerId: string) => void;
  onViewSupplier?: (sellerId: string) => void;
  onEnquire?: (productId: string | undefined, sellerId: string, supplierName: string) => void;
}

export const SponsoredReelsSection: React.FC<SponsoredReelsSectionProps> = ({
  onOpenAdManager,
  onViewProduct,
  onViewSupplier,
  onEnquire
}) => {
  const [reels, setReels] = useState<SponsoredVideoItem[]>(() => getStoredSponsoredReels());
  const [activeModalReel, setActiveModalReel] = useState<SponsoredVideoItem | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const recordedImpressionsRef = useRef<Set<string>>(new Set());

  const handleScrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleUpdate = () => {
      setReels(getStoredSponsoredReels());
    };
    window.addEventListener('nexora_sponsored_reels_updated', handleUpdate);
    return () => window.removeEventListener('nexora_sponsored_reels_updated', handleUpdate);
  }, []);

  // Filter active reels and ensure exactly 5 valid cards
  const displayReels = useMemo(() => {
    const activeOnly = reels.filter(r => {
      const { isValid } = validateSponsoredVideo(r);
      return isValid;
    });
    if (activeOnly.length >= 5) return activeOnly.slice(0, 5);
    // Fill up with initial if less than 5
    const existingIds = new Set(activeOnly.map(r => r.video_ad_id));
    const fallback = INITIAL_SPONSORED_REELS.filter(r => !existingIds.has(r.video_ad_id));
    return [...activeOnly, ...fallback].slice(0, 5);
  }, [reels]);

  // IntersectionObserver to record meaningful impressions (>=50% visibility for 1s)
  useEffect(() => {
    if (displayReels.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const adId = entry.target.getAttribute('data-ad-id');
            if (adId && !recordedImpressionsRef.current.has(adId)) {
              recordedImpressionsRef.current.add(adId);
              const matched = displayReels.find(v => v.video_ad_id === adId);
              if (matched) {
                recordSponsoredAnalyticsEvent('ad_impression', {
                  ad_id: matched.video_ad_id,
                  seller_id: matched.seller_id,
                  product_id: matched.product_id,
                  media_type: 'reel_or_short',
                  platform: matched.platform,
                  supplierName: matched.supplierName
                });
              }
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const cards = document.querySelectorAll('.sponsored-reel-card');
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [displayReels]);

  // Platform badge style helper
  const getPlatformBadge = (platform: VideoPlatform) => {
    switch (platform) {
      case 'YouTube':
        return { label: 'YouTube Short', bg: 'bg-red-600' };
      case 'Instagram':
        return { label: 'Instagram Reel', bg: 'bg-gradient-to-r from-purple-600 to-pink-500' };
      case 'Facebook':
        return { label: 'Facebook Reel', bg: 'bg-blue-600' };
      case 'X':
        return { label: 'X Video', bg: 'bg-black' };
      case 'LinkedIn':
        return { label: 'LinkedIn Video', bg: 'bg-blue-700' };
      default:
        return { label: 'Video', bg: 'bg-[#b90064]' };
    }
  };

  return (
    <section className="my-8 overflow-hidden py-2">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#fde7f3] border border-[#f7c5e0] flex items-center justify-center text-[#b90064] shadow-xs">
            <Film className="w-5 h-5 text-[#b90064]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-extrabold text-[#1c1b1b] tracking-tight">
                Reels & Shorts
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#fde7f3] border border-[#f7c5e0] text-[#b90064] text-[10px] font-extrabold uppercase tracking-wider">
                Sponsored Video Ads
              </span>
            </div>
            <p className="text-xs text-[#594047] font-medium hidden sm:block mt-0.5">
              Watch 9:16 short video showcases, product demos & lab reels from verified suppliers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Chevron Buttons */}
          <div className="flex sm:hidden items-center gap-1">
            <button
              onClick={handleScrollLeft}
              className="w-7 h-7 rounded-full bg-white border border-[#e8e8e8] flex items-center justify-center text-zinc-700 active:scale-95 shadow-2xs"
              aria-label="Previous Reel"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleScrollRight}
              className="w-7 h-7 rounded-full bg-white border border-[#e8e8e8] flex items-center justify-center text-zinc-700 active:scale-95 shadow-2xs"
              aria-label="Next Reel"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {onOpenAdManager && (
            <button
              onClick={onOpenAdManager}
              className="bg-[#b90064] hover:bg-[#a00056] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Create Ad</span>
            </button>
          )}
        </div>
      </div>

      {/* 5 Reel Cards - Horizontal touch-swipe row on mobile, 5-col grid on desktop */}
      <div 
        ref={carouselRef}
        className="flex sm:grid sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4 overflow-x-auto pb-3 sm:pb-0 hide-scrollbar snap-x snap-mandatory scroll-smooth"
      >
        {displayReels.map((reel) => {
          const badge = getPlatformBadge(reel.platform);

          return (
            <div
              key={reel.video_ad_id}
              data-ad-id={reel.video_ad_id}
              onClick={() => setActiveModalReel(reel)}
              className="sponsored-reel-card group relative flex-shrink-0 w-[160px] sm:w-auto aspect-[9/16] rounded-2xl overflow-hidden border border-[#e8dfe3] bg-[#1a1718] cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] snap-start"
            >
              {/* Lightweight Poster Image (NO IFRAME PRELOAD) */}
              <img
                src={reel.poster_url}
                alt={reel.display_title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Gradient Scrim for Contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 group-hover:from-black/95 transition-all" />

              {/* Center Play Icon Overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#b90064] group-hover:border-[#b90064] transition-all duration-300 shadow-lg">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </div>

              {/* Bottom Details Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-3 z-10 flex flex-col justify-end">
                {/* Duration if available */}
                {reel.duration && (
                  <span className="self-start px-1.5 py-0.5 rounded bg-black/70 text-gray-200 text-[9px] font-mono mb-1.5 border border-white/10">
                    {reel.duration}
                  </span>
                )}

                {/* Supplier Name */}
                <span className="text-[10px] font-bold text-pink-300 tracking-wide truncate mb-0.5 uppercase">
                  {reel.supplierName}
                </span>

                {/* Video Title */}
                <h3 className="text-xs font-bold text-white leading-snug line-clamp-2 drop-shadow-sm group-hover:text-pink-100 transition-colors">
                  {reel.display_title}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {activeModalReel && (
        <SponsoredVideoLightboxModal
          video={activeModalReel}
          onClose={() => setActiveModalReel(null)}
          onViewProduct={onViewProduct}
          onViewSupplier={onViewSupplier}
          onEnquire={onEnquire}
        />
      )}
    </section>
  );
};
