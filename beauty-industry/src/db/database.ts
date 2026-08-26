// ============================================================================
// NEXORA LUXE - PHASE 4 RELATIONAL DATABASE REPOSITORY & STORE ENGINE
// ============================================================================

import {
  DBUser,
  DBProfileBuyer,
  DBProfileSupplier,
  DBProduct,
  DBRFQEnquiry,
  DBQuote,
  DBMessage,
  DBFollowUp,
  PopulatedRFQEnquiry,
  PopulatedQuote,
  PopulatedProduct,
  UserRole
} from './types';

const DB_STORAGE_KEY = 'nexora_relational_database_v4';

export interface DatabaseState {
  users: DBUser[];
  profiles_buyer: DBProfileBuyer[];
  profiles_supplier: DBProfileSupplier[];
  products: DBProduct[];
  rfqs_enquiries: DBRFQEnquiry[];
  quotes: DBQuote[];
  messages: DBMessage[];
  follow_ups: DBFollowUp[];
}

// Initial Seed Data for Phase 4
const SEED_USERS: DBUser[] = [
  {
    id: 'usr-buyer-priya',
    email: 'priya.procurement@radiantbeauty.in',
    phone: '+91 98201 54321',
    password_hash: 'scrypt_hashed_password_buyer_priya',
    role: 'buyer',
    created_at: '2026-01-10T09:00:00.000Z',
    updated_at: '2026-08-15T14:30:00.000Z'
  },
  {
    id: 'usr-supp-aura',
    email: 'b2b@aurabeautylabs.com',
    phone: '+91 98450 11223',
    password_hash: 'scrypt_hashed_password_aura_labs',
    role: 'supplier',
    created_at: '2025-11-20T10:00:00.000Z',
    updated_at: '2026-08-16T11:20:00.000Z'
  },
  {
    id: 'usr-supp-dermaglow',
    email: 'oem@dermaglowlabs.in',
    phone: '+91 98110 44556',
    password_hash: 'scrypt_hashed_password_dermaglow',
    role: 'supplier',
    created_at: '2025-08-14T08:00:00.000Z',
    updated_at: '2026-08-12T16:45:00.000Z'
  },
  {
    id: 'usr-supp-luxeform',
    email: 'sales@luxeformcosmetics.com',
    phone: '+91 98720 99887',
    password_hash: 'scrypt_hashed_password_luxeform',
    role: 'supplier',
    created_at: '2025-09-01T12:00:00.000Z',
    updated_at: '2026-08-14T09:15:00.000Z'
  },
  {
    id: 'usr-admin-master',
    email: 'admin@nexoraluxe.com',
    phone: '+91 99000 00001',
    password_hash: 'scrypt_hashed_password_nexora_admin',
    role: 'admin',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2026-08-01T00:00:00.000Z'
  }
];

const SEED_PROFILES_BUYER: DBProfileBuyer[] = [
  {
    id: 'buyer-prof-priya',
    user_id: 'usr-buyer-priya',
    contact_name: 'Priya Sharma',
    company_name: 'Radiant Beauty Solutions & Spa Chain',
    business_type: 'Salon',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    address: 'Plot 42, Bandra West Business Enclave, Mumbai',
    gst_number: '27AABCR1234F1Z8',
    target_categories: ['Skincare & Serums', 'Professional Haircare', 'Salon Equipment', 'Private Label Formulations'],
    annual_budget: '₹25L - ₹50L',
    requirements_posted_count: 14,
    created_at: '2026-01-10T09:15:00.000Z',
    updated_at: '2026-08-15T14:30:00.000Z'
  }
];

const SEED_PROFILES_SUPPLIER: DBProfileSupplier[] = [
  {
    id: 'supp-aura-labs',
    user_id: 'usr-supp-aura',
    company_name: 'Aura Beauty Labs & Formulations',
    slug: 'aura-beauty-labs',
    logo_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80',
    cover_image_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1200&q=80',
    business_type: 'Manufacturer',
    verification_level: 'Nexora Verified',
    gst_number: '29AAGCA8899K1Z4',
    year_established: '2016',
    employee_count: '150-250 Employees',
    service_areas: ['Pan India', 'Middle East Export', 'Southeast Asia'],
    categories: ['Skincare & Serums', 'OEM / Private Label', 'Cosmeceuticals', 'Organic Formulations'],
    response_rate: 99,
    avg_response_time: 1.2,
    profile_completion_pct: 98,
    trust_score: 96,
    phone: '+91 98450 11223',
    whatsapp: '+91 98450 11223',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: 'Plot 18, Peenya Industrial Area Phase 3, Bengaluru',
    is_verified: true,
    is_gst_verified: true,
    is_iso_certified: true,
    onboarding_status: 'approved',
    reviewed_at: '2025-11-20T10:30:00.000Z',
    approved_at: '2025-11-20T10:30:00.000Z',
    verification_notes: null,
    created_at: '2025-11-20T10:30:00.000Z',
    updated_at: '2026-08-16T11:20:00.000Z'
  },
  {
    id: 'supp-dermaglow',
    user_id: 'usr-supp-dermaglow',
    company_name: 'Dermaglow India Biocare',
    slug: 'dermaglow-india',
    logo_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=200&q=80',
    cover_image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=1200&q=80',
    business_type: 'OEM',
    verification_level: 'Nexora Verified',
    gst_number: '07AAACD4433P1Z9',
    year_established: '2012',
    employee_count: '300+ Employees',
    service_areas: ['Pan India', 'Global Exports'],
    categories: ['Clinical Actives', 'Hair Treatments', 'Dermatology Grade Formulations'],
    response_rate: 96,
    avg_response_time: 2.1,
    profile_completion_pct: 94,
    trust_score: 93,
    phone: '+91 98110 44556',
    whatsapp: '+91 98110 44556',
    city: 'New Delhi',
    state: 'Delhi',
    address: 'Okhla Industrial Area Phase 2, New Delhi',
    is_verified: true,
    is_gst_verified: true,
    is_iso_certified: true,
    onboarding_status: 'approved',
    reviewed_at: '2025-11-20T10:30:00.000Z',
    approved_at: '2025-11-20T10:30:00.000Z',
    verification_notes: null,
    created_at: '2025-08-14T08:30:00.000Z',
    updated_at: '2026-08-12T16:45:00.000Z'
  },
  {
    id: 'supp-luxeform',
    user_id: 'usr-supp-luxeform',
    company_name: 'LuxeForm Cosmetics & Packaging',
    slug: 'luxeform-cosmetics',
    logo_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&q=80',
    cover_image_url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=1200&q=80',
    business_type: 'Private Label',
    verification_level: 'Business Verified',
    gst_number: '27AALCL9988C1Z2',
    year_established: '2019',
    employee_count: '80-120 Employees',
    service_areas: ['Western India', 'South India'],
    categories: ['Eco Packaging', 'Lipcare & Colour Cosmetics', 'Botanical Serums'],
    response_rate: 94,
    avg_response_time: 3.0,
    profile_completion_pct: 90,
    trust_score: 89,
    phone: '+91 98720 99887',
    whatsapp: '+91 98720 99887',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Chakan Industrial Corridor, Pune',
    is_verified: true,
    is_gst_verified: true,
    is_iso_certified: true,
    onboarding_status: 'approved',
    reviewed_at: '2025-11-20T10:30:00.000Z',
    approved_at: '2025-11-20T10:30:00.000Z',
    verification_notes: null,
    created_at: '2025-09-01T12:30:00.000Z',
    updated_at: '2026-08-14T09:15:00.000Z'
  }
];

const SEED_PRODUCTS: DBProduct[] = [
  {
    id: 'prod-vit-c-serum',
    supplier_id: 'supp-aura-labs',
    title: 'Private Label 15% 3-O-Ethyl Ascorbic Acid Vitamin C Serum',
    slug: 'private-label-vitamin-c-serum',
    category_id: 'skincare',
    brand_name: 'Aura Derma Professional',
    description: 'Stabilized 15% Vitamin C formulation blended with 1% Ferulic Acid and Botanical Hyaluronic Acid in amber dropper bottles with customized primary and secondary branding.',
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1608248597359-00270a4843b0?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      formulationBase: 'Aqueous Non-Comedogenic',
      packagingType: '30ml UV-Coated Amber Glass Dropper Bottle',
      shelfLife: '24 Months (GMP Certified)',
      sampleLeadTime: '3-4 Business Days',
      productionCapacity: '150,000 Units / Month',
      certifications: ['ISO 22716:2007 (GMP)', 'Cruelty-Free', 'Dermatologist Tested']
    },
    moq: 500,
    moq_unit: 'Units',
    unit_price: 185,
    bulk_price_slabs: [
      { min_qty: 500, max_qty: 1999, price_per_unit: 185 },
      { min_qty: 2000, max_qty: 4999, price_per_unit: 165 },
      { min_qty: 5000, price_per_unit: 145 }
    ],
    lead_time_days: 14,
    status: 'active',
    is_featured: true,
    created_at: '2026-02-01T10:00:00.000Z',
    updated_at: '2026-08-10T12:00:00.000Z'
  },
  {
    id: 'prod-peptide-barrier-cream',
    supplier_id: 'supp-aura-labs',
    title: 'Multi-Peptide Ceramide Barrier Recovery Cream',
    slug: 'multi-peptide-ceramide-barrier-cream',
    category_id: 'skincare',
    brand_name: 'Aura BioClinical',
    description: 'Triple Ceramide NP/AP/EOP emulsion enriched with 5 Oligopeptides for barrier restoration and post-chemical-peel recovery.',
    images: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      formulationBase: 'Liposomal Lamellar Emulsion',
      packagingType: '50g Airless Pump Jar',
      shelfLife: '30 Months',
      sampleLeadTime: '4 Business Days',
      productionCapacity: '90,000 Jars / Month',
      certifications: ['GMP Compliant', 'EcoCert Ingredients']
    },
    moq: 1000,
    moq_unit: 'Jars',
    unit_price: 240,
    bulk_price_slabs: [
      { min_qty: 1000, max_qty: 2999, price_per_unit: 240 },
      { min_qty: 3000, price_per_unit: 210 }
    ],
    lead_time_days: 18,
    status: 'active',
    is_featured: true,
    created_at: '2026-02-15T11:00:00.000Z',
    updated_at: '2026-08-12T15:00:00.000Z'
  },
  {
    id: 'prod-keratin-hair-mask',
    supplier_id: 'supp-dermaglow',
    title: 'Hydrolyzed Keratin & Argan Intensive Salon Hair Mask',
    slug: 'keratin-argan-salon-hair-mask',
    category_id: 'haircare',
    brand_name: 'Dermaglow ProHair',
    description: 'Concentrated salon formulation with Brazilian Hydrolyzed Keratin, Cold-Pressed Argan Oil, and Amino Acid Complex for salon treatment backbars.',
    images: [
      'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      formulationBase: 'Cream Rinse-Off Emulsion',
      packagingType: '500ml HDPE Salon Tub / 5L Bulk Jerrican',
      shelfLife: '24 Months',
      sampleLeadTime: '2-3 Business Days',
      productionCapacity: '50,000 Liters / Month',
      certifications: ['GMP Certified', 'Sulfate & Paraben Free']
    },
    moq: 300,
    moq_unit: 'Units',
    unit_price: 320,
    bulk_price_slabs: [
      { min_qty: 300, max_qty: 999, price_per_unit: 320 },
      { min_qty: 1000, price_per_unit: 275 }
    ],
    lead_time_days: 10,
    status: 'active',
    is_featured: false,
    created_at: '2026-03-01T09:00:00.000Z',
    updated_at: '2026-08-05T14:00:00.000Z'
  }
];

const SEED_RFQS_ENQUIRIES: DBRFQEnquiry[] = [
  {
    id: 'rfq-2026-8801',
    buyer_id: 'buyer-prof-priya',
    supplier_id: 'supp-aura-labs',
    product_id: 'prod-vit-c-serum',
    requirement_title: 'Bulk Sourcing: 2,000 Units Vitamin C 15% Serum with Custom Screen Printing',
    category: 'Skincare & Serums',
    quantity_required: 2000,
    quantity_unit: 'Units',
    target_budget: 360000, // ₹3,60,000 total (target ₹180/unit)
    delivery_location: 'Mumbai Central Warehouse, Maharashtra',
    details: 'Need 15% 3-O-Ethyl Ascorbic Acid serum with custom metallic rose gold dropper caps, 30ml amber bottle, dual-language label (English/Hindi), and full batch COA test reports for clinic retail.',
    attachments: ['spec_sheet_formulation_v2.pdf', 'packaging_artwork_dieline.ai'],
    status: 'negotiating',
    type: 'direct_enquiry',
    send_to_similar_suppliers: true,
    matched_supplier_ids: ['supp-aura-labs', 'supp-dermaglow', 'supp-luxeform'],
    created_at: '2026-08-10T14:30:00.000Z',
    updated_at: '2026-08-16T17:45:00.000Z'
  },
  {
    id: 'rfq-2026-9420',
    buyer_id: 'buyer-prof-priya',
    supplier_id: null, // Public RFQ distributed to marketplace
    product_id: null,
    requirement_title: 'Custom OEM Formulation: Hyaluronic Acid Micro-Mist Toner 100ml',
    category: 'OEM / Private Label',
    quantity_required: 5000,
    quantity_unit: 'Bottles',
    target_budget: 650000,
    delivery_location: 'Pune Regional Sourcing Hub',
    details: 'Looking for contract manufacturer with continuous fine-spray aluminum or PET bottle capabilities, 0.5% Multi-Molecular HA, Rose Hydrosol base.',
    attachments: ['mist_toner_target_spec.pdf'],
    status: 'responded',
    type: 'public_rfq',
    send_to_similar_suppliers: true,
    matched_supplier_ids: ['supp-aura-labs', 'supp-luxeform'],
    created_at: '2026-08-12T10:00:00.000Z',
    updated_at: '2026-08-15T11:20:00.000Z'
  },
  {
    id: 'rfq-2026-7712',
    buyer_id: 'buyer-prof-priya',
    supplier_id: 'supp-dermaglow',
    product_id: 'prod-keratin-hair-mask',
    requirement_title: 'Salon Backbar Supply: 500 Jars Keratin Deep Conditioning Mask 500g',
    category: 'Haircare',
    quantity_required: 500,
    quantity_unit: 'Jars',
    target_budget: 140000,
    delivery_location: 'Mumbai Salon Branches',
    details: 'Urgent procurement for 8 salon locations. High fragrance retention and smoothing effect needed.',
    attachments: [],
    status: 'new',
    type: 'direct_enquiry',
    send_to_similar_suppliers: false,
    matched_supplier_ids: ['supp-dermaglow'],
    created_at: '2026-08-16T08:30:00.000Z',
    updated_at: '2026-08-16T08:30:00.000Z'
  }
];

const SEED_QUOTES: DBQuote[] = [
  {
    id: 'quote-aura-8801',
    rfq_id: 'rfq-2026-8801',
    supplier_id: 'supp-aura-labs',
    unit_price: 175,
    total_price: 350000,
    moq_offered: 2000,
    lead_time: '12 Business Days',
    validity_date: '2026-09-15T23:59:59.000Z',
    terms_and_conditions: '50% Advance with Purchase Order, 50% prior to dispatch from Bengaluru plant. Includes batch testing COA and stability report.',
    attachment_url: 'https://nexoraluxe.com/docs/quotes/Aura_Quote_RFQ8801.pdf',
    status: 'negotiating',
    sample_available: true,
    sample_cost: 0,
    notes: 'Offered ₹175/unit (Special tier discount from regular ₹185). Lab sample ready for immediate courier dispatch.',
    counter_offer_price: 168,
    counter_offer_notes: 'Buyer proposed ₹168/unit if final PO placed for 2,500 units.',
    created_at: '2026-08-11T16:00:00.000Z',
    updated_at: '2026-08-16T17:45:00.000Z'
  },
  {
    id: 'quote-dermaglow-8801',
    rfq_id: 'rfq-2026-8801',
    supplier_id: 'supp-dermaglow',
    unit_price: 182,
    total_price: 364000,
    moq_offered: 2000,
    lead_time: '10 Business Days',
    validity_date: '2026-09-10T23:59:59.000Z',
    terms_and_conditions: '30% Advance, 70% against Bill of Lading. GMP batch certificate attached.',
    status: 'submitted',
    sample_available: true,
    sample_cost: 500,
    notes: 'Standard 15% Vitamin C formulation with micro-encapsulation tech for extended shelf life.',
    created_at: '2026-08-12T11:30:00.000Z',
    updated_at: '2026-08-12T11:30:00.000Z'
  },
  {
    id: 'quote-luxeform-9420',
    rfq_id: 'rfq-2026-9420',
    supplier_id: 'supp-luxeform',
    unit_price: 118,
    total_price: 590000,
    moq_offered: 5000,
    lead_time: '16 Business Days',
    validity_date: '2026-09-20T23:59:59.000Z',
    terms_and_conditions: '40% Advance, 60% on dispatch. Custom bottle tooling and fine mist pump testing included.',
    status: 'submitted',
    sample_available: true,
    sample_cost: 0,
    notes: 'Premium aluminum canister option with fine mist nozzle 0.12ml delivery per spray.',
    created_at: '2026-08-14T15:20:00.000Z',
    updated_at: '2026-08-14T15:20:00.000Z'
  }
];

const SEED_MESSAGES: DBMessage[] = [
  {
    id: 'msg-101',
    conversation_id: 'conv-priya-aura',
    sender_id: 'usr-buyer-priya',
    receiver_id: 'usr-supp-aura',
    rfq_id: 'rfq-2026-8801',
    product_id: 'prod-vit-c-serum',
    message_body: 'Hello Aura Beauty Labs team, we reviewed your formulation specs for the 15% Vitamin C serum. Can you confirm if the 30ml amber bottle comes with safety shrink band sealing?',
    attachments: [],
    sent_at: '2026-08-11T09:30:00.000Z',
    is_read: true
  },
  {
    id: 'msg-102',
    conversation_id: 'conv-priya-aura',
    sender_id: 'usr-supp-aura',
    receiver_id: 'usr-buyer-priya',
    rfq_id: 'rfq-2026-8801',
    product_id: 'prod-vit-c-serum',
    message_body: 'Hi Priya, yes! All our 30ml serum bottles are fitted with tamper-evident heat shrink bands and child-resistant droppers. We have also submitted our official quote at ₹175/unit for 2,000 units.',
    attachments: ['Aura_Quote_RFQ8801.pdf'],
    sent_at: '2026-08-11T16:15:00.000Z',
    is_read: true
  },
  {
    id: 'msg-103',
    conversation_id: 'conv-priya-aura',
    sender_id: 'usr-buyer-priya',
    receiver_id: 'usr-supp-aura',
    rfq_id: 'rfq-2026-8801',
    product_id: 'prod-vit-c-serum',
    message_body: 'Thank you. We have sent a counter offer for ₹168/unit if we scale the opening batch to 2,500 units. Please review with your production manager.',
    attachments: [],
    sent_at: '2026-08-16T17:45:00.000Z',
    is_read: false
  }
];

const SEED_FOLLOW_UPS: DBFollowUp[] = [
  {
    id: 'flw-001',
    supplier_id: 'supp-aura-labs',
    buyer_id: 'buyer-prof-priya',
    rfq_id: 'rfq-2026-8801',
    remind_at: '2026-08-19T10:00:00.000Z',
    note: 'Follow up on Vitamin C counter offer approval and confirm pre-production lab sample tracking details.',
    status: 'pending',
    created_at: '2026-08-16T17:50:00.000Z',
    updated_at: '2026-08-16T17:50:00.000Z'
  },
  {
    id: 'flw-002',
    supplier_id: 'supp-luxeform',
    buyer_id: 'buyer-prof-priya',
    rfq_id: 'rfq-2026-9420',
    remind_at: '2026-08-20T14:00:00.000Z',
    note: 'Check if buyer requires physical aerosol mist samples dispatched to Pune hub.',
    status: 'pending',
    created_at: '2026-08-15T12:00:00.000Z',
    updated_at: '2026-08-15T12:00:00.000Z'
  }
];

// ============================================================================
// RELATIONAL DATABASE SINGLETON SERVICE
// ============================================================================

type DatabaseEventListener = (table: keyof DatabaseState, action: string, data: any) => void;

class RelationalDatabase {
  private state: DatabaseState;
  private listeners: Set<DatabaseEventListener> = new Set();

  constructor() {
    this.state = this.loadInitialState();
    this.runAutomatedReminderEngine();
  }

  private loadInitialState(): DatabaseState {
    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.users && parsed.products && parsed.rfqs_enquiries) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[Nexora DB] Error loading database from localStorage, initializing with seed data.', e);
    }

    const defaultState: DatabaseState = {
      users: SEED_USERS,
      profiles_buyer: SEED_PROFILES_BUYER,
      profiles_supplier: SEED_PROFILES_SUPPLIER,
      products: SEED_PRODUCTS,
      rfqs_enquiries: SEED_RFQS_ENQUIRIES,
      quotes: SEED_QUOTES,
      messages: SEED_MESSAGES,
      follow_ups: SEED_FOLLOW_UPS
    };

    this.persist(defaultState);
    return defaultState;
  }

  private persist(state: DatabaseState) {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('[Nexora DB] Failed to persist state to localStorage', e);
    }
  }

  private notify(table: keyof DatabaseState, action: string, data: any) {
    this.listeners.forEach((listener) => {
      try {
        listener(table, action, data);
      } catch (err) {
        console.error('[Nexora DB] Error in listener callback', err);
      }
    });

    // Also broadcast storage event for multi-tab sync
    window.dispatchEvent(
      new CustomEvent('nexora-db-change', {
        detail: { table, action, data, timestamp: Date.now() }
      })
    );
  }

  public subscribe(listener: DatabaseEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public resetToSeed(): DatabaseState {
    const defaultState: DatabaseState = {
      users: SEED_USERS,
      profiles_buyer: SEED_PROFILES_BUYER,
      profiles_supplier: SEED_PROFILES_SUPPLIER,
      products: SEED_PRODUCTS,
      rfqs_enquiries: SEED_RFQS_ENQUIRIES,
      quotes: SEED_QUOTES,
      messages: SEED_MESSAGES,
      follow_ups: SEED_FOLLOW_UPS
    };
    this.state = defaultState;
    this.persist(defaultState);
    this.notify('users', 'RESET_ALL', defaultState);
    return defaultState;
  }

  public getRawState(): DatabaseState {
    return { ...this.state };
  }

  // --------------------------------------------------------------------------
  // FORM & INPUT VALIDATORS (Business Logic Compliance)
  // --------------------------------------------------------------------------

  public validateGST(gstin: string): { isValid: boolean; error?: string; stateCode?: string } {
    const trimmed = (gstin || '').trim().toUpperCase();
    if (!trimmed) {
      return { isValid: false, error: 'GSTIN cannot be empty.' };
    }
    // Indian GSTIN format: 2 digits state code + 10 chars PAN + 1 entity code + 1 'Z' + 1 checksum
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(trimmed)) {
      return {
        isValid: false,
        error: 'Invalid GSTIN format. Example valid GST: 27AABCR1234F1Z8 (15 alphanumeric characters).'
      };
    }
    return { isValid: true, stateCode: trimmed.substring(0, 2) };
  }

  public validatePhone(phone: string): { isValid: boolean; formatted: string; error?: string } {
    const cleaned = (phone || '').replace(/[^0-9+]/g, '');
    const digitsOnly = cleaned.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 12) {
      return { isValid: false, formatted: phone, error: 'Phone number must be a valid 10-digit mobile number.' };
    }
    const formatted = digitsOnly.length === 10 ? `+91 ${digitsOnly}` : `+${digitsOnly}`;
    return { isValid: true, formatted };
  }

  public validateRFQ(rfq: Partial<DBRFQEnquiry>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!rfq.requirement_title || rfq.requirement_title.trim().length < 5) {
      errors.push('Requirement title must be at least 5 characters long.');
    }
    if (!rfq.quantity_required || rfq.quantity_required <= 0) {
      errors.push('Required quantity must be a positive integer.');
    }
    if (!rfq.delivery_location || rfq.delivery_location.trim().length < 3) {
      errors.push('Please specify a valid delivery city or destination location.');
    }
    if (!rfq.details || rfq.details.trim().length < 10) {
      errors.push('Please provide formulation/packaging specifications (min 10 characters).');
    }
    return { isValid: errors.length === 0, errors };
  }

  // --------------------------------------------------------------------------
  // USER & AUTH REPOSITORY
  // --------------------------------------------------------------------------

  public getUserByEmailOrPhone(identifier: string): DBUser | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.state.users.find(
      (u) => u.email.toLowerCase() === clean || u.phone.replace(/\s+/g, '') === clean.replace(/\s+/g, '')
    );
  }

  public getUserById(id: string): DBUser | undefined {
    return this.state.users.find((u) => u.id === id);
  }

  public createUser(user: Omit<DBUser, 'id' | 'created_at' | 'updated_at'>): DBUser {
    const now = new Date().toISOString();
    const newUser: DBUser = {
      ...user,
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      created_at: now,
      updated_at: now
    };
    this.state.users = [...this.state.users, newUser];
    this.persist(this.state);
    this.notify('users', 'CREATE', newUser);
    return newUser;
  }

  public updateUserRole(userId: string, role: UserRole): DBUser | undefined {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return undefined;
    user.role = role;
    user.updated_at = new Date().toISOString();
    this.persist(this.state);
    this.notify('users', 'UPDATE_ROLE', user);
    return user;
  }

  // --------------------------------------------------------------------------
  // BUYER PROFILE REPOSITORY
  // --------------------------------------------------------------------------

  public getBuyerProfileByUserId(userId: string): DBProfileBuyer | undefined {
    return this.state.profiles_buyer.find((b) => b.user_id === userId);
  }

  public getBuyerProfileById(id: string): DBProfileBuyer | undefined {
    return this.state.profiles_buyer.find((b) => b.id === id);
  }

  public upsertBuyerProfile(profile: Partial<DBProfileBuyer> & { user_id: string; contact_name: string }): DBProfileBuyer {
    const existingIndex = this.state.profiles_buyer.findIndex((b) => b.user_id === profile.user_id);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const updated: DBProfileBuyer = {
        ...this.state.profiles_buyer[existingIndex],
        ...profile,
        updated_at: now
      };
      this.state.profiles_buyer[existingIndex] = updated;
      this.persist(this.state);
      this.notify('profiles_buyer', 'UPDATE', updated);
      return updated;
    } else {
      const created: DBProfileBuyer = {
        id: `buyer-prof-${Date.now()}`,
        user_id: profile.user_id,
        contact_name: profile.contact_name,
        company_name: profile.company_name || `${profile.contact_name} Enterprises`,
        business_type: profile.business_type || 'Salon',
        city: profile.city || 'Mumbai',
        state: profile.state || 'Maharashtra',
        pincode: profile.pincode || '400001',
        address: profile.address || '',
        gst_number: profile.gst_number,
        target_categories: profile.target_categories || ['Skincare & Serums'],
        annual_budget: profile.annual_budget || '₹10L - ₹25L',
        requirements_posted_count: 0,
        created_at: now,
        updated_at: now
      };
      this.state.profiles_buyer = [...this.state.profiles_buyer, created];
      this.persist(this.state);
      this.notify('profiles_buyer', 'CREATE', created);
      return created;
    }
  }

  // --------------------------------------------------------------------------
  // SUPPLIER PROFILE REPOSITORY
  // --------------------------------------------------------------------------

  public getSupplierProfiles(): DBProfileSupplier[] {
    return [...this.state.profiles_supplier];
  }

  public getSupplierProfileById(id: string): DBProfileSupplier | undefined {
    return this.state.profiles_supplier.find((s) => s.id === id);
  }

  public getSupplierProfileByUserId(userId: string): DBProfileSupplier | undefined {
    return this.state.profiles_supplier.find((s) => s.user_id === userId);
  }

  public upsertSupplierProfile(profile: Partial<DBProfileSupplier> & { user_id: string; company_name: string }): DBProfileSupplier {
    const existingIndex = this.state.profiles_supplier.findIndex((s) => s.user_id === profile.user_id);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const updated: DBProfileSupplier = {
        ...this.state.profiles_supplier[existingIndex],
        ...profile,
        updated_at: now
      };
      this.state.profiles_supplier[existingIndex] = updated;
      this.persist(this.state);
      this.notify('profiles_supplier', 'UPDATE', updated);
      return updated;
    } else {
      const created: DBProfileSupplier = {
        id: `supp-prof-${Date.now()}`,
        user_id: profile.user_id,
        company_name: profile.company_name,
        slug: profile.slug || profile.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        logo_url: profile.logo_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80',
        cover_image_url: profile.cover_image_url || 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1200&q=80',
        business_type: profile.business_type || 'Manufacturer',
        verification_level: profile.verification_level || 'Business Verified',
        gst_number: profile.gst_number || '27AABCU9999P1Z1',
        year_established: profile.year_established || '2020',
        employee_count: profile.employee_count || '50-100 Employees',
        service_areas: profile.service_areas || ['Pan India'],
        categories: profile.categories || ['Skincare & Serums', 'OEM / Private Label'],
        response_rate: 98,
        avg_response_time: 2.0,
        profile_completion_pct: 85,
        trust_score: 90,
        phone: profile.phone || '+91 98000 11111',
        whatsapp: profile.whatsapp || '+91 98000 11111',
        city: profile.city || 'Mumbai',
        state: profile.state || 'Maharashtra',
        address: profile.address || '',
        is_verified: true,
        is_gst_verified: true,
        is_iso_certified: true,
        onboarding_status: 'review',
        reviewed_at: null,
        approved_at: null,
        verification_notes: null,
        created_at: now,
        updated_at: now
      };
      this.state.profiles_supplier = [...this.state.profiles_supplier, created];
      this.persist(this.state);
      this.notify('profiles_supplier', 'CREATE', created);
      return created;
    }
  }

  // --------------------------------------------------------------------------
  // PRODUCTS REPOSITORY
  // --------------------------------------------------------------------------

  public getProducts(filter?: { category_id?: string; supplier_id?: string; status?: string }): PopulatedProduct[] {
    let prods = [...this.state.products];
    if (filter?.category_id) {
      prods = prods.filter((p) => p.category_id.toLowerCase() === filter.category_id?.toLowerCase());
    }
    if (filter?.supplier_id) {
      prods = prods.filter((p) => p.supplier_id === filter.supplier_id);
    }
    if (filter?.status) {
      prods = prods.filter((p) => p.status === filter.status);
    }

    return prods.map((p) => ({
      ...p,
      supplier: this.getSupplierProfileById(p.supplier_id)
    }));
  }

  public getProductById(id: string): PopulatedProduct | undefined {
    const prod = this.state.products.find((p) => p.id === id);
    if (!prod) return undefined;
    return {
      ...prod,
      supplier: this.getSupplierProfileById(prod.supplier_id)
    };
  }

  public createProduct(product: Omit<DBProduct, 'id' | 'created_at' | 'updated_at'>): DBProduct {
    const now = new Date().toISOString();
    const newProd: DBProduct = {
      ...product,
      id: `prod-${Date.now()}`,
      created_at: now,
      updated_at: now
    };
    this.state.products = [newProd, ...this.state.products];
    this.persist(this.state);
    this.notify('products', 'CREATE', newProd);
    return newProd;
  }

  public updateProduct(id: string, updates: Partial<DBProduct>): DBProduct | undefined {
    const index = this.state.products.findIndex((p) => p.id === id);
    if (index === -1) return undefined;
    const updated = {
      ...this.state.products[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.state.products[index] = updated;
    this.persist(this.state);
    this.notify('products', 'UPDATE', updated);
    return updated;
  }

  public deleteProduct(id: string): boolean {
    const before = this.state.products.length;
    this.state.products = this.state.products.filter((p) => p.id !== id);
    if (this.state.products.length !== before) {
      this.persist(this.state);
      this.notify('products', 'DELETE', { id });
      return true;
    }
    return false;
  }

  // --------------------------------------------------------------------------
  // RFQS & ENQUIRIES REPOSITORY (With Lead Routing & Distribution)
  // --------------------------------------------------------------------------

  public getRFQsAndEnquiries(filter?: {
    buyer_id?: string;
    supplier_id?: string;
    type?: 'direct_enquiry' | 'public_rfq';
    status?: string;
  }): PopulatedRFQEnquiry[] {
    let items = [...this.state.rfqs_enquiries];

    if (filter?.buyer_id) {
      items = items.filter((r) => r.buyer_id === filter.buyer_id);
    }
    if (filter?.supplier_id) {
      items = items.filter((r) => {
        // Direct match OR supplier is in matched lead distribution array OR it's a public RFQ matching category
        if (r.supplier_id === filter.supplier_id) return true;
        if (r.matched_supplier_ids && r.matched_supplier_ids.includes(filter.supplier_id)) return true;
        if (r.type === 'public_rfq') return true;
        return false;
      });
    }
    if (filter?.type) {
      items = items.filter((r) => r.type === filter.type);
    }
    if (filter?.status && filter.status !== 'all') {
      items = items.filter((r) => r.status.toLowerCase() === filter.status?.toLowerCase());
    }

    return items.map((rfq) => {
      const quotes = this.state.quotes.filter((q) => q.rfq_id === rfq.id);
      return {
        ...rfq,
        buyer: this.getBuyerProfileById(rfq.buyer_id),
        supplier: rfq.supplier_id ? this.getSupplierProfileById(rfq.supplier_id) : null,
        product: rfq.product_id ? this.state.products.find((p) => p.id === rfq.product_id) : null,
        quotes,
        quotes_count: quotes.length
      };
    });
  }

  public getRFQById(id: string): PopulatedRFQEnquiry | undefined {
    const rfq = this.state.rfqs_enquiries.find((r) => r.id === id);
    if (!rfq) return undefined;
    const quotes = this.state.quotes.filter((q) => q.rfq_id === rfq.id);
    return {
      ...rfq,
      buyer: this.getBuyerProfileById(rfq.buyer_id),
      supplier: rfq.supplier_id ? this.getSupplierProfileById(rfq.supplier_id) : null,
      product: rfq.product_id ? this.state.products.find((p) => p.id === rfq.product_id) : null,
      quotes,
      quotes_count: quotes.length
    };
  }

  /**
   * Multi-supplier Lead Distribution Engine:
   * When an enquiry is posted with send_to_similar_suppliers=true, match with top verified suppliers
   */
  public createRFQEnquiry(data: Omit<DBRFQEnquiry, 'id' | 'created_at' | 'updated_at' | 'matched_supplier_ids'>): DBRFQEnquiry {
    const now = new Date().toISOString();
    const matchedSupplierIds: string[] = [];

    if (data.supplier_id) {
      matchedSupplierIds.push(data.supplier_id);
    }

    // If multi-supplier lead distribution requested or public RFQ
    if (data.send_to_similar_suppliers || data.type === 'public_rfq') {
      const rfqCategory = (data.category || '').toLowerCase();
      const candidates = this.state.profiles_supplier
        .filter((s) => {
          if (s.id === data.supplier_id) return false;
          if (!s.is_verified) return false;
          // Match if supplier's categories list includes the RFQ category
          return s.categories.some(c => c.toLowerCase().includes(rfqCategory) || rfqCategory.includes(c.toLowerCase()));
        })
        .slice(0, 3)
        .map((s) => s.id);
      
      // Fallback if not enough category-matching verified suppliers
      if (candidates.length < 3) {
        const remainingNeeded = 3 - candidates.length;
        const fallbackCandidates = this.state.profiles_supplier
          .filter((s) => s.id !== data.supplier_id && s.is_verified && !candidates.includes(s.id))
          .slice(0, remainingNeeded)
          .map((s) => s.id);
        candidates.push(...fallbackCandidates);
      }
      matchedSupplierIds.push(...candidates);
    }

    const newRfq: DBRFQEnquiry = {
      ...data,
      id: `rfq-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      matched_supplier_ids: Array.from(new Set(matchedSupplierIds)),
      created_at: now,
      updated_at: now
    };

    this.state.rfqs_enquiries = [newRfq, ...this.state.rfqs_enquiries];

    // Increment buyer requirements count
    const buyer = this.state.profiles_buyer.find((b) => b.id === data.buyer_id);
    if (buyer) {
      buyer.requirements_posted_count = (buyer.requirements_posted_count || 0) + 1;
      buyer.updated_at = now;
    }

    // Create automatic initial lead follow-up task for primary supplier if specified
    if (data.supplier_id) {
      const followUpDate = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
      const followUp: DBFollowUp = {
        id: `flw-${Date.now()}`,
        supplier_id: data.supplier_id,
        buyer_id: data.buyer_id,
        rfq_id: newRfq.id,
        remind_at: followUpDate,
        note: `Review and prepare commercial quote for: ${newRfq.requirement_title}`,
        status: 'pending',
        created_at: now,
        updated_at: now
      };
      this.state.follow_ups.push(followUp);
    }

    this.persist(this.state);
    this.notify('rfqs_enquiries', 'CREATE', newRfq);
    return newRfq;
  }

  public updateRFQStatus(id: string, status: DBRFQEnquiry['status']): DBRFQEnquiry | undefined {
    const rfq = this.state.rfqs_enquiries.find((r) => r.id === id);
    if (!rfq) return undefined;
    rfq.status = status;
    rfq.updated_at = new Date().toISOString();
    this.persist(this.state);
    this.notify('rfqs_enquiries', 'UPDATE_STATUS', rfq);
    return rfq;
  }

  public updateRFQEnquiry(id: string, updates: Partial<Omit<DBRFQEnquiry, 'id' | 'created_at' | 'updated_at'>>): DBRFQEnquiry | undefined {
    const rfq = this.state.rfqs_enquiries.find((r) => r.id === id);
    if (!rfq) return undefined;
    
    Object.assign(rfq, updates);
    rfq.updated_at = new Date().toISOString();
    
    this.persist(this.state);
    this.notify('rfqs_enquiries', 'UPDATE', rfq);
    return rfq;
  }

  // --------------------------------------------------------------------------
  // QUOTES & COMMERCIAL NEGOTIATIONS REPOSITORY
  // --------------------------------------------------------------------------

  public getQuotesByRfqId(rfqId: string): PopulatedQuote[] {
    return this.state.quotes
      .filter((q) => q.rfq_id === rfqId)
      .map((q) => ({
        ...q,
        supplier: this.getSupplierProfileById(q.supplier_id),
        rfq: this.state.rfqs_enquiries.find((r) => r.id === q.rfq_id)
      }));
  }

  public getQuoteById(id: string): PopulatedQuote | undefined {
    const q = this.state.quotes.find((item) => item.id === id);
    if (!q) return undefined;
    return {
      ...q,
      supplier: this.getSupplierProfileById(q.supplier_id),
      rfq: this.state.rfqs_enquiries.find((r) => r.id === q.rfq_id)
    };
  }

  public createQuote(quoteData: Omit<DBQuote, 'id' | 'created_at' | 'updated_at'>): DBQuote {
    const now = new Date().toISOString();
    const newQuote: DBQuote = {
      ...quoteData,
      id: `quote-${Date.now()}`,
      created_at: now,
      updated_at: now
    };

    this.state.quotes = [newQuote, ...this.state.quotes];

    // Update parent RFQ status to 'responded' or 'negotiating'
    const rfq = this.state.rfqs_enquiries.find((r) => r.id === quoteData.rfq_id);
    if (rfq && rfq.status === 'new') {
      rfq.status = 'responded';
      rfq.updated_at = now;
    }

    this.persist(this.state);
    this.notify('quotes', 'CREATE', newQuote);
    return newQuote;
  }

  public updateQuoteStatus(
    id: string,
    status: DBQuote['status'],
    metadata?: { counter_offer_price?: number; counter_offer_notes?: string }
  ): DBQuote | undefined {
    const quote = this.state.quotes.find((q) => q.id === id);
    if (!quote) return undefined;

    quote.status = status;
    if (metadata?.counter_offer_price) {
      quote.counter_offer_price = metadata.counter_offer_price;
    }
    if (metadata?.counter_offer_notes) {
      quote.counter_offer_notes = metadata.counter_offer_notes;
    }
    quote.updated_at = new Date().toISOString();

    // If quote accepted, update RFQ status to 'negotiating' or 'closed'
    const rfq = this.state.rfqs_enquiries.find((r) => r.id === quote.rfq_id);
    if (rfq) {
      if (status === 'accepted') {
        rfq.status = 'negotiating';
        rfq.updated_at = new Date().toISOString();
      }
    }

    this.persist(this.state);
    this.notify('quotes', 'UPDATE_STATUS', quote);
    return quote;
  }

  // --------------------------------------------------------------------------
  // MESSAGES & REAL-TIME DIRECT CHAT REPOSITORY
  // --------------------------------------------------------------------------

  public getMessages(conversationId?: string): DBMessage[] {
    if (conversationId) {
      return this.state.messages.filter((m) => m.conversation_id === conversationId);
    }
    return [...this.state.messages];
  }

  public sendMessage(msg: Omit<DBMessage, 'id' | 'sent_at' | 'is_read'>): DBMessage {
    const newMsg: DBMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sent_at: new Date().toISOString(),
      is_read: false
    };

    this.state.messages = [...this.state.messages, newMsg];
    this.persist(this.state);
    this.notify('messages', 'CREATE', newMsg);
    return newMsg;
  }

  public markMessagesAsRead(conversationId: string, receiverId: string): void {
    let changed = false;
    this.state.messages.forEach((m) => {
      if (m.conversation_id === conversationId && m.receiver_id === receiverId && !m.is_read) {
        m.is_read = true;
        changed = true;
      }
    });
    if (changed) {
      this.persist(this.state);
      this.notify('messages', 'MARK_READ', { conversationId, receiverId });
    }
  }

  // --------------------------------------------------------------------------
  // SUPPLIER FOLLOW-UPS REPOSITORY
  // --------------------------------------------------------------------------

  public getFollowUps(supplierId?: string): DBFollowUp[] {
    if (supplierId) {
      return this.state.follow_ups.filter((f) => f.supplier_id === supplierId);
    }
    return [...this.state.follow_ups];
  }

  public createFollowUp(followUp: Omit<DBFollowUp, 'id' | 'created_at' | 'updated_at'>): DBFollowUp {
    const now = new Date().toISOString();
    const newFollowUp: DBFollowUp = {
      ...followUp,
      id: `flw-${Date.now()}`,
      created_at: now,
      updated_at: now
    };
    this.state.follow_ups = [newFollowUp, ...this.state.follow_ups];
    this.persist(this.state);
    this.notify('follow_ups', 'CREATE', newFollowUp);
    return newFollowUp;
  }

  public updateFollowUpStatus(id: string, status: DBFollowUp['status']): DBFollowUp | undefined {
    const item = this.state.follow_ups.find((f) => f.id === id);
    if (!item) return undefined;
    item.status = status;
    item.updated_at = new Date().toISOString();
    this.persist(this.state);
    this.notify('follow_ups', 'UPDATE_STATUS', item);
    return item;
  }

  public runAutomatedReminderEngine(): void {
    const now = new Date().toISOString();
    let updated = false;

    // Scan RFQs that are new and have no quotes
    this.state.rfqs_enquiries.forEach((rfq) => {
      const quotes = this.state.quotes.filter((q) => q.rfq_id === rfq.id);
      if (rfq.status === 'new' && quotes.length === 0) {
        // Verify if we have a pending followup already
        const hasFollowUp = this.state.follow_ups.some((f) => f.rfq_id === rfq.id && f.status === 'pending');
        if (!hasFollowUp) {
          // Identify suppliers to target (primary supplier or first matched supplier)
          const targetSupplierId = rfq.supplier_id || (rfq.matched_supplier_ids && rfq.matched_supplier_ids[0]) || 'supp-aura-labs';
          const targetBuyerId = rfq.buyer_id;
          
          const remindDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString(); // 24 hours later
          
          this.state.follow_ups.push({
            id: `flw-auto-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            supplier_id: targetSupplierId,
            buyer_id: targetBuyerId,
            rfq_id: rfq.id,
            remind_at: remindDate,
            note: `[AUTOMATED LEAD REMINDER] New high-intent sourcing request received: "${rfq.requirement_title}". Prepare and send your quote.`,
            status: 'pending',
            created_at: now,
            updated_at: now
          });
          updated = true;
        }
      }
    });

    // Scan quotes that are submitted and check their validity date
    this.state.quotes.forEach((quote) => {
      if (quote.status === 'submitted') {
        const validityMs = new Date(quote.validity_date).getTime();
        const diffDays = (validityMs - Date.now()) / (1000 * 3600 * 24);
        
        // If quote is expiring in less than 30 days, trigger buyer reminder
        if (diffDays > 0 && diffDays < 30) {
          const hasFollowUp = this.state.follow_ups.some((f) => f.rfq_id === quote.rfq_id && f.note.includes('EXPIRING SOON'));
          if (!hasFollowUp) {
            const rfq = this.state.rfqs_enquiries.find((r) => r.id === quote.rfq_id);
            const buyerId = rfq ? rfq.buyer_id : 'buyer-prof-priya';
            const remindDate = new Date().toISOString();
            
            this.state.follow_ups.push({
              id: `flw-auto-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
              supplier_id: quote.supplier_id,
              buyer_id: buyerId,
              rfq_id: quote.rfq_id,
              remind_at: remindDate,
              note: `[AUTOMATED QUOTE EXPIRING SOON] Supplier's commercial quote of ₹${quote.unit_price}/unit is expiring soon on ${new Date(quote.validity_date).toLocaleDateString()}. Please review and compare now.`,
              status: 'pending',
              created_at: now,
              updated_at: now
            });
            updated = true;
          }
        }
      }
    });

    if (updated) {
      this.persist(this.state);
      this.notify('follow_ups', 'AUTOMATED_REFRESH', this.state.follow_ups);
    }
  }
}

// Global Singleton Instance for Phase 4
export const db = new RelationalDatabase();
