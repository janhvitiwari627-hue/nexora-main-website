export type CategoryId =
  | 'skincare'
  | 'haircare'
  | 'haircolor'
  | 'makeup'
  | 'nails'
  | 'spa'
  | 'massage'
  | 'tattoo'
  | 'furniture'
  | 'tools'
  | 'backbar'
  | 'aesthetic';

export interface Category {
  id: CategoryId;
  name: string;
  subtext?: string;
  iconName: string;
  itemCount: number;
  featuredImg?: string;
}

export interface WholesaleTier {
  minUnits: number;
  pricePerUnit: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: CategoryId;
  categoryLabel: string;
  tag: string;
  isVerified: boolean;
  isWholesale: boolean;
  price: number;
  unit: string;
  moq: number;
  stockStatus: 'In Stock' | 'Low Stock' | 'Made to Order' | 'Out of Stock' | 'Available on Request';
  status?: 'Draft' | 'Published' | 'Out of Stock' | 'Available on Request' | 'Archived';
  image: string;
  gallery?: string[];
  description: string;
  specifications: Record<string, string>;
  leadTimeDays: number;
  certifications: string[];
  supplierId: string;
  supplierName: string;
  supplierLocation: string;
  rating?: number;
  reviewsCount?: number;
  wholesaleTiers?: WholesaleTier[];
}

export interface SupplierPartner {
  id: string;
  initials: string;
  name: string;
  type: 'Wholesaler' | 'Manufacturer' | 'Distributor';
  location: string;
  region: string;
  verified: boolean;
  isFree: boolean;
  tags: string[];
  rating: number;
  reviewsCount: number;
  productCount: number;
  responseRate: string;
  minOrderValue: number;
  description: string;
  email: string;
  phone: string;
  establishedYear: number;
  coverImage?: string;
  sampleImages?: string[];
  whatsapp?: string;
  businessTypeDetail?: string;
}

export interface QuoteItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  companyName: string;
  role: string;
  city: string;
  isVerified: boolean;
  avatarUrl?: string;
}

export interface InquiryForm {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  businessType: 'Salon' | 'Spa' | 'Retailer' | 'Dermatology Clinic' | 'Independent Artist';
  city: string;
  quantity: number;
  notes: string;
  requestSample: boolean;
}

export interface PriceAlertPreference {
  productId: string;
  productName: string;
  brand: string;
  currentPrice: number;
  enabled: boolean;
  subscribedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'supplier';
  text: string;
  timestamp: string;
  productContext?: {
    id: string;
    name: string;
    brand: string;
    image: string;
    price: number;
    moq: number;
  };
  attachments?: {
    name: string;
    size: string;
    type: 'pdf' | 'doc' | 'image';
  }[];
}

export interface SupplierConversation {
  supplierId: string;
  supplierName: string;
  messages: ChatMessage[];
  unreadCount: number;
  lastUpdated: string;
}

export interface VideoTestimonial {
  id: string;
  title: string;
  distributorId: string;
  distributorName: string;
  distributorLocation: string;
  distributorInitials: string;
  distributorVerified: boolean;
  speakerName: string;
  speakerRole: string;
  salonOrBusiness: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
  viewsCount: number;
  likesCount: number;
  rating: number;
  featuredProductId?: string;
  featuredProductName?: string;
  featuredProductImage?: string;
  featuredProductPrice?: number;
  featuredProductMoq?: number;
  category: string;
  tags: string[];
  keyHighlight: string;
  quote: string;
  date: string;
}

