import { SponsoredVideoItem, VideoPlatform } from '../types';
import { SPONSORED_PRODUCTS_DB } from './sponsoredProductsData';

export const INITIAL_SPONSORED_REELS: SponsoredVideoItem[] = [
  {
    video_ad_id: 'reel-01-yt',
    advertiser_id: 'adv_aura_001',
    seller_id: 'seller_aura_001',
    product_id: 'product_vitc_101',
    supplierName: 'Aura Beauty Labs',
    platform: 'YouTube',
    source_url: 'https://www.youtube.com/shorts/3P_YJ7rV2cE',
    embed_url: 'https://www.youtube.com/embed/3P_YJ7rV2cE?autoplay=1&rel=0',
    media_type: 'reel_or_short',
    poster_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
    display_title: '20% Vitamin C Serum Lab Production Line',
    display_description: 'Behind the scenes look at our WHO-GMP certified high-potency serum formulation process.',
    duration: '0:45',
    status: 'active'
  },
  {
    video_ad_id: 'reel-02-ig',
    advertiser_id: 'adv_luxe_002',
    seller_id: 'seller_luxe_002',
    product_id: 'product_barrier_102',
    supplierName: 'LuxeForm Cosmetics',
    platform: 'Instagram',
    source_url: 'https://www.instagram.com/reels/C9x8L0mPAbc/',
    embed_url: 'https://www.instagram.com/reel/C9x8L0mPAbc/embed',
    media_type: 'reel_or_short',
    poster_url: 'https://images.unsplash.com/photo-1608248597359-052445bfa3d0?auto=format&fit=crop&w=600&q=80',
    display_title: 'Peptide Barrier Cream Texture & Finish Test',
    display_description: 'Clinical hydration demo showing instant moisture retention and non-greasy absorption.',
    duration: '0:30',
    status: 'active'
  },
  {
    video_ad_id: 'reel-03-fb',
    advertiser_id: 'adv_derma_003',
    seller_id: 'seller_derma_003',
    product_id: 'product_spa_103',
    supplierName: 'Dermaglow India',
    platform: 'Facebook',
    source_url: 'https://www.facebook.com/reel/104928374928123/',
    embed_url: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F104928374928123%2F&show_text=false',
    media_type: 'reel_or_short',
    poster_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    display_title: 'Salon Hair Spa Treatment Demo for Chains',
    display_description: 'Professional keratin restoration workflow demonstrated live in our research facility.',
    duration: '0:58',
    status: 'active'
  },
  {
    video_ad_id: 'reel-04-x',
    advertiser_id: 'adv_pure_004',
    seller_id: 'seller_pure_004',
    product_id: 'product_matte_104',
    supplierName: 'PureFormulations Pvt',
    platform: 'X',
    source_url: 'https://x.com/beauty_formulations/status/178920129381',
    media_type: 'reel_or_short',
    poster_url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80',
    display_title: 'Long-Wear Matte Lip Pigment Viscosity Test',
    display_description: 'High-density pigment dispersion test for private label cosmetic brands.',
    duration: '0:25',
    status: 'active'
  },
  {
    video_ad_id: 'reel-05-li',
    advertiser_id: 'adv_biotech_005',
    seller_id: 'seller_biotech_005',
    product_id: 'product_growth_105',
    supplierName: 'Biotech Cosmeceuticals',
    platform: 'LinkedIn',
    source_url: 'https://www.linkedin.com/posts/biotech-cosmeceuticals-oem-manufacturing',
    media_type: 'reel_or_short',
    poster_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
    display_title: 'Automated Glass Dropper Bottle Bottling Facility',
    display_description: 'Tour our ISO 22716 cleanroom filling and labeling automated packaging facility.',
    duration: '0:42',
    status: 'active'
  }
];

export const INITIAL_SPONSORED_FULL_VIDEOS: SponsoredVideoItem[] = [
  {
    video_ad_id: 'fv-01-yt',
    advertiser_id: 'adv_aura_001',
    seller_id: 'seller_aura_001',
    product_id: 'product_vitc_101',
    supplierName: 'Aura Beauty Labs',
    platform: 'YouTube',
    source_url: 'https://www.youtube.com/watch?v=3P_YJ7rV2cE',
    embed_url: 'https://www.youtube.com/embed/3P_YJ7rV2cE?autoplay=1&rel=0',
    media_type: 'full_video',
    poster_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    display_title: 'Automated WHO-GMP Serum Manufacturing Plant Tour',
    display_description: 'Walkthrough of our 32,000 sq.ft cleanroom liquid manufacturing line producing high-potency Vitamin C and active botanical bases.',
    duration: '3:45',
    status: 'active'
  },
  {
    video_ad_id: 'fv-02-ig',
    advertiser_id: 'adv_luxe_002',
    seller_id: 'seller_luxe_002',
    product_id: 'product_barrier_102',
    supplierName: 'LuxeForm Cosmetics',
    platform: 'Instagram',
    source_url: 'https://www.instagram.com/tv/C9x8L0mPAbc/',
    embed_url: 'https://www.instagram.com/tv/C9x8L0mPAbc/embed',
    media_type: 'full_video',
    poster_url: 'https://images.unsplash.com/photo-1608248597359-052445bfa3d0?auto=format&fit=crop&w=1200&q=80',
    display_title: 'Peptide Cream Formulation & Viscosity Stability Analysis',
    display_description: 'Full formulation breakdown showing temperature resilience, emulsion stability, and active peptide encapsulation efficiency.',
    duration: '2:15',
    status: 'active'
  },
  {
    video_ad_id: 'fv-03-fb',
    advertiser_id: 'adv_derma_003',
    seller_id: 'seller_derma_003',
    product_id: 'product_spa_103',
    supplierName: 'Dermaglow India',
    platform: 'Facebook',
    source_url: 'https://www.facebook.com/watch/?v=104928374928123',
    embed_url: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D104928374928123&show_text=false',
    media_type: 'full_video',
    poster_url: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=1200&q=80',
    display_title: 'Professional Keratin Hair Spa Bulk Application Masterclass',
    display_description: 'Comprehensive step-by-step masterclass demonstrating hair cuticle sealing and shine restoration for chain salons.',
    duration: '4:30',
    status: 'active'
  },
  {
    video_ad_id: 'fv-04-li',
    advertiser_id: 'adv_pure_004',
    seller_id: 'seller_pure_004',
    product_id: 'product_matte_104',
    supplierName: 'PureFormulations Pvt',
    platform: 'LinkedIn',
    source_url: 'https://www.linkedin.com/posts/pureformulations-matte-pigment-base',
    media_type: 'full_video',
    poster_url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1200&q=80',
    display_title: 'OEM Liquid Lipstick Pigment Dispersion Technology',
    display_description: 'Technical presentation on ultra-fine pigment dispersion preventing sedimentation in matte cosmetic liquid formulations.',
    duration: '5:10',
    status: 'active'
  },
  {
    video_ad_id: 'fv-05-x',
    advertiser_id: 'adv_biotech_005',
    seller_id: 'seller_biotech_005',
    product_id: 'product_growth_105',
    supplierName: 'Biotech Cosmeceuticals',
    platform: 'X',
    source_url: 'https://x.com/biotech_cosmo/status/1849201928',
    media_type: 'full_video',
    poster_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80',
    display_title: 'Clinical Efficacy Study: Anagain Hair Growth Serum',
    display_description: 'Full presentation of trichology trial results showing 78% increase in hair density over 84 days of continuous treatment.',
    duration: '3:10',
    status: 'active'
  }
];

const REELS_STORAGE_KEY = 'nexora_sponsored_reels';
const FULL_VIDEOS_STORAGE_KEY = 'nexora_sponsored_full_videos';

export function validateSponsoredVideo(video: SponsoredVideoItem): { isValid: boolean; hasValidProduct: boolean } {
  if (video.status !== 'active') {
    return { isValid: false, hasValidProduct: false };
  }

  // If video is linked to a specific product_id, verify product exists, belongs to seller, and is published in DB
  if (video.product_id) {
    const product = SPONSORED_PRODUCTS_DB[video.product_id];
    if (!product || product.seller_id !== video.seller_id || !product.isPublished || product.isSuspended) {
      // Product is invalid/unlisted/suspended/wrong seller
      // Video is still valid as supplier-level ad, but hasValidProduct = false
      return { isValid: true, hasValidProduct: false };
    }
    return { isValid: true, hasValidProduct: true };
  }

  // Supplier-level video with no product_id
  return { isValid: true, hasValidProduct: false };
}

export function getStoredSponsoredReels(): SponsoredVideoItem[] {
  try {
    const raw = localStorage.getItem(REELS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REELS_STORAGE_KEY, JSON.stringify(INITIAL_SPONSORED_REELS));
      return INITIAL_SPONSORED_REELS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return INITIAL_SPONSORED_REELS;
    }
    return parsed;
  } catch {
    return INITIAL_SPONSORED_REELS;
  }
}

export function saveSponsoredReel(reel: SponsoredVideoItem): void {
  const current = getStoredSponsoredReels();
  const existingIdx = current.findIndex(r => r.video_ad_id === reel.video_ad_id);
  let updated: SponsoredVideoItem[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = reel;
  } else {
    updated = [reel, ...current];
  }
  localStorage.setItem(REELS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('nexora_sponsored_reels_updated'));
}

export function getStoredSponsoredFullVideos(): SponsoredVideoItem[] {
  try {
    const raw = localStorage.getItem(FULL_VIDEOS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(FULL_VIDEOS_STORAGE_KEY, JSON.stringify(INITIAL_SPONSORED_FULL_VIDEOS));
      return INITIAL_SPONSORED_FULL_VIDEOS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return INITIAL_SPONSORED_FULL_VIDEOS;
    }
    return parsed;
  } catch {
    return INITIAL_SPONSORED_FULL_VIDEOS;
  }
}

export function saveSponsoredFullVideo(video: SponsoredVideoItem): void {
  const current = getStoredSponsoredFullVideos();
  const existingIdx = current.findIndex(r => r.video_ad_id === video.video_ad_id);
  let updated: SponsoredVideoItem[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = video;
  } else {
    updated = [video, ...current];
  }
  localStorage.setItem(FULL_VIDEOS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('nexora_sponsored_full_videos_updated'));
}

export function detectPlatformFromUrl(url: string): { platform: VideoPlatform; videoId?: string; embedUrl?: string } {
  const cleanUrl = url.trim();
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    let videoId = '';
    if (cleanUrl.includes('shorts/')) {
      const parts = cleanUrl.split('shorts/');
      if (parts[1]) videoId = parts[1].split('?')[0].split('/')[0];
    } else if (cleanUrl.includes('v=')) {
      const parts = cleanUrl.split('v=');
      if (parts[1]) videoId = parts[1].split('&')[0];
    } else if (cleanUrl.includes('youtu.be/')) {
      const parts = cleanUrl.split('youtu.be/');
      if (parts[1]) videoId = parts[1].split('?')[0];
    }
    return {
      platform: 'YouTube',
      videoId,
      embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : undefined
    };
  }

  if (cleanUrl.includes('instagram.com')) {
    let reelId = '';
    if (cleanUrl.includes('/reel/') || cleanUrl.includes('/reels/') || cleanUrl.includes('/tv/')) {
      const parts = cleanUrl.split(/\/(?:reels?|tv)\//);
      if (parts[1]) reelId = parts[1].split('/')[0].split('?')[0];
    }
    return {
      platform: 'Instagram',
      videoId: reelId,
      embedUrl: reelId ? `https://www.instagram.com/p/${reelId}/embed` : undefined
    };
  }

  if (cleanUrl.includes('facebook.com') || cleanUrl.includes('fb.watch')) {
    return {
      platform: 'Facebook',
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanUrl)}&show_text=false`
    };
  }

  if (cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com')) {
    return {
      platform: 'X'
    };
  }

  if (cleanUrl.includes('linkedin.com')) {
    return {
      platform: 'LinkedIn'
    };
  }

  return {
    platform: 'YouTube'
  };
}
