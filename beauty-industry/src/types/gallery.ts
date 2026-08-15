export type SalonTheme = 
  | 'barber' 
  | 'hair_studio' 
  | 'beauty_spa' 
  | 'family' 
  | 'nail_lash';

export type GalleryStatus = 
  | 'pending' 
  | 'published' 
  | 'rejected' 
  | 'unpublished';

export type MediaType = 'image' | 'before_after';

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  theme: SalonTheme;
  category: string;
  linkedServiceId: string;
  linkedServiceName: string;
  linkedServiceTheme: SalonTheme; // Must match item theme for valid publish
  salonId: string;
  salonName: string;
  mediaType: MediaType;
  imageUrl: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  uploadedBy: {
    id: string;
    name: string;
    role: 'customer' | 'staff' | 'owner' | 'admin';
  };
  uploadedAt: string;
  status: GalleryStatus;
  reviewedBy?: {
    id: string;
    name: string;
    role: 'owner' | 'admin';
  };
  reviewedAt?: string;
  rejectionReason?: string;
  likesCount: number;
}

export interface LinkedServiceOption {
  id: string;
  name: string;
  theme: SalonTheme;
  category: string;
  price: number;
}

export interface SalonThemeInfo {
  id: SalonTheme;
  name: string;
  tagline: string;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
  iconName: string;
  description: string;
  categories: string[];
}
