export type AnalyticsEventType =
  | 'ad_impression'
  | 'video_open'
  | 'video_play'
  | 'video_25_percent'
  | 'video_50_percent'
  | 'video_75_percent'
  | 'video_complete'
  | 'product_click'
  | 'supplier_click'
  | 'enquire_click'
  | 'external_platform_click';

export interface SponsoredAnalyticsEvent {
  id: string;
  timestamp: number;
  eventType: AnalyticsEventType;
  ad_id: string;
  seller_id: string;
  product_id?: string;
  media_type: 'image_ad' | 'reel_or_short' | 'full_video';
  platform?: string;
  supplierName?: string;
}

const ANALYTICS_STORAGE_KEY = 'nexora_sponsored_analytics';

export function recordSponsoredAnalyticsEvent(
  eventType: AnalyticsEventType,
  details: {
    ad_id: string;
    seller_id: string;
    product_id?: string;
    media_type: 'image_ad' | 'reel_or_short' | 'full_video';
    platform?: string;
    supplierName?: string;
  }
): void {
  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    const existing: SponsoredAnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    
    const newEvent: SponsoredAnalyticsEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      eventType,
      ...details
    };

    // Store up to 1000 latest events for Screen 25 analytics calculation
    const updated = [newEvent, ...existing].slice(0, 1000);
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('nexora_analytics_event_recorded', { detail: newEvent }));
  } catch (err) {
    console.error('Failed to record analytics event', err);
  }
}

export function getStoredSponsoredAnalyticsEvents(): SponsoredAnalyticsEvent[] {
  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
