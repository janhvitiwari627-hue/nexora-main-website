import React, { useState, useEffect, useRef } from 'react';
import { Play, Tv, Sparkles, Plus, ExternalLink, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { SponsoredVideoItem } from '../types';
import { getStoredSponsoredFullVideos, validateSponsoredVideo } from '../data/sponsoredReelsData';
import { recordSponsoredAnalyticsEvent } from '../data/sponsoredAnalyticsStore';
import { SponsoredVideoLightboxModal } from './SponsoredVideoLightboxModal';

interface SponsoredFullVideoSectionProps {
  onOpenAdManager?: () => void;
  onViewProduct?: (productId: string, sellerId: string) => void;
  onViewSupplier?: (sellerId: string) => void;
  onEnquire?: (productId: string | undefined, sellerId: string, supplierName: string) => void;
}

export const SponsoredFullVideoSection: React.FC<SponsoredFullVideoSectionProps> = ({
  onOpenAdManager,
  onViewProduct,
  onViewSupplier,
  onEnquire
}) => {
  const [videos, setVideos] = useState<SponsoredVideoItem[]>([]);
  const [activeModalVideo, setActiveModalVideo] = useState<SponsoredVideoItem | null>(null);
  const recordedImpressionsRef = useRef<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const loadVideos = () => {
    const rawList = getStoredSponsoredFullVideos();
    // Filter out inactive/disabled videos according to validateSponsoredVideo
    const validList = rawList.filter(v => {
      const { isValid } = validateSponsoredVideo(v);
      return isValid;
    });
    setVideos(validList.slice(0, 5));
  };

  useEffect(() => {
    loadVideos();
    const handleUpdate = () => loadVideos();
    window.addEventListener('nexora_sponsored_full_videos_updated', handleUpdate);
    return () => window.removeEventListener('nexora_sponsored_full_videos_updated', handleUpdate);
  }, []);

  // IntersectionObserver to record meaningful impressions (>=50% visibility)
  useEffect(() => {
    if (videos.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const adId = entry.target.getAttribute('data-ad-id');
            if (adId && !recordedImpressionsRef.current.has(adId)) {
              recordedImpressionsRef.current.add(adId);
              const matched = videos.find(v => v.video_ad_id === adId);
              if (matched) {
                recordSponsoredAnalyticsEvent('ad_impression', {
                  ad_id: matched.video_ad_id,
                  seller_id: matched.seller_id,
                  product_id: matched.product_id,
                  media_type: 'full_video',
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

    const cards = document.querySelectorAll('.sponsored-fullvideo-card');
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [videos]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (videos.length === 0) return null;

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform) {
      case 'YouTube': return 'bg-red-600 text-white';
      case 'Instagram': return 'bg-gradient-to-r from-purple-600 to-pink-500 text-white';
      case 'Facebook': return 'bg-blue-600 text-white';
      case 'X': return 'bg-black text-white';
      case 'LinkedIn': return 'bg-blue-700 text-white';
      default: return 'bg-[#b90064] text-white';
    }
  };

  return (
    <section className="my-8 overflow-hidden py-2">
      {/* Section Header - Nexora Light Theme */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#fde7f3] border border-[#f7c5e0] flex items-center justify-center text-[#b90064] shadow-xs">
            <Tv className="w-5 h-5 text-[#b90064]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-extrabold text-[#1c1b1b] tracking-tight">
                Sponsored Supplier Videos
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#fde7f3] border border-[#f7c5e0] text-[#b90064] text-[10px] font-extrabold uppercase tracking-wider">
                16:9 Showcase
              </span>
            </div>
            <p className="text-xs text-[#594047] font-medium hidden sm:block mt-0.5">
              Watch formulation demos, lab tours & product walk-throughs from verified suppliers
            </p>
          </div>
        </div>

        {/* Header Actions: Manage Ads & Scroll Buttons */}
        <div className="flex items-center gap-2">
          {onOpenAdManager && (
            <button
              onClick={onOpenAdManager}
              className="bg-[#b90064] hover:bg-[#a00056] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs mr-1"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Manage / Create Ads</span>
            </button>
          )}

          <button
            onClick={() => handleScroll('left')}
            aria-label="Scroll left"
            className="w-8 h-8 rounded-full bg-white border border-[#e8dfe3] text-[#1c1b1b] hover:bg-[#fde7f3] hover:text-[#b90064] hover:border-[#f7c5e0] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            aria-label="Scroll right"
            className="w-8 h-8 rounded-full bg-white border border-[#e8dfe3] text-[#1c1b1b] hover:bg-[#fde7f3] hover:text-[#b90064] hover:border-[#f7c5e0] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Single Row Horizontal Scroll (YouTube Thumbnail Size ~280px - 300px) */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-4 overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory"
      >
        {videos.map((video) => (
          <div
            key={video.video_ad_id}
            data-ad-id={video.video_ad_id}
            onClick={() => setActiveModalVideo(video)}
            className="sponsored-fullvideo-card group relative w-[260px] sm:w-[280px] md:w-[300px] shrink-0 bg-white rounded-2xl overflow-hidden border border-[#e8dfe3] hover:border-[#b90064] transition-all duration-300 shadow-xs hover:shadow-md cursor-pointer flex flex-col snap-start"
          >
            {/* YouTube 16:9 Compact Thumbnail */}
            <div className="relative aspect-[16/9] bg-stone-900 overflow-hidden">
              <img
                src={video.poster_url}
                alt={video.display_title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              
              {/* Subtle Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Top Right: Duration */}
              {video.duration && (
                <div className="absolute top-2 right-2 z-10 bg-black/80 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-white/20">
                  {video.duration}
                </div>
              )}

              {/* Center Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-black/50 group-hover:bg-[#b90064] border border-white/30 text-white flex items-center justify-center transition-all duration-300 transform group-hover:scale-110 shadow-md">
                  <Play className="w-4 h-4 fill-white ml-0.5 text-white" />
                </div>
              </div>
            </div>

            {/* Light Theme Text Info Below Thumbnail */}
            <div className="p-3 flex flex-col justify-between flex-1 space-y-2">
              <div>
                <h3 className="text-xs font-bold text-[#1c1b1b] line-clamp-2 leading-snug group-hover:text-[#b90064] transition-colors">
                  {video.display_title}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#594047] mt-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#b90064] shrink-0" />
                  <span className="truncate">{video.supplierName}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#f0edec] flex items-center justify-between text-[10px] text-[#594047] font-bold">
                <span className="text-[#b90064] flex items-center gap-1">
                  <Play className="w-3 h-3" /> Watch Video
                </span>
                <span className="flex items-center gap-0.5 text-[#594047] group-hover:text-[#b90064]">
                  Details <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activeModalVideo && (
        <SponsoredVideoLightboxModal
          video={activeModalVideo}
          onClose={() => setActiveModalVideo(null)}
          onViewProduct={onViewProduct}
          onViewSupplier={onViewSupplier}
          onEnquire={onEnquire}
        />
      )}
    </section>
  );
};
