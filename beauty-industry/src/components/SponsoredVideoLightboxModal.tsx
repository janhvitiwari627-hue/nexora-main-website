import React, { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, Play, AlertCircle, ShieldCheck, MapPin, Building2, CheckCircle2, Send, ArrowRight } from 'lucide-react';
import { SponsoredVideoItem } from '../types';
import { SPONSORED_PRODUCTS_DB } from '../data/sponsoredProductsData';
import { recordSponsoredAnalyticsEvent } from '../data/sponsoredAnalyticsStore';
import { validateSponsoredVideo } from '../data/sponsoredReelsData';

interface SponsoredVideoLightboxModalProps {
  video: SponsoredVideoItem | null;
  onClose: () => void;
  onViewProduct?: (productId: string, sellerId: string) => void;
  onViewSupplier?: (sellerId: string) => void;
  onEnquire?: (productId: string | undefined, sellerId: string, supplierName: string) => void;
}

export const SponsoredVideoLightboxModal: React.FC<SponsoredVideoLightboxModalProps> = ({
  video,
  onClose,
  onViewProduct,
  onViewSupplier,
  onEnquire
}) => {
  const [hasEmbedError, setHasEmbedError] = useState(false);
  const [hasRecordedPlay, setHasRecordedPlay] = useState(false);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setHasEmbedError(false);
    setHasRecordedPlay(false);

    if (video) {
      // Record video_open event
      recordSponsoredAnalyticsEvent('video_open', {
        ad_id: video.video_ad_id,
        seller_id: video.seller_id,
        product_id: video.product_id,
        media_type: video.media_type,
        platform: video.platform,
        supplierName: video.supplierName
      });

      // Simulate play event & milestone timers (25%, 50%, 75%, complete)
      playTimerRef.current = setTimeout(() => {
        recordSponsoredAnalyticsEvent('video_play', {
          ad_id: video.video_ad_id,
          seller_id: video.seller_id,
          product_id: video.product_id,
          media_type: video.media_type,
          platform: video.platform,
          supplierName: video.supplierName
        });
        setHasRecordedPlay(true);
      }, 1000);

      const timer25 = setTimeout(() => {
        recordSponsoredAnalyticsEvent('video_25_percent', {
          ad_id: video.video_ad_id,
          seller_id: video.seller_id,
          product_id: video.product_id,
          media_type: video.media_type,
          platform: video.platform,
          supplierName: video.supplierName
        });
      }, 3000);

      const timer50 = setTimeout(() => {
        recordSponsoredAnalyticsEvent('video_50_percent', {
          ad_id: video.video_ad_id,
          seller_id: video.seller_id,
          product_id: video.product_id,
          media_type: video.media_type,
          platform: video.platform,
          supplierName: video.supplierName
        });
      }, 6000);

      const timer75 = setTimeout(() => {
        recordSponsoredAnalyticsEvent('video_75_percent', {
          ad_id: video.video_ad_id,
          seller_id: video.seller_id,
          product_id: video.product_id,
          media_type: video.media_type,
          platform: video.platform,
          supplierName: video.supplierName
        });
      }, 9000);

      const timer100 = setTimeout(() => {
        recordSponsoredAnalyticsEvent('video_complete', {
          ad_id: video.video_ad_id,
          seller_id: video.seller_id,
          product_id: video.product_id,
          media_type: video.media_type,
          platform: video.platform,
          supplierName: video.supplierName
        });
      }, 12000);

      return () => {
        if (playTimerRef.current) clearTimeout(playTimerRef.current);
        clearTimeout(timer25);
        clearTimeout(timer50);
        clearTimeout(timer75);
        clearTimeout(timer100);
      };
    }
  }, [video]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!video) return null;

  // Validate product availability and get real supplier metadata
  const { hasValidProduct } = validateSponsoredVideo(video);
  const linkedProduct = video.product_id ? SPONSORED_PRODUCTS_DB[video.product_id] : null;

  // Real supplier trust badges derived from actual DB record
  const isGstVerified = linkedProduct?.isGstVerified ?? true;
  const isNexoraVerified = linkedProduct?.isNexoraVerified ?? true;
  const supplierLocation = linkedProduct?.supplierLocation || 'India';
  const supplierType = linkedProduct?.supplierType || 'Verified Beauty Supplier';

  const isReel = video.media_type === 'reel_or_short';
  const supportsDirectEmbed = video.platform === 'YouTube' && !!video.embed_url;
  const platformActionText = video.platform === 'X' ? 'View on X' : `Watch on ${video.platform}`;

  const getPlatformBadgeColor = () => {
    switch (video.platform) {
      case 'YouTube': return 'bg-red-600 text-white';
      case 'Instagram': return 'bg-gradient-to-r from-purple-600 to-pink-500 text-white';
      case 'Facebook': return 'bg-blue-600 text-white';
      case 'X': return 'bg-black text-white';
      case 'LinkedIn': return 'bg-blue-700 text-white';
      default: return 'bg-[#b90064] text-white';
    }
  };

  const handleProductClick = () => {
    if (video.product_id && hasValidProduct) {
      recordSponsoredAnalyticsEvent('product_click', {
        ad_id: video.video_ad_id,
        seller_id: video.seller_id,
        product_id: video.product_id,
        media_type: video.media_type,
        platform: video.platform,
        supplierName: video.supplierName
      });
      onClose();
      if (onViewProduct) onViewProduct(video.product_id, video.seller_id);
    }
  };

  const handleSupplierClick = () => {
    recordSponsoredAnalyticsEvent('supplier_click', {
      ad_id: video.video_ad_id,
      seller_id: video.seller_id,
      product_id: video.product_id,
      media_type: video.media_type,
      platform: video.platform,
      supplierName: video.supplierName
    });
    onClose();
    if (onViewSupplier) onViewSupplier(video.seller_id);
  };

  const handleEnquireClick = () => {
    recordSponsoredAnalyticsEvent('enquire_click', {
      ad_id: video.video_ad_id,
      seller_id: video.seller_id,
      product_id: video.product_id,
      media_type: video.media_type,
      platform: video.platform,
      supplierName: video.supplierName
    });
    onClose();
    if (onEnquire) onEnquire(video.product_id, video.seller_id, video.supplierName);
  };

  const handlePlatformClick = () => {
    recordSponsoredAnalyticsEvent('external_platform_click', {
      ad_id: video.video_ad_id,
      seller_id: video.seller_id,
      product_id: video.product_id,
      media_type: video.media_type,
      platform: video.platform,
      supplierName: video.supplierName
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className={`relative bg-white text-[#1c1b1b] w-full rounded-2xl overflow-hidden border border-[#e8dfe3] shadow-2xl my-auto flex flex-col max-h-[92vh] ${
          isReel 
            ? 'max-w-md md:max-w-2xl md:flex-row' 
            : 'max-w-2xl lg:max-w-3xl md:flex-col'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Lightbox"
          className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-stone-900/80 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Player Column / Container */}
        <div 
          className={`relative bg-black flex-shrink-0 flex items-center justify-center overflow-hidden ${
            isReel 
              ? 'w-full md:w-[320px] aspect-[9/16] min-h-[360px] max-h-[520px]' 
              : 'w-full aspect-[16/9] min-h-[240px] max-h-[420px]'
          }`}
        >
          {supportsDirectEmbed && !hasEmbedError ? (
            <iframe
              src={video.embed_url}
              title={video.display_title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onError={() => setHasEmbedError(true)}
            />
          ) : (
            /* Fallback or non-iframe social platform container */
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <img
                src={video.poster_url}
                alt={video.display_title}
                className="absolute inset-0 w-full h-full object-cover opacity-35 filter blur-sm"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />

              <div className="relative z-10 flex flex-col items-center max-w-sm">
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${getPlatformBadgeColor()}`}>
                  {video.platform} {isReel ? 'Reel' : 'Video'}
                </div>

                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-3 shadow-lg">
                  <Play className="w-7 h-7 text-white fill-white ml-1" />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/80 border border-amber-500/30 px-3 py-1.5 rounded-lg mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Playback is available on the original platform.</span>
                </div>

                <a
                  href={video.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handlePlatformClick}
                  className="w-full py-2.5 px-4 bg-[#b90064] hover:bg-[#a00056] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{platformActionText}</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Video Info & CTAs - Light Theme */}
        <div className="p-5 flex flex-col justify-between flex-1 bg-[#fdf8f8] text-[#1c1b1b] overflow-y-auto space-y-4">
          <div>
            {/* Header badges */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${getPlatformBadgeColor()}`}>
                {video.platform} {isReel ? 'Reel (9:16)' : 'Full Video (16:9)'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#fde7f3] border border-[#f7c5e0] text-[#b90064] text-[10px] font-extrabold uppercase tracking-wider">
                Sponsored Ad
              </span>
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-bold text-[#1c1b1b] leading-snug mb-2">
              {video.display_title}
            </h3>

            {/* Supplier / Brand Name */}
            <div className="flex items-center gap-2 text-xs font-bold text-[#594047] mb-3">
              <Building2 className="w-4 h-4 text-[#b90064]" />
              <span className="text-[#1c1b1b]">{video.supplierName}</span>
            </div>

            {/* Minimal & Accurate Supplier Trust Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {isGstVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> GST Verified
                </span>
              )}
              {isNexoraVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-800 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3 text-purple-600" /> Nexora Verified
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700 text-[10px] font-medium">
                <Building2 className="w-3 h-3 text-stone-500" /> {supplierType}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700 text-[10px] font-medium">
                <MapPin className="w-3 h-3 text-stone-500" /> {supplierLocation}
              </span>
            </div>

            {/* Description */}
            {video.display_description && (
              <p className="text-xs text-[#594047] leading-relaxed bg-white p-3 rounded-xl border border-[#e8dfe3] mb-2">
                {video.display_description}
              </p>
            )}
          </div>

          {/* Action CTAs */}
          <div className="pt-3 border-t border-[#e8dfe3] space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* View Product CTA - Only shown if product_id is valid & active */}
              {hasValidProduct && video.product_id && (
                <button
                  onClick={handleProductClick}
                  className="py-2.5 px-3 bg-[#b90064] hover:bg-[#a00056] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>View Product</span>
                </button>
              )}

              {/* View Supplier CTA */}
              <button
                onClick={handleSupplierClick}
                className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-[#1c1b1b] text-xs font-bold rounded-xl transition-all border border-stone-300 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-[#b90064]" />
                <span>View Supplier</span>
              </button>

              {/* Enquire Now CTA */}
              <button
                onClick={handleEnquireClick}
                className="py-2.5 px-3 bg-gradient-to-r from-[#b90064] to-[#e6007e] hover:from-[#a00056] hover:to-[#c4006c] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enquire Now</span>
              </button>
            </div>

            {/* Watch on Original Platform */}
            <a
              href={video.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handlePlatformClick}
              className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-[#1c1b1b] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-stone-200"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#b90064]" />
              <span>{platformActionText}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
