// ============================================================================
// NEXORA LUXE - PHASE 4 RELATIONAL DATABASE SCHEMA & ENTITY DEFINITIONS
// ============================================================================

export type UserRole = 'guest' | 'buyer' | 'supplier' | 'admin';

export interface DBUser {
  id: string; // UUID Primary Key
  email: string;
  phone: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type BuyerBusinessType = 'Salon' | 'Spa' | 'Retailer' | 'Distributor' | 'Brand Owner' | 'Cosmetic Clinic' | 'E-commerce Brand';

export interface DBProfileBuyer {
  id: string; // Primary Key
  user_id: string; // FK to DBUser
  contact_name: string;
  company_name: string;
  business_type: BuyerBusinessType;
  city: string;
  state: string;
  pincode: string;
  address: string;
  gst_number?: string;
  target_categories: string[];
  annual_budget?: string;
  requirements_posted_count: number;
  created_at: string;
  updated_at: string;
}

export type SupplierBusinessType = 'Manufacturer' | 'Wholesaler' | 'OEM' | 'Private Label' | 'Distributor' | 'Contract Manufacturer';
export type SupplierVerificationLevel = 'Basic' | 'Business Verified' | 'Nexora Verified';
export type SupplierOnboardingStatus = 'business_pending' | 'catalog_pending' | 'review' | 'approved' | 'rejected';

export interface DBProfileSupplier {
  id: string; // Primary Key
  user_id: string; // FK to DBUser
  company_name: string;
  slug: string;
  logo_url: string;
  cover_image_url: string;
  business_type: SupplierBusinessType;
  verification_level: SupplierVerificationLevel;
  gst_number: string;
  year_established: string;
  employee_count: string;
  service_areas: string[];
  categories: string[];
  response_rate: number; // e.g. 98 (%)
  avg_response_time: number; // e.g. 1.8 (hours)
  profile_completion_pct: number; // e.g. 95 (%)
  trust_score: number;
  phone: string;
  whatsapp: string;
  city: string;
  state: string;
  address: string;
  is_verified: boolean;
  is_gst_verified: boolean;
  is_iso_certified: boolean;
  onboarding_status: SupplierOnboardingStatus;
  reviewed_at: string | null;
  approved_at: string | null;
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductStatus = 'draft' | 'active' | 'inactive' | 'rejected';

export interface DBProduct {
  id: string; // Primary Key
  supplier_id: string; // FK to DBProfileSupplier
  title: string;
  slug: string;
  category_id: string;
  brand_name: string;
  description: string;
  images: string[];
  specifications: {
    formulationBase?: string;
    packagingType?: string;
    shelfLife?: string;
    sampleLeadTime?: string;
    productionCapacity?: string;
    certifications?: string[];
    [key: string]: any;
  };
  moq: number;
  moq_unit: string; // 'Units', 'Bottles', 'Kg', 'Pcs'
  unit_price: number; // Base wholesale price in INR
  bulk_price_slabs: Array<{
    min_qty: number;
    max_qty?: number;
    price_per_unit: number;
  }>;
  lead_time_days: number;
  status: ProductStatus;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
}

export type RFQStatus = 'new' | 'responded' | 'negotiating' | 'closed';
export type RFQType = 'direct_enquiry' | 'public_rfq';

export interface DBRFQEnquiry {
  id: string; // Primary Key
  buyer_id: string; // FK to DBProfileBuyer
  supplier_id: string | null; // FK to DBProfileSupplier, null for public RFQs
  product_id?: string | null; // FK to DBProduct, optional
  requirement_title: string;
  category: string;
  quantity_required: number;
  quantity_unit: string;
  target_budget?: number;
  delivery_location: string;
  details: string;
  attachments: string[];
  status: RFQStatus;
  type: RFQType;
  send_to_similar_suppliers?: boolean;
  matched_supplier_ids?: string[];
  created_at: string;
  updated_at: string;
}

export type QuoteStatus = 'submitted' | 'accepted' | 'rejected' | 'negotiating';

export interface DBQuote {
  id: string; // Primary Key
  rfq_id: string; // FK to DBRFQEnquiry
  supplier_id: string; // FK to DBProfileSupplier
  unit_price: number;
  total_price: number;
  moq_offered: number;
  lead_time: string; // e.g. '7-10 Business Days'
  validity_date: string; // ISO string
  terms_and_conditions: string;
  attachment_url?: string;
  status: QuoteStatus;
  sample_available: boolean;
  sample_cost?: number;
  notes?: string;
  counter_offer_price?: number;
  counter_offer_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DBMessage {
  id: string; // Primary Key
  conversation_id: string;
  sender_id: string; // FK to DBUser
  receiver_id: string; // FK to DBUser
  rfq_id?: string;
  product_id?: string;
  message_body: string;
  attachments: string[];
  sent_at: string;
  is_read: boolean;
}

export type FollowUpStatus = 'pending' | 'completed' | 'snoozed';

export interface DBFollowUp {
  id: string; // Primary Key
  supplier_id: string; // FK to DBProfileSupplier
  buyer_id: string; // FK to DBProfileBuyer
  rfq_id: string; // FK to DBRFQEnquiry
  remind_at: string;
  note: string;
  status: FollowUpStatus;
  created_at: string;
  updated_at: string;
}

// Joined / Populated Views for High-Performance UI Rendering
export interface PopulatedRFQEnquiry extends DBRFQEnquiry {
  buyer?: DBProfileBuyer;
  supplier?: DBProfileSupplier | null;
  product?: DBProduct | null;
  quotes?: DBQuote[];
  quotes_count?: number;
}

export interface PopulatedQuote extends DBQuote {
  supplier?: DBProfileSupplier;
  rfq?: DBRFQEnquiry;
}

export interface PopulatedProduct extends DBProduct {
  supplier?: DBProfileSupplier;
}

// 9. USER_LOCATIONS TABLE (authenticated live coordinate sync)
export interface DBUserLocation {
  user_id: string; // FK to auth.users(id)
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  source: string;
  is_active: boolean;
  captured_at: string;
  updated_at: string;
  last_synced_at: string;
}
