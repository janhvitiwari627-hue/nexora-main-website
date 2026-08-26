export interface RFQItem {
  id: string;
  buyerLocation: string;
  isVerifiedBuyer: boolean;
  timeAgo: string;
  title: string;
  description: string;
  quantityRequired: string;
  targetPrice?: string;
  category: string;
}

export interface DealProduct {
  id: string;
  title: string;
  supplierName: string;
  supplierLocation: string;
  isVerified: boolean;
  discountPercentage: number;
  bulkTierLabel: string;
  estimatedDelivery: string;
  originalPrice: string;
  dealPrice: string;
  moq: string;
  image: string;
  tags: string[];
}

export interface TrendingProduct {
  id: string;
  title: string;
  supplierName: string;
  supplierLocation: string;
  isGstVerified: boolean;
  isIsoCertified: boolean;
  moq: string;
  priceRange: string;
  image: string;
  category: string;
}

export interface LogisticsHub {
  id: string;
  name: string;
  type: 'Port' | 'Airport' | 'Corridor' | 'Chemical Hub' | 'Packaging Cluster' | 'Dry Port / ICD';
  distanceKm: number;
  transitTime: string;
  category?: string;
  description: string;
  coords: { x: number; y: number }; // Relative percentage on the schematic map (0-100)
}

export interface SupplierLocationDetails {
  industrialZone: string;
  fullAddress: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  shippingHubs: LogisticsHub[];
  rawMaterialSources: LogisticsHub[];
  customsStatus: string;
  dispatchTurnaround: string;
  coldChainAvailable: boolean;
  transitAdvantage: string;
}

export interface ComplianceReport {
  id: string;
  title: string;
  category: 'ISO Certificate' | 'Lab Test Result' | 'Audit Summary' | 'Regulatory Approval' | 'GMP Compliance' | 'COA & Stability';
  fileSize: string;
  issueDate: string;
  validUntil?: string;
  issuedBy: string;
  downloadUrl?: string;
  summary: string;
  accreditationNumber?: string;
  status: 'Verified' | 'Active' | 'Audit Passed';
}

export interface PortfolioProduct {
  id: string;
  name: string;
  image: string;
  price: string;
  moq: string;
}

export interface VerifiedSupplier {
  id: string;
  name: string;
  shortCode: string;
  type: string;
  city: string;
  state?: string;
  isVerified: boolean;
  isGstVerified: boolean;
  isIsoCertified: boolean;
  isBusinessVerified?: boolean;
  isGmpCertified?: boolean;
  isFdaRegistered?: boolean;
  categories: string[];
  specialties?: string[];
  phone: string;
  whatsapp: string;
  responseRate: string;
  trustScore: number;
  reliabilityRating: number;
  productQualityRating?: number;
  overallRating?: number;
  totalReviewsCount?: number;
  responseScore: number;
  responseTimeText: string;
  exportReadiness: number;
  exportCertifications?: string;
  establishedYear?: string;
  establishedYearNumber?: number;
  employeeCount?: string;
  employeeCountNumber?: number;
  minOrderValue?: string;
  sampleLeadTime?: string;
  monthlyCapacity?: string;
  facilityArea?: string;
  moq?: string;
  verificationBadge?: string;
  certificationsList?: string[];
  locationDetails?: SupplierLocationDetails;
  portfolioProducts?: PortfolioProduct[];
  complianceReports?: ComplianceReport[];
}

export interface SearchProduct {
  id: string;
  title: string;
  supplierName: string;
  supplierLocation: string;
  supplierType?: string;
  isGstVerified: boolean;
  isIsoCertified: boolean;
  isNexoraVerified?: boolean;
  isBusinessVerified?: boolean;
  isGmpCertified?: boolean;
  isHalalCertified?: boolean;
  isOrganicCertified?: boolean;
  isFdaRegistered?: boolean;
  isCrueltyFree?: boolean;
  rating?: number;
  establishedYear?: string;
  establishedYearNumber?: number;
  employeeCount?: string;
  moq: string;
  moqNumber: number;
  priceRange: string;
  priceMin: number;
  priceMax: number;
  bulkTierText?: string;
  responseTime: string;
  certifications: string[];
  image: string;
  category: string;
  specs?: {
    formulationBase?: string;
    packagingType?: string;
    shelfLife?: string;
    sampleLeadTime?: string;
    productionCapacity?: string;
    compliance?: string;
  };
}

export interface SearchSupplier {
  id: string;
  name: string;
  shortCode: string;
  type: string;
  city: string;
  state: string;
  rating: number;
  trustScore: number;
  overallRating?: number;
  reliabilityRating?: number;
  responseScore?: number;
  responseRate: string;
  responseTime: string;
  responseTimeText?: string;
  specialties?: string[];
  exportCertifications?: string;
  exportReadiness?: string;
  facilityArea?: string;
  monthlyCapacity?: string;
  sampleLeadTime?: string;
  isGstVerified: boolean;
  isIsoCertified: boolean;
  isNexoraVerified: boolean;
  isBusinessVerified?: boolean;
  isGmpCertified?: boolean;
  isHalalCertified?: boolean;
  isOrganicCertified?: boolean;
  isFdaRegistered?: boolean;
  isCrueltyFree?: boolean;
  establishedYear?: string;
  establishedYearNumber?: number;
  employeeCount?: string;
  employeeCountNumber?: number;
  certificationsList?: string[];
  exportReady: boolean;
  categories: string[];
  totalProductsCount: number;
  minOrderValue: string;
  phone: string;
  whatsapp: string;
  locationDetails?: SupplierLocationDetails;
}

export interface OEMFormulation {
  id: string;
  title: string;
  developer: string;
  location: string;
  developmentType: string;
  batchCapacity: string;
  moq: string;
  targetPrice: string;
  testingIncluded: string;
  image: string;
  tags: string[];
  isGstVerified: boolean;
  isIsoCertified: boolean;
}

export interface AppNotification {
  id: string;
  type: 'rfq_response' | 'quote_update' | 'message' | 'verification' | 'sample' | 'system';
  title: string;
  description: string;
  timestamp: string;
  timeAgo: string;
  isRead: boolean;
  priority?: 'high' | 'medium' | 'low';
  targetScreen?: string;
  targetParams?: any;
  sender?: {
    name: string;
    avatar?: string;
    isVerified?: boolean;
    location?: string;
  };
  metadata?: {
    rfqId?: string;
    quoteId?: string;
    price?: string;
    quantity?: string;
    supplierName?: string;
    productName?: string;
    trackingNumber?: string;
  };
}

export interface CategoryItem {
  id: string;
  name: string;
  iconName: string;
  image?: string;
  itemCount?: string;
  subtitle?: string;
  isHighlighted?: boolean;
}

export interface BuyerEnquiry {
  id: string;
  productName: string;
  supplierName: string;
  date: string;
  status: 'Pending' | 'Responded' | 'Quoted' | 'Closed';
  subject: string;
  lastMessage?: string;
}

export interface BuyerRFQ {
  id: string;
  title: string;
  category: string;
  quantity: string;
  postedDate: string;
  expiryDate: string;
  responsesCount: number;
  status: 'Active' | 'Paused' | 'Expired' | 'Converted';
  description?: string;
}

export type VideoPlatform = 'YouTube' | 'Instagram' | 'Facebook' | 'X' | 'LinkedIn';

export interface SponsoredVideoItem {
  video_ad_id: string;
  advertiser_id: string;
  seller_id: string;
  product_id?: string;
  platform: VideoPlatform;
  source_url: string;
  media_type: 'reel_or_short' | 'full_video';
  poster_url: string;
  display_title: string;
  display_description: string;
  supplierName: string;
  duration?: string;
  status: 'active' | 'disabled' | 'paused' | 'draft' | 'paused_product_unavailable' | 'budget_depleted' | 'completed';
  embed_url?: string;
}

export type SponsoredReelItem = SponsoredVideoItem;

export interface SponsoredAdItem {
  id: string;
  advertiser_id: string;
  seller_id: string;
  product_id: string;
  supplierName: string;
  adTitle: string;
  subtitle: string;
  imageUrl: string;
  status: 'active' | 'disabled' | 'paused' | 'draft' | 'paused_product_unavailable' | 'budget_depleted' | 'completed';
}

export interface ProductDetailData {
  id: string;
  seller_id: string;
  advertiser_id?: string;
  title: string;
  supplierName: string;
  supplierLocation: string;
  supplierType: string;
  isGstVerified: boolean;
  isIsoCertified: boolean;
  isNexoraVerified: boolean;
  isBusinessVerified: boolean;
  isPublished: boolean;
  isSuspended?: boolean;
  moq: string;
  priceRange: string;
  priceMin: number;
  priceMax: number;
  bulkTiers: { quantityRange: string; unitPrice: string }[];
  category: string;
  subcategory?: string;
  description: string;
  images: string[];
  specs: {
    formulationBase?: string;
    packagingType?: string;
    shelfLife?: string;
    sampleLeadTime?: string;
    productionCapacity?: string;
    certifications?: string[];
  };
  sellerDetails: {
    phone: string;
    whatsapp: string;
    email: string;
    trustScore: number;
    responseRate: string;
    establishedYear: string;
    facilityArea: string;
  };
}


