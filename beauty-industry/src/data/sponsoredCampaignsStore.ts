import { SponsoredAdItem } from '../types';
import { SPONSORED_PRODUCTS_DB } from './sponsoredProductsData';

export interface VideoEngagementMetrics {
  watched25: number; // percentage (e.g. 78)
  watched50: number; // percentage (e.g. 62)
  watched75: number; // percentage (e.g. 48)
  watched100: number; // percentage (e.g. 35)
  avgWatchTime: string; // e.g. "0:22s"
}

export interface AdCampaignItem extends SponsoredAdItem {
  campaignName: string;
  creativeType: 'image_ad' | 'reel_or_short' | 'full_video';
  objective: 'Boost Product Sales' | 'Brand Awareness' | 'Lead Generation' | 'OEM Sourcing Enquiries';
  targetType: 'product' | 'profile';
  targetCategories: string[];
  keywords: string[];
  ctaText: 'Get Quote' | 'View Product' | 'Explore Brand' | 'Request Sample' | 'Contact Supplier';
  ctaType?: 'product_detail' | 'supplier_profile' | 'quick_rfq';
  destinationUrl?: string;
  videoUrl?: string;
  videoPlatform?: 'YouTube' | 'Instagram' | 'Facebook' | 'X' | 'LinkedIn' | 'Vimeo';
  dailyBudget: number;
  totalBudget: number;
  spentBudget: number;
  remainingBalance: number;
  impressions: number;
  clicks: number;
  ctr: number;
  productClicks: number;
  profileClicks: number;
  rfqsGenerated: number;
  videoStats?: VideoEngagementMetrics;
  startDate: string;
  endDate: string;
  isContinuous: boolean;
  createdAt: string;
  placements: ('homepage' | 'search_results' | 'category_page')[];
}

const STORAGE_KEY = 'nexora_sponsored_campaigns';
const BALANCE_KEY = 'nexora_supplier_ad_balance';

const INITIAL_CAMPAIGNS: AdCampaignItem[] = [
  {
    id: 'camp-aura-01',
    advertiser_id: 'adv_aura_001',
    seller_id: 'seller_aura_001',
    product_id: 'product_vitc_101',
    supplierName: 'Aura Beauty Labs',
    campaignName: 'Vitamin C Serum Marquee Banner',
    creativeType: 'image_ad',
    objective: 'Boost Product Sales',
    targetType: 'product',
    adTitle: 'Professional 20% Vitamin C Serum Base',
    subtitle: 'Bulk sourcing for salon chains & cosmetic brand distributors',
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    targetCategories: ['Skincare', 'OEM / Private Label'],
    keywords: ['vitamin c', 'serum', 'bulk formulation', 'salon supply'],
    ctaText: 'Get Quote',
    ctaType: 'product_detail',
    destinationUrl: '/product/product_vitc_101',
    dailyBudget: 500,
    totalBudget: 5000,
    spentBudget: 1450,
    remainingBalance: 3550,
    impressions: 18450,
    clicks: 642,
    ctr: 3.48,
    productClicks: 412,
    profileClicks: 178,
    rfqsGenerated: 52,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    isContinuous: false,
    status: 'active',
    createdAt: '2026-08-01T10:00:00Z',
    placements: ['homepage', 'search_results', 'category_page']
  },
  {
    id: 'camp-aura-02',
    advertiser_id: 'adv_aura_001',
    seller_id: 'seller_aura_001',
    product_id: 'product_vitc_101',
    supplierName: 'Aura Beauty Labs',
    campaignName: 'Cleanroom Formulation Reel (9:16)',
    creativeType: 'reel_or_short',
    objective: 'Lead Generation',
    targetType: 'product',
    adTitle: 'GMP Certified Cleanroom Dropper Batching',
    subtitle: 'Over 150,000 units monthly throughput with certified batch COA',
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-052445bfa3d0?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.youtube.com/shorts/sample_aura_reel',
    videoPlatform: 'YouTube',
    targetCategories: ['Skincare', 'Dermatology'],
    keywords: ['barrier cream', 'peptides', 'cleanroom', 'batching'],
    ctaText: 'Request Sample',
    ctaType: 'quick_rfq',
    destinationUrl: '/product/product_vitc_101',
    dailyBudget: 750,
    totalBudget: 7500,
    spentBudget: 2800,
    remainingBalance: 4700,
    impressions: 24100,
    clicks: 890,
    ctr: 3.69,
    productClicks: 560,
    profileClicks: 240,
    rfqsGenerated: 90,
    videoStats: {
      watched25: 84,
      watched50: 68,
      watched75: 52,
      watched100: 38,
      avgWatchTime: '0:26s'
    },
    startDate: '2026-08-10',
    endDate: '2026-09-10',
    isContinuous: true,
    status: 'active',
    createdAt: '2026-08-10T14:30:00Z',
    placements: ['homepage', 'search_results']
  },
  {
    id: 'camp-aura-03',
    advertiser_id: 'adv_aura_001',
    seller_id: 'seller_aura_001',
    product_id: 'product_vitc_101',
    supplierName: 'Aura Beauty Labs',
    campaignName: 'Factory Tour & OEM Facility 16:9 Showcase',
    creativeType: 'full_video',
    objective: 'Brand Awareness',
    targetType: 'profile',
    adTitle: '32,000 Sq.Ft Contract Manufacturing Plant Tour',
    subtitle: 'ISO 22716 & WHO-GMP cleanrooms for premium cosmetic formulations',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=sample_facility_tour',
    videoPlatform: 'YouTube',
    targetCategories: ['OEM / Private Label', 'Skincare', 'Haircare'],
    keywords: ['contract manufacturing', 'cleanroom', 'gmp', 'plant tour'],
    ctaText: 'Explore Brand',
    ctaType: 'supplier_profile',
    destinationUrl: '/supplier/seller_aura_001',
    dailyBudget: 600,
    totalBudget: 6000,
    spentBudget: 1200,
    remainingBalance: 4800,
    impressions: 11200,
    clicks: 430,
    ctr: 3.84,
    productClicks: 210,
    profileClicks: 180,
    rfqsGenerated: 40,
    videoStats: {
      watched25: 76,
      watched50: 58,
      watched75: 44,
      watched100: 32,
      avgWatchTime: '1:45s'
    },
    startDate: '2026-08-12',
    endDate: '2026-09-12',
    isContinuous: true,
    status: 'active',
    createdAt: '2026-08-12T11:00:00Z',
    placements: ['homepage']
  },
  {
    id: 'camp-aura-04',
    advertiser_id: 'adv_aura_001',
    seller_id: 'seller_aura_001',
    product_id: 'product_suspended_demo',
    supplierName: 'Aura Beauty Labs',
    campaignName: 'Anti-Pollution Matcha Cleanser Promo',
    creativeType: 'image_ad',
    objective: 'Boost Product Sales',
    targetType: 'product',
    adTitle: 'Antioxidant Matcha Gel Cleanser Base',
    subtitle: 'Formulation out of stock / temporarily paused by system',
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    targetCategories: ['Skincare'],
    keywords: ['matcha', 'cleanser', 'antioxidant'],
    ctaText: 'Get Quote',
    ctaType: 'product_detail',
    destinationUrl: '/product/product_suspended_demo',
    dailyBudget: 400,
    totalBudget: 4000,
    spentBudget: 850,
    remainingBalance: 3150,
    impressions: 6200,
    clicks: 180,
    ctr: 2.90,
    productClicks: 140,
    profileClicks: 30,
    rfqsGenerated: 10,
    startDate: '2026-07-15',
    endDate: '2026-08-15',
    isContinuous: false,
    status: 'paused_product_unavailable',
    createdAt: '2026-07-15T09:00:00Z',
    placements: ['homepage', 'search_results']
  },
  {
    id: 'camp-aura-05',
    advertiser_id: 'adv_aura_001',
    seller_id: 'seller_aura_001',
    product_id: 'product_vitc_101',
    supplierName: 'Aura Beauty Labs',
    campaignName: 'Summer Cosmeceutical Expo Banner',
    creativeType: 'image_ad',
    objective: 'Brand Awareness',
    targetType: 'product',
    adTitle: 'WHO-GMP Compliant Active Formulations',
    subtitle: 'Completed promotional run for Q2 distributor acquisition',
    imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
    targetCategories: ['Skincare', 'OEM / Private Label'],
    keywords: ['expo', 'formulations', 'gmp'],
    ctaText: 'View Product',
    ctaType: 'product_detail',
    destinationUrl: '/product/product_vitc_101',
    dailyBudget: 500,
    totalBudget: 3500,
    spentBudget: 3500,
    remainingBalance: 0,
    impressions: 15400,
    clicks: 520,
    ctr: 3.38,
    productClicks: 380,
    profileClicks: 110,
    rfqsGenerated: 30,
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    isContinuous: false,
    status: 'completed',
    createdAt: '2026-06-01T08:00:00Z',
    placements: ['homepage']
  }
];

export function getStoredCampaigns(): AdCampaignItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CAMPAIGNS));
      return INITIAL_CAMPAIGNS;
    }
    const parsed: AdCampaignItem[] = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error('Failed to parse campaigns from localStorage:', err);
    return INITIAL_CAMPAIGNS;
  }
}

export function saveCampaignsToStore(campaigns: AdCampaignItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
    window.dispatchEvent(new Event('nexora_sponsored_campaigns_updated'));
  } catch (err) {
    console.error('Failed to save campaigns to localStorage:', err);
  }
}

export function saveSingleCampaign(campaign: AdCampaignItem): void {
  const current = getStoredCampaigns();
  const index = current.findIndex(c => c.id === campaign.id);
  let updated: AdCampaignItem[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = campaign;
  } else {
    updated = [campaign, ...current];
  }
  saveCampaignsToStore(updated);
}

export function toggleCampaignStatus(campaignId: string): AdCampaignItem[] {
  const current = getStoredCampaigns();
  const updated = current.map(c => {
    if (c.id === campaignId) {
      if (c.status === 'paused_product_unavailable') {
        // cannot resume without re-linking an available product
        return c;
      }
      const nextStatus: AdCampaignItem['status'] = c.status === 'active' ? 'paused' : 'active';
      return { ...c, status: nextStatus };
    }
    return c;
  });
  saveCampaignsToStore(updated);
  return updated;
}

export function deleteCampaignFromStore(campaignId: string): AdCampaignItem[] {
  const current = getStoredCampaigns();
  const updated = current.filter(c => c.id !== campaignId);
  saveCampaignsToStore(updated);
  return updated;
}

export function getAdAccountBalance(): number {
  try {
    const val = localStorage.getItem(BALANCE_KEY);
    if (val === null) {
      localStorage.setItem(BALANCE_KEY, '41000'); // ₹41,000 (~$500)
      return 41000;
    }
    return parseFloat(val) || 0;
  } catch {
    return 41000;
  }
}

export function setAdAccountBalance(amount: number): number {
  try {
    localStorage.setItem(BALANCE_KEY, amount.toString());
    window.dispatchEvent(new Event('nexora_sponsored_campaigns_updated'));
  } catch {}
  return amount;
}

export function addAdAccountBalance(amount: number): number {
  const current = getAdAccountBalance();
  const newBal = current + amount;
  return setAdAccountBalance(newBal);
}

export function recordAdClickInStore(adId: string): void {
  const current = getStoredCampaigns();
  const updated = current.map(c => {
    if (c.id === adId || c.product_id === adId) {
      const clicks = c.clicks + 1;
      const productClicks = (c.productClicks || 0) + 1;
      const impressions = Math.max(c.impressions, clicks + 10);
      const ctr = parseFloat(((clicks / impressions) * 100).toFixed(2));
      return { ...c, clicks, productClicks, impressions, ctr };
    }
    return c;
  });
  saveCampaignsToStore(updated);
}

/**
 * Auto-validation & Reconciliation function:
 * Checks if linked products are unlisted, out-of-stock, or deleted.
 * If product unavailable, flips active campaign to 'paused_product_unavailable'.
 */
export function reconcileProductAvailability(): {
  pausedCount: number;
  pausedCampaigns: AdCampaignItem[];
} {
  const current = getStoredCampaigns();
  let pausedCount = 0;
  const pausedCampaigns: AdCampaignItem[] = [];

  const updated = current.map(c => {
    if (c.targetType === 'product' && c.product_id) {
      const product = SPONSORED_PRODUCTS_DB[c.product_id];
      const isUnavailable = !product || !product.isPublished || product.isSuspended;

      if (isUnavailable && c.status === 'active') {
        pausedCount++;
        const modified: AdCampaignItem = {
          ...c,
          status: 'paused_product_unavailable'
        };
        pausedCampaigns.push(modified);
        return modified;
      }
    }
    return c;
  });

  if (pausedCount > 0) {
    saveCampaignsToStore(updated);
  }

  return { pausedCount, pausedCampaigns };
}
