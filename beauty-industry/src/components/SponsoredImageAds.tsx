import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Sparkles, Plus, Phone, MessageCircle, Send, ShieldCheck, 
  Film, Play, ChevronLeft, ChevronRight, Video, Eye, ArrowRight,
  Layers, CheckCircle2
} from 'lucide-react';
import { SponsoredAdItem, SponsoredVideoItem, VideoPlatform } from '../types';
import { validateSponsoredAd, SPONSORED_PRODUCTS_DB } from '../data/sponsoredProductsData';
import { getStoredCampaigns, recordAdClickInStore } from '../data/sponsoredCampaignsStore';
import { getStoredSponsoredReels, INITIAL_SPONSORED_REELS, validateSponsoredVideo } from '../data/sponsoredReelsData';
import { recordSponsoredAnalyticsEvent } from '../data/sponsoredAnalyticsStore';
import { SponsoredVideoLightboxModal } from './SponsoredVideoLightboxModal';

interface SponsoredImageAdsProps {
  onProductClick?: (ad: SponsoredAdItem) => void;
  onSupplierClick?: (supplierId: string) => void;
  onOpenAdManager?: () => void;
  onOpenChat?: (
    supplier: { id: string; name: string; location: string; isVerified: boolean },
    product: { title: string; image: string; price?: string; moq?: string }
  ) => void;
}

export const SPONSORED_ADS: SponsoredAdItem[] = [
  {
    id: 'sp-ad-1',
    advertiser_id: 'adv_aura_001',
    seller_id: 'seller_aura_001',
    product_id: 'product_vitc_101',
    supplierName: 'Aura Beauty Labs',
    adTitle: 'Professional 20% Vitamin C Serum',
    subtitle: 'Bulk sourcing for salons & distributors',
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  },
  {
    id: 'sp-ad-2',
    advertiser_id: 'adv_luxe_002',
    seller_id: 'seller_luxe_002',
    product_id: 'product_barrier_102',
    supplierName: 'LuxeForm Cosmetics',
    adTitle: 'Hydrating Hyaluronic Barrier Cream',
    subtitle: 'OEM formulation & custom private label',
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-052445bfa3d0?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  },
  {
    id: 'sp-ad-3',
    advertiser_id: 'adv_derma_003',
    seller_id: 'seller_derma_003',
    product_id: 'product_spa_103',
    supplierName: 'Dermaglow India',
    adTitle: 'Salon Hair Repair Spa Kits',
    subtitle: 'Wholesale pricing for chain salons & spas',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  },
  {
    id: 'sp-ad-4',
    advertiser_id: 'adv_pure_004',
    seller_id: 'seller_pure_004',
    product_id: 'product_matte_104',
    supplierName: 'PureFormulations Pvt',
    adTitle: 'Matte Liquid Lipstick Pigment Base',
    subtitle: 'Raw material supply for cosmetics manufacturers',
    imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  },
  {
    id: 'sp-ad-5',
    advertiser_id: 'adv_biotech_005',
    seller_id: 'seller_biotech_005',
    product_id: 'product_scalp_105',
    supplierName: 'BioTech Derma Labs',
    adTitle: 'Rosemary & Redensyl Scalp Tonic',
    subtitle: 'Trichologist-tested anti-hairfall formula',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  },
  {
    id: 'sp-ad-6',
    advertiser_id: 'adv_cosmo_006',
    seller_id: 'seller_cosmo_006',
    product_id: 'product_dropper_106',
    supplierName: 'CosmoTech Packaging',
    adTitle: 'Frosted Amber Glass Dropper Bottles',
    subtitle: 'MOQ 500 pcs with custom silk logo printing',
    imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  },
  {
    id: 'sp-ad-7',
    advertiser_id: 'adv_radiant_007',
    seller_id: 'seller_radiant_007',
    product_id: 'product_niacinamide_107',
    supplierName: 'Radiant Cosmeceuticals',
    adTitle: 'Brightening Niacinamide Gel Cleanser',
    subtitle: 'Dermatologist approved bulk formulations',
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  },
  {
    id: 'sp-ad-8',
    advertiser_id: 'adv_velvet_008',
    seller_id: 'seller_velvet_008',
    product_id: 'product_rosewater_108',
    supplierName: 'VelvetTouch Botanical',
    adTitle: 'Organic Rosewater Face Mist',
    subtitle: '100% steam-distilled wholesale batches',
    imageUrl: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  },
  {
    id: 'sp-ad-9',
    advertiser_id: 'adv_apex_009',
    seller_id: 'seller_apex_009',
    product_id: 'product_microderm_109',
    supplierName: 'Apex Beauty Equipment',
    adTitle: 'Professional Micro-Dermabrasion Machine',
    subtitle: 'ISO certified clinical aesthetic devices',
    imageUrl: 'https://images.unsplash.com/photo-1512290900676-26c2a4d4b57b?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  },
  {
    id: 'sp-ad-10',
    advertiser_id: 'adv_silk_010',
    seller_id: 'seller_silk_010',
    product_id: 'product_keratin_110',
    supplierName: 'Silk&Shine Manufacturing',
    adTitle: 'Keratin Infused Hair Treatment Oil',
    subtitle: 'Export quality bulk supply for distributors',
    imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  }
];

export const SponsoredImageAds: React.FC<SponsoredImageAdsProps> = ({ 
  onProductClick, 
  onSupplierClick,
  onOpenAdManager,
  onOpenChat
}) => {
  const [customCampaigns, setCustomCampaigns] = useState(() => getStoredCampaigns());
  const [storedReels, setStoredReels] = useState<SponsoredVideoItem[]>(() => getStoredSponsoredReels());
  const [activeMobileTab, setActiveMobileTab] = useState<'reels_priority' | 'banners' | 'all'>('reels_priority');
  const [activeModalVideo, setActiveModalVideo] = useState<SponsoredVideoItem | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const carouselRef = useRef<HTMLDivElement>(null);
  const recordedImpressionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleCampaignsUpdate = () => {
      setCustomCampaigns(getStoredCampaigns());
    };
    const handleReelsUpdate = () => {
      setStoredReels(getStoredSponsoredReels());
    };

    window.addEventListener('nexora_sponsored_campaigns_updated', handleCampaignsUpdate);
    window.addEventListener('nexora_sponsored_reels_updated', handleReelsUpdate);

    return () => {
      window.removeEventListener('nexora_sponsored_campaigns_updated', handleCampaignsUpdate);
      window.removeEventListener('nexora_sponsored_reels_updated', handleReelsUpdate);
    };
  }, []);

  // Combine static SPONSORED_ADS with dynamic user created campaigns that are active
  const activeValidAds = useMemo(() => {
    const defaultValid = SPONSORED_ADS.filter((ad) => validateSponsoredAd(ad));

    const customActive: SponsoredAdItem[] = customCampaigns
      .filter((c) => c.status === 'active')
      .map((c) => ({
        id: c.id,
        advertiser_id: c.advertiser_id,
        seller_id: c.seller_id,
        product_id: c.product_id,
        supplierName: c.supplierName,
        adTitle: c.adTitle,
        subtitle: c.subtitle,
        imageUrl: c.imageUrl,
        status: 'active' as const
      }))
      .filter((ad) => validateSponsoredAd(ad));

    const combinedMap = new Map<string, SponsoredAdItem>();
    [...customActive, ...defaultValid].forEach(ad => {
      if (!combinedMap.has(ad.id)) {
        const dbProduct = SPONSORED_PRODUCTS_DB[ad.product_id];
        if (dbProduct) {
          combinedMap.set(ad.id, {
            ...ad,
            supplierName: dbProduct.supplierName,
            adTitle: dbProduct.title,
            subtitle: dbProduct.description ? dbProduct.description.substring(0, 75) + '...' : ad.subtitle,
            imageUrl: dbProduct.images[0] || ad.imageUrl,
            seller_id: dbProduct.seller_id
          });
        } else {
          combinedMap.set(ad.id, ad);
        }
      }
    });

    return Array.from(combinedMap.values());
  }, [customCampaigns]);

  // Valid 9:16 Video Reels for mobile priority carousel
  const validReels = useMemo(() => {
    const activeOnly = storedReels.filter(r => {
      const { isValid } = validateSponsoredVideo(r);
      return isValid;
    });
    if (activeOnly.length >= 5) return activeOnly.slice(0, 6);
    const existingIds = new Set(activeOnly.map(r => r.video_ad_id));
    const fallback = INITIAL_SPONSORED_REELS.filter(r => !existingIds.has(r.video_ad_id));
    return [...activeOnly, ...fallback].slice(0, 6);
  }, [storedReels]);

  // Duplicate validated array once for seamless infinite continuous marquee on desktop
  const marqueeItems = useMemo(() => {
    if (activeValidAds.length === 0) return [];
    return [...activeValidAds, ...activeValidAds];
  }, [activeValidAds]);

  // Viewport impression observer for image & video ads
  useEffect(() => {
    if (activeValidAds.length === 0 && validReels.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const adId = entry.target.getAttribute('data-ad-id');
            const isReel = entry.target.getAttribute('data-is-reel') === 'true';

            if (adId && !recordedImpressionsRef.current.has(adId)) {
              recordedImpressionsRef.current.add(adId);

              if (isReel) {
                const matchedReel = validReels.find(v => v.video_ad_id === adId);
                if (matchedReel) {
                  recordSponsoredAnalyticsEvent('ad_impression', {
                    ad_id: matchedReel.video_ad_id,
                    seller_id: matchedReel.seller_id,
                    product_id: matchedReel.product_id,
                    media_type: 'reel_or_short',
                    platform: matchedReel.platform,
                    supplierName: matchedReel.supplierName
                  });
                }
              } else {
                const matched = activeValidAds.find(a => a.id === adId);
                if (matched) {
                  recordSponsoredAnalyticsEvent('ad_impression', {
                    ad_id: matched.id,
                    seller_id: matched.seller_id,
                    product_id: matched.product_id,
                    media_type: 'image_ad',
                    supplierName: matched.supplierName
                  });
                }
              }
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const cards = document.querySelectorAll('.sponsored-impression-target');
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [activeValidAds, validReels, activeMobileTab]);

  // Scroll carousel helpers
  const handleScrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  // Track scroll position on mobile for slide indicator
  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) return;
    const progress = scrollLeft / maxScroll;
    const totalCount = activeMobileTab === 'reels_priority' 
      ? validReels.length 
      : activeMobileTab === 'banners' 
        ? activeValidAds.length 
        : (validReels.length + activeValidAds.length);
    const index = Math.min(totalCount - 1, Math.floor(progress * totalCount));
    setActiveSlideIndex(index);
  };

  // Platform badge helper
  const getPlatformBadge = (platform: VideoPlatform) => {
    switch (platform) {
      case 'YouTube':
        return { label: 'YouTube Short', bg: 'bg-red-600' };
      case 'Instagram':
        return { label: 'Instagram Reel', bg: 'bg-gradient-to-r from-purple-600 to-pink-500' };
      case 'Facebook':
        return { label: 'Facebook Reel', bg: 'bg-blue-600' };
      case 'LinkedIn':
        return { label: 'LinkedIn Video', bg: 'bg-blue-700' };
      default:
        return { label: '9:16 Video', bg: 'bg-[#b90064]' };
    }
  };

  if (activeValidAds.length === 0 && validReels.length === 0) {
    return null;
  }

  return (
    <section className="my-6 md:my-8 overflow-hidden py-2">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-[#fde7f3] border border-[#f7c5e0] flex items-center justify-center text-[#b90064] shadow-xs shrink-0">
            <Sparkles className="w-4 h-4 md:w-4.5 md:h-4.5 text-[#b90064]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg md:text-xl font-black text-[#1c1b1b] tracking-tight">
                Sponsored Showcase
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#fde7f3] border border-[#f7c5e0] text-[#b90064] text-[9.5px] md:text-[10px] font-black uppercase tracking-wider">
                Featured Ads
              </span>
            </div>
            <p className="text-xs text-[#594047] font-medium hidden sm:block mt-0.5">
              Verified supplier promotions, 9:16 video demos & direct bulk sourcing showcases
            </p>
          </div>
        </div>

        {/* Mobile / Desktop Action Controls */}
        <div className="flex items-center gap-2">
          {onOpenAdManager && (
            <button
              onClick={onOpenAdManager}
              className="bg-[#b90064] hover:bg-[#a00056] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Create Ad</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          MOBILE VIEW (< md): HORIZONTAL SWIPEABLE CAROUSEL PRIORITIZING 9:16 VIDEOS
          ========================================================================= */}
      <div className="block md:hidden">
        {/* Mobile Category / Format Switcher Pills */}
        <div className="flex items-center justify-between gap-2 mb-3 px-1">
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
            <button
              onClick={() => {
                setActiveMobileTab('reels_priority');
                if (carouselRef.current) carouselRef.current.scrollLeft = 0;
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeMobileTab === 'reels_priority'
                  ? 'bg-[#b90064] text-white shadow-xs'
                  : 'bg-white text-[#594047] border border-[#e8e8e8] hover:border-[#b90064]/40'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-current" />
              <span>🎬 9:16 Reels ({validReels.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveMobileTab('banners');
                if (carouselRef.current) carouselRef.current.scrollLeft = 0;
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeMobileTab === 'banners'
                  ? 'bg-[#b90064] text-white shadow-xs'
                  : 'bg-white text-[#594047] border border-[#e8e8e8] hover:border-[#b90064]/40'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-current" />
              <span>💎 Sourcing Banners ({activeValidAds.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveMobileTab('all');
                if (carouselRef.current) carouselRef.current.scrollLeft = 0;
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeMobileTab === 'all'
                  ? 'bg-[#b90064] text-white shadow-xs'
                  : 'bg-white text-[#594047] border border-[#e8e8e8] hover:border-[#b90064]/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-current" />
              <span>All ({validReels.length + activeValidAds.length})</span>
            </button>
          </div>

          {/* Quick Nav Chevron Arrows on Mobile */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleScrollLeft}
              className="w-7 h-7 rounded-full bg-white border border-[#e8e8e8] hover:border-[#b90064] flex items-center justify-center text-zinc-700 active:scale-95 shadow-2xs"
              aria-label="Previous Ad"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleScrollRight}
              className="w-7 h-7 rounded-full bg-white border border-[#e8e8e8] hover:border-[#b90064] flex items-center justify-center text-zinc-700 active:scale-95 shadow-2xs"
              aria-label="Next Ad"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Swipeable Carousel Track with Snap Physics */}
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="flex items-stretch gap-3 overflow-x-auto pb-3 pt-1 px-1 snap-x snap-mandatory scroll-smooth hide-scrollbar"
        >
          {/* TAB 1: 9:16 Video Reels (Priority Mode) */}
          {(activeMobileTab === 'reels_priority' || activeMobileTab === 'all') &&
            validReels.map((reel) => {
              const badge = getPlatformBadge(reel.platform);

              return (
                <div
                  key={`reel-mob-${reel.video_ad_id}`}
                  data-ad-id={reel.video_ad_id}
                  data-is-reel="true"
                  onClick={() => setActiveModalVideo(reel)}
                  className="sponsored-impression-target group relative shrink-0 w-[190px] aspect-[9/16] rounded-2xl overflow-hidden border border-[#e8dfe3] bg-[#1a1718] cursor-pointer shadow-sm active:scale-[0.99] transition-all snap-start flex flex-col justify-between"
                >
                  {/* Poster Image */}
                  <img
                    src={reel.poster_url}
                    alt={reel.display_title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/25" />

                  {/* Top Badge: 9:16 Video Ad & Platform */}
                  <div className="relative z-10 p-2.5 flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs ${badge.bg}`}>
                      <Play className="w-2.5 h-2.5 fill-white" />
                      <span>{badge.label}</span>
                    </span>

                    {reel.duration && (
                      <span className="px-1.5 py-0.5 rounded bg-black/70 text-gray-200 text-[9px] font-mono border border-white/10">
                        {reel.duration}
                      </span>
                    )}
                  </div>

                  {/* Center Animated Play Ring */}
                  <div className="relative z-10 flex items-center justify-center my-auto pointer-events-none">
                    <div className="w-11 h-11 rounded-full bg-white/30 backdrop-blur-md border border-white/50 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#b90064] transition-all shadow-lg">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom Information & 1-Tap Watch / Enquire */}
                  <div className="relative z-10 p-3 space-y-1.5">
                    <span className="text-[10px] font-bold text-pink-300 tracking-wide truncate block uppercase">
                      {reel.supplierName}
                    </span>

                    <h3 className="text-xs font-black text-white leading-tight line-clamp-2 drop-shadow-sm">
                      {reel.display_title}
                    </h3>

                    <div className="pt-1">
                      <div className="w-full py-1.5 bg-[#b90064] text-white text-[11px] font-black rounded-xl text-center flex items-center justify-center gap-1 shadow-xs">
                        <span>Watch Demo</span>
                        <ArrowRight className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

          {/* TAB 2: Sourcing Banners (Horizontal Image Cards) */}
          {(activeMobileTab === 'banners' || activeMobileTab === 'all') &&
            activeValidAds.map((ad) => (
              <div
                key={`banner-mob-${ad.id}`}
                data-ad-id={ad.id}
                data-is-reel="false"
                onClick={() => {
                  recordAdClickInStore(ad.id);
                  recordSponsoredAnalyticsEvent('product_click', {
                    ad_id: ad.id,
                    seller_id: ad.seller_id,
                    product_id: ad.product_id,
                    media_type: 'image_ad',
                    supplierName: ad.supplierName
                  });
                  onProductClick?.(ad);
                }}
                className="sponsored-impression-target group shrink-0 w-[265px] bg-white border border-[#e8e8e8] hover:border-[#b90064]/50 rounded-2xl overflow-hidden shadow-xs active:scale-[0.99] transition-all snap-start flex flex-col justify-between"
              >
                {/* Product Image */}
                <div className="relative w-full h-[145px] overflow-hidden bg-stone-100">
                  <img
                    src={ad.imageUrl}
                    alt={ad.adTitle}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-white/20">
                    Sourcing Ad
                  </div>
                </div>

                {/* Content & Actions */}
                <div className="p-3 flex flex-col justify-between space-y-2.5 flex-1">
                  <div>
                    <div className="flex items-center justify-between text-[10.5px] font-bold text-[#8c7077] mb-1">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          onSupplierClick?.(ad.seller_id);
                        }}
                        className="truncate flex items-center gap-1 text-[#b90064] font-black"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#b90064]" />
                        {ad.supplierName}
                      </span>
                      <span className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">
                        Verified
                      </span>
                    </div>

                    <h3 className="text-xs font-black text-zinc-950 leading-snug line-clamp-1">
                      {ad.adTitle}
                    </h3>
                    <p className="text-[11px] text-[#594047] font-medium line-clamp-1 mt-0.5">
                      {ad.subtitle}
                    </p>
                  </div>

                  {/* 3 Mobile Action Buttons */}
                  <div className="grid grid-cols-3 gap-1 pt-1 border-t border-stone-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const dbProduct = SPONSORED_PRODUCTS_DB[ad.product_id];
                        const phone = dbProduct?.sellerDetails?.phone || '+91 98201 55443';
                        const cleanPhone = phone.replace(/[^0-9+]/g, '');
                        window.location.href = `tel:${cleanPhone}`;
                      }}
                      className="flex items-center justify-center gap-0.5 bg-stone-50 border border-stone-200 text-stone-800 text-[10px] font-bold py-1.5 rounded-xl cursor-pointer"
                    >
                      <Phone className="w-3 h-3 text-[#b90064]" />
                      <span>Call</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const dbProduct = SPONSORED_PRODUCTS_DB[ad.product_id];
                        const wa = dbProduct?.sellerDetails?.whatsapp || '919820155443';
                        const msg = encodeURIComponent(`Hello ${ad.supplierName}, I saw your sponsored ad "${ad.adTitle}" on Nexora Luxe.`);
                        window.open(`https://wa.me/${wa}?text=${msg}`, '_blank');
                      }}
                      className="flex items-center justify-center gap-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold py-1.5 rounded-xl cursor-pointer"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-600" />
                      <span>WA</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        recordSponsoredAnalyticsEvent('enquire_click', {
                          ad_id: ad.id,
                          seller_id: ad.seller_id,
                          product_id: ad.product_id,
                          media_type: 'image_ad',
                          supplierName: ad.supplierName
                        });
                        const dbProduct = SPONSORED_PRODUCTS_DB[ad.product_id];
                        onOpenChat?.(
                          {
                            id: ad.seller_id,
                            name: ad.supplierName,
                            location: dbProduct?.supplierLocation || 'Mumbai, MH',
                            isVerified: true
                          },
                          {
                            title: ad.adTitle,
                            image: ad.imageUrl,
                            price: dbProduct?.priceRange,
                            moq: dbProduct?.moq
                          }
                        );
                      }}
                      className="flex items-center justify-center gap-0.5 bg-[#b90064] text-white text-[10px] font-black py-1.5 rounded-xl cursor-pointer shadow-xs"
                    >
                      <Send className="w-3 h-3 text-white" />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Mobile Swipe Hint & Active Slide Tracker */}
        <div className="flex items-center justify-between px-2 pt-1 text-[10.5px] text-[#594047]">
          <span className="font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b90064] animate-pulse" />
            <span>Swipe horizontally to browse</span>
          </span>
          <span className="font-mono font-bold text-zinc-900">
            {activeMobileTab === 'reels_priority' 
              ? `${Math.min(activeSlideIndex + 1, validReels.length)} / ${validReels.length} Reels`
              : activeMobileTab === 'banners'
                ? `${Math.min(activeSlideIndex + 1, activeValidAds.length)} / ${activeValidAds.length} Ads`
                : `${Math.min(activeSlideIndex + 1, validReels.length + activeValidAds.length)} Items`
            }
          </span>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP VIEW (md and above): CONTINUOUS INFINITE MARQUEE WITH EDGE GRADIENTS
          ========================================================================= */}
      <div className="hidden md:block">
        <div className="relative w-full overflow-x-auto hide-scrollbar group">
          {/* Edge Gradients */}
          <div className="absolute left-0 top-0 bottom-0 w-12 lg:w-20 bg-gradient-to-r from-[#fdf8f8] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 lg:w-20 bg-gradient-to-l from-[#fdf8f8] to-transparent z-10 pointer-events-none" />

          <div className="animate-marquee flex items-center gap-4 py-3 px-2">
            {marqueeItems.map((ad, index) => (
              <div
                key={`${ad.id}-${index}`}
                data-ad-id={ad.id}
                data-is-reel="false"
                onClick={() => {
                  recordAdClickInStore(ad.id);
                  recordSponsoredAnalyticsEvent('product_click', {
                    ad_id: ad.id,
                    seller_id: ad.seller_id,
                    product_id: ad.product_id,
                    media_type: 'image_ad',
                    supplierName: ad.supplierName
                  });
                  onProductClick?.(ad);
                }}
                className="sponsored-impression-target group/card shrink-0 cursor-pointer bg-white border border-[#e8e8e8] hover:border-[#b90064]/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl relative flex flex-col justify-between w-[320px] lg:w-[350px]"
              >
                {/* HD Product Banner Image */}
                <div className="relative w-full h-[180px] lg:h-[200px] overflow-hidden bg-stone-100">
                  <img
                    src={ad.imageUrl}
                    alt={ad.adTitle}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-white/20">
                    Sponsored
                  </div>
                </div>

                {/* Bottom Details & Actions */}
                <div className="p-4 flex flex-col justify-between space-y-3 bg-white">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#8c7077] uppercase tracking-wider mb-1">
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSupplierClick?.(ad.seller_id);
                        }}
                        className="truncate flex items-center gap-1 text-[#b90064] hover:underline cursor-pointer font-extrabold"
                        title="View Supplier Profile"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#b90064]" />
                        {ad.supplierName}
                      </span>
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">B2B Verified</span>
                    </div>

                    <h3 className="text-sm font-extrabold text-zinc-950 leading-snug line-clamp-1 group-hover/card:text-[#b90064] transition-colors">
                      {ad.adTitle}
                    </h3>

                    <p className="text-xs text-[#594047] font-medium line-clamp-1 mt-0.5">
                      {ad.subtitle}
                    </p>
                  </div>

                  {/* Direct Action Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-stone-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const dbProduct = SPONSORED_PRODUCTS_DB[ad.product_id];
                        const phone = dbProduct?.sellerDetails?.phone || '+91 98201 55443';
                        const cleanPhone = phone.replace(/[^0-9+]/g, '');
                        window.location.href = `tel:${cleanPhone}`;
                      }}
                      className="flex items-center justify-center gap-1 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 text-[11px] font-bold py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                      title="Call Supplier"
                    >
                      <Phone className="w-3 h-3 text-[#b90064]" />
                      <span>Call</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const dbProduct = SPONSORED_PRODUCTS_DB[ad.product_id];
                        const wa = dbProduct?.sellerDetails?.whatsapp || '919820155443';
                        const msg = encodeURIComponent(`Hello ${ad.supplierName}, I found your sponsored listing for "${ad.adTitle}" on Nexora Luxe and would like to discuss bulk sourcing.`);
                        window.open(`https://wa.me/${wa}?text=${msg}`, '_blank');
                      }}
                      className="flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                      title="WhatsApp Enquiry"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        recordSponsoredAnalyticsEvent('enquire_click', {
                          ad_id: ad.id,
                          seller_id: ad.seller_id,
                          product_id: ad.product_id,
                          media_type: 'image_ad',
                          supplierName: ad.supplierName
                        });
                        const dbProduct = SPONSORED_PRODUCTS_DB[ad.product_id];
                        onOpenChat?.(
                          {
                            id: ad.seller_id,
                            name: ad.supplierName,
                            location: dbProduct?.supplierLocation || 'Mumbai, MH',
                            isVerified: true
                          },
                          {
                            title: ad.adTitle,
                            image: ad.imageUrl,
                            price: dbProduct?.priceRange,
                            moq: dbProduct?.moq
                          }
                        );
                      }}
                      className="flex items-center justify-center gap-1 bg-[#b90064] hover:bg-[#a00056] text-white text-[11px] font-extrabold py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                      title="Send Enquiry / Chat"
                    >
                      <Send className="w-3 h-3 text-white" />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video Lightbox Modal for 9:16 Video Ads */}
      {activeModalVideo && (
        <SponsoredVideoLightboxModal
          video={activeModalVideo}
          onClose={() => setActiveModalVideo(null)}
          onViewProduct={(productId, sellerId) => {
            setActiveModalVideo(null);
            if (onProductClick) {
              const matchedAd = activeValidAds.find(a => a.product_id === productId);
              if (matchedAd) {
                onProductClick(matchedAd);
              }
            }
          }}
          onViewSupplier={(sellerId) => {
            setActiveModalVideo(null);
            if (onSupplierClick) {
              onSupplierClick(sellerId);
            }
          }}
          onEnquire={(productId, sellerId, supplierName) => {
            setActiveModalVideo(null);
            const dbProduct = productId ? SPONSORED_PRODUCTS_DB[productId] : null;
            if (onOpenChat) {
              onOpenChat(
                {
                  id: sellerId,
                  name: supplierName,
                  location: dbProduct?.supplierLocation || 'Mumbai, MH',
                  isVerified: true
                },
                {
                  title: dbProduct?.title || 'Formulation Sourcing',
                  image: dbProduct?.images[0] || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be',
                  price: dbProduct?.priceRange,
                  moq: dbProduct?.moq
                }
              );
            }
          }}
        />
      )}
    </section>
  );
};
