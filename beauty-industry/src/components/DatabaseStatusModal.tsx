import React, { useState, useEffect } from 'react';
import { 
  Database, 
  X, 
  RefreshCw, 
  Layers, 
  Users, 
  Building2, 
  ShoppingBag, 
  FileText, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Send, 
  Sparkles, 
  ArrowRight,
  Search,
  Copy,
  Check,
  Code2,
  Table as TableIcon,
  ShieldCheck,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Info,
  Cloud,
  Zap,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../db/database';
import { DatabaseState } from '../db/database';
import { CATEGORY_TAXONOMY, getSubcategoriesForCategoryName } from '../data/categories';
import { testSupabaseConnection, isSupabaseConfigured, getSupabaseConfigInfo, syncAllDataToSupabase } from '../lib/supabase';


interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToScreen?: (screen: string) => void;
}

interface ColumnDef {
  name: string;
  type: string;
  isPk?: boolean;
  fkTarget?: string;
  description: string;
}

const TABLE_SCHEMAS: Record<keyof DatabaseState, { title: string; description: string; columns: ColumnDef[] }> = {
  users: {
    title: 'users',
    description: 'System credentials, email/phone hash, RBAC roles (buyer, supplier, admin)',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, description: 'Primary Key, unique user identifier' },
      { name: 'email', type: 'VARCHAR(255)', description: 'Unique user email address' },
      { name: 'phone', type: 'VARCHAR(20)', description: 'E.164 verified mobile phone number' },
      { name: 'password_hash', type: 'VARCHAR(255)', description: 'Encrypted password credential' },
      { name: 'role', type: 'VARCHAR(32)', description: 'Enum: buyer | supplier | admin | guest' },
      { name: 'created_at', type: 'TIMESTAMP', description: 'Account creation timestamp' },
      { name: 'updated_at', type: 'TIMESTAMP', description: 'Last profile modification' }
    ]
  },
  profiles_buyer: {
    title: 'profiles_buyer',
    description: 'Buyer business entities, GST, categories, annual sourcing budgets',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, description: 'Primary Key for buyer profile' },
      { name: 'user_id', type: 'UUID', fkTarget: 'users.id', description: 'Foreign key to users table' },
      { name: 'contact_name', type: 'VARCHAR(128)', description: 'Primary procurement contact' },
      { name: 'company_name', type: 'VARCHAR(255)', description: 'Registered business/clinic name' },
      { name: 'business_type', type: 'VARCHAR(64)', description: 'Salon, Clinic, Retailer, Brand Owner' },
      { name: 'city', type: 'VARCHAR(64)', description: 'Commercial base city' },
      { name: 'state', type: 'VARCHAR(64)', description: 'State / Territory' },
      { name: 'pincode', type: 'VARCHAR(10)', description: '6-digit Indian postal code' },
      { name: 'address', type: 'TEXT', description: 'Registered delivery address' },
      { name: 'gst_number', type: 'VARCHAR(20)', description: '15-character GSTIN tax number' },
      { name: 'annual_budget_inr', type: 'NUMERIC', description: 'Annual sourcing capacity' },
      { name: 'preferred_categories', type: 'TEXT[]', description: 'Array of procurement interests' },
      { name: 'created_at', type: 'TIMESTAMP', description: 'Profile creation timestamp' }
    ]
  },
  profiles_supplier: {
    title: 'profiles_supplier',
    description: 'Verified manufacturing hubs, GSTIN, response rate, trust score',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, description: 'Primary Key for supplier profile' },
      { name: 'user_id', type: 'UUID', fkTarget: 'users.id', description: 'Foreign key to users table' },
      { name: 'company_name', type: 'VARCHAR(255)', description: 'Manufacturer/Lab corporate name' },
      { name: 'business_type', type: 'VARCHAR(64)', description: 'OEM, Contract Lab, Wholesaler' },
      { name: 'city', type: 'VARCHAR(64)', description: 'Facility manufacturing hub' },
      { name: 'state', type: 'VARCHAR(64)', description: 'State location' },
      { name: 'pincode', type: 'VARCHAR(10)', description: 'Facility pincode' },
      { name: 'gst_number', type: 'VARCHAR(20)', description: 'Verified GSTIN tax certificate' },
      { name: 'verified', type: 'BOOLEAN', description: 'Nexora Verification status' },
      { name: 'trust_score', type: 'NUMERIC(3,1)', description: 'Quality rating out of 5.0' },
      { name: 'year_established', type: 'INTEGER', description: 'Commercial operation start year' },
      { name: 'factory_capacity', type: 'VARCHAR(128)', description: 'Monthly production capacity' },
      { name: 'certifications', type: 'TEXT[]', description: 'WHO-GMP, ISO 22716, Ayush, FDA' },
      { name: 'response_rate_pct', type: 'INTEGER', description: 'Enquiry reply rate %' },
      { name: 'created_at', type: 'TIMESTAMP', description: 'Onboarding date' }
    ]
  },
  products: {
    title: 'products',
    description: 'B2B formulation catalogue, bulk pricing slabs, MOQ tiers, specs (Validated against Master Taxonomy)',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, description: 'Primary Key for product listing' },
      { name: 'supplier_id', type: 'UUID', fkTarget: 'profiles_supplier.id', description: 'Linked manufacturer' },
      { name: 'name', type: 'VARCHAR(255)', description: 'Formulation / Product Title' },
      { name: 'category', type: 'VARCHAR(64)', description: 'Master Category Enum (Skincare, Haircare & Styling, Color Cosmetics, Personal Care, Raw Ingredients, Packaging, Salon Equipment)' },
      { name: 'sub_category', type: 'VARCHAR(64)', description: 'Validated Subcategory classification' },
      { name: 'description', type: 'TEXT', description: 'Formulation details & actives' },
      { name: 'price_tiers', type: 'JSONB', description: 'Tiered wholesale price brackets' },
      { name: 'moq', type: 'INTEGER', description: 'Minimum Order Quantity' },
      { name: 'moq_unit', type: 'VARCHAR(32)', description: 'Units, Liters, Kg, Pieces' },
      { name: 'lead_time_days', type: 'INTEGER', description: 'Production & dispatch days' },
      { name: 'oem_available', type: 'BOOLEAN', description: 'Private label customization tag' },
      { name: 'formulation_type', type: 'VARCHAR(64)', description: 'Serum, Emulsion, Powder, Cream' },
      { name: 'ingredients', type: 'TEXT[]', description: 'Active raw materials list' },
      { name: 'certifications', type: 'TEXT[]', description: 'COA, Dermatologist Tested, Vegan' },
      { name: 'images', type: 'TEXT[]', description: 'Product asset URLs' },
      { name: 'created_at', type: 'TIMESTAMP', description: 'Listing timestamp' }
    ]
  },
  rfqs_enquiries: {
    title: 'rfqs_enquiries',
    description: 'Direct inquiries & public RFQs with multi-supplier lead routing (Validated against Master Taxonomy)',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, description: 'Primary Key (e.g., #NX-RFQ-847291)' },
      { name: 'buyer_id', type: 'UUID', fkTarget: 'profiles_buyer.id', description: 'Requesting procurement buyer' },
      { name: 'supplier_id', type: 'UUID', fkTarget: 'profiles_supplier.id', description: 'Primary supplier (or NULL if public)' },
      { name: 'product_id', type: 'UUID', fkTarget: 'products.id', description: 'Referenced formulation catalog ID' },
      { name: 'requirement_title', type: 'VARCHAR(255)', description: 'Procurement headline / brief' },
      { name: 'category', type: 'VARCHAR(64)', description: 'Standardized Category & Subcategory Taxonomy string' },
      { name: 'quantity_required', type: 'INTEGER', description: 'Requested bulk volume' },
      { name: 'quantity_unit', type: 'VARCHAR(32)', description: 'Units, Liters, Kg, Pieces' },
      { name: 'target_budget', type: 'NUMERIC', description: 'Target purchase price in INR' },
      { name: 'delivery_location', type: 'VARCHAR(255)', description: 'Destination city and pincode' },
      { name: 'details', type: 'TEXT', description: 'Technical formulation & packaging notes' },
      { name: 'attachments', type: 'TEXT[]', description: 'Uploaded briefs / specification files' },
      { name: 'status', type: 'VARCHAR(32)', description: 'new | in_review | quoted | closed' },
      { name: 'type', type: 'VARCHAR(32)', description: 'direct_enquiry | public_rfq' },
      { name: 'send_to_similar_suppliers', type: 'BOOLEAN', description: 'Multi-sourcing broadcast flag' },
      { name: 'matched_supplier_ids', type: 'TEXT[]', description: 'Array of routed supplier IDs' },
      { name: 'created_at', type: 'TIMESTAMP', description: 'Enquiry submission time' }
    ]
  },
  quotes: {
    title: 'quotes',
    description: 'Commercial supplier quotes, validity dates, counter-offers, terms',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, description: 'Primary Key (e.g., QUOTE-6789)' },
      { name: 'rfq_id', type: 'UUID', fkTarget: 'rfqs_enquiries.id', description: 'Linked requirement' },
      { name: 'supplier_id', type: 'UUID', fkTarget: 'profiles_supplier.id', description: 'Quoting manufacturer' },
      { name: 'buyer_id', type: 'UUID', fkTarget: 'profiles_buyer.id', description: 'Recipient buyer' },
      { name: 'unit_price', type: 'NUMERIC', description: 'Wholesale unit quote in INR' },
      { name: 'moq_quoted', type: 'INTEGER', description: 'Offered minimum quantity' },
      { name: 'tax_gst_pct', type: 'NUMERIC', description: 'Applicable GST percentage (e.g. 18%)' },
      { name: 'freight_charges', type: 'NUMERIC', description: 'Logistics / freight cost' },
      { name: 'total_amount', type: 'NUMERIC', description: 'Gross quote commercial value' },
      { name: 'estimated_lead_days', type: 'INTEGER', description: 'Batch delivery turnaround' },
      { name: 'valid_until', type: 'DATE', description: 'Quote expiration date' },
      { name: 'payment_terms', type: 'VARCHAR(128)', description: 'e.g. 50% advance, 50% on dispatch' },
      { name: 'notes', type: 'TEXT', description: 'Packaging and formulation remarks' },
      { name: 'status', type: 'VARCHAR(32)', description: 'draft | submitted | accepted | declined' },
      { name: 'created_at', type: 'TIMESTAMP', description: 'Quote creation date' }
    ]
  },
  messages: {
    title: 'messages',
    description: 'Real-time buyer-supplier communication logs & attachments',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, description: 'Primary Key for message item' },
      { name: 'rfq_id', type: 'UUID', fkTarget: 'rfqs_enquiries.id', description: 'Linked sourcing thread' },
      { name: 'sender_id', type: 'UUID', fkTarget: 'users.id', description: 'Sender user ID' },
      { name: 'recipient_id', type: 'UUID', fkTarget: 'users.id', description: 'Recipient user ID' },
      { name: 'sender_role', type: 'VARCHAR(32)', description: 'buyer | supplier' },
      { name: 'message_text', type: 'TEXT', description: 'Communication message body' },
      { name: 'attachments', type: 'TEXT[]', description: 'COA documents, lab reports, photos' },
      { name: 'is_read', type: 'BOOLEAN', description: 'Read receipt indicator' },
      { name: 'created_at', type: 'TIMESTAMP', description: 'Message timestamp' }
    ]
  },
  follow_ups: {
    title: 'follow_ups',
    description: 'Supplier automated lead reminders & negotiation follow-ups',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, description: 'Primary Key for follow-up record' },
      { name: 'rfq_id', type: 'UUID', fkTarget: 'rfqs_enquiries.id', description: 'Linked requirement' },
      { name: 'supplier_id', type: 'UUID', fkTarget: 'profiles_supplier.id', description: 'Handling supplier' },
      { name: 'buyer_id', type: 'UUID', fkTarget: 'profiles_buyer.id', description: 'Target buyer' },
      { name: 'scheduled_at', type: 'TIMESTAMP', description: 'Scheduled reminder date' },
      { name: 'status', type: 'VARCHAR(32)', description: 'pending | completed | cancelled' },
      { name: 'notes', type: 'TEXT', description: 'Follow-up purpose & negotiation stage' },
      { name: 'created_at', type: 'TIMESTAMP', description: 'Record generation timestamp' }
    ]
  }
};

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({
  isOpen,
  onClose,
  onNavigateToScreen
}) => {
  const [dbState, setDbState] = useState<DatabaseState>(db.getRawState());
  const [activeTable, setActiveTable] = useState<keyof DatabaseState>('rfqs_enquiries');
  const [activeTab, setActiveTab] = useState<'records' | 'schema' | 'simulator' | 'supabase'>('supabase');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Supabase State
  const [supabaseTestStatus, setSupabaseTestStatus] = useState<{ connected: boolean; message: string; latencyMs?: number } | null>(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [supabaseSyncMessage, setSupabaseSyncMessage] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Simulator State
  const [testLeadCategory, setTestLeadCategory] = useState('Skincare');
  const [testLeadSubcategory, setTestLeadSubcategory] = useState('Serums & Treatments');
  const [testLeadTitle, setTestLeadTitle] = useState('Bulk Procurement: 3,000 Units Botanical Hair Elixir');
  const [testLeadQty, setTestLeadQty] = useState('3000');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  useEffect(() => {
    // Initial Supabase test check
    testSupabaseConnection().then(res => setSupabaseTestStatus(res));
  }, []);

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseSyncMessage(null);
    try {
      const res = await testSupabaseConnection();
      setSupabaseTestStatus(res);
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setIsSyncingSupabase(true);
    setSupabaseSyncMessage(null);
    try {
      const res = await syncAllDataToSupabase(dbState);
      if (res.success) {
        setSupabaseSyncMessage(`Successfully synced ${res.syncedCount} records across all tables into Supabase!`);
      } else {
        setSupabaseSyncMessage(`Sync notice: ${res.errors.join(', ')}`);
      }
    } catch (err: any) {
      setSupabaseSyncMessage(`Sync failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const handleCopySupabaseSql = () => {
    const sqlContent = `-- NEXORA LUXE - SUPABASE POSTGRESQL SCHEMA MIGRATION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('buyer', 'supplier', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILES_BUYER
CREATE TABLE IF NOT EXISTS profiles_buyer (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(20),
  address TEXT,
  gst_number VARCHAR(50),
  target_categories TEXT[],
  annual_budget VARCHAR(100),
  requirements_posted_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFILES_SUPPLIER
CREATE TABLE IF NOT EXISTS profiles_supplier (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo_url TEXT,
  cover_image_url TEXT,
  business_type VARCHAR(100) NOT NULL,
  verification_level VARCHAR(50) DEFAULT 'Basic',
  gst_number VARCHAR(50),
  year_established VARCHAR(10),
  employee_count VARCHAR(50),
  service_areas TEXT[],
  categories TEXT[],
  response_rate NUMERIC(5,2) DEFAULT 95.0,
  avg_response_time NUMERIC(5,2) DEFAULT 2.0,
  profile_completion_pct INT DEFAULT 85,
  trust_score INT DEFAULT 80,
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  city VARCHAR(100),
  state VARCHAR(100),
  address TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_gst_verified BOOLEAN DEFAULT FALSE,
  is_iso_certified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES profiles_supplier(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  category_id VARCHAR(100) NOT NULL,
  brand_name VARCHAR(255),
  description TEXT,
  images TEXT[],
  specifications JSONB DEFAULT '{}'::jsonb,
  moq INT NOT NULL DEFAULT 1,
  moq_unit VARCHAR(50) DEFAULT 'Units',
  unit_price NUMERIC(12,2) NOT NULL,
  bulk_price_slabs JSONB DEFAULT '[]'::jsonb,
  lead_time_days INT DEFAULT 7,
  status VARCHAR(20) DEFAULT 'active',
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RFQS_ENQUIRIES
CREATE TABLE IF NOT EXISTS rfqs_enquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES profiles_buyer(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES profiles_supplier(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  requirement_title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity_required INT NOT NULL,
  quantity_unit VARCHAR(50) DEFAULT 'Units',
  target_budget NUMERIC(14,2),
  delivery_location VARCHAR(255),
  details TEXT,
  attachments TEXT[],
  status VARCHAR(20) DEFAULT 'new',
  type VARCHAR(30) DEFAULT 'direct_enquiry',
  send_to_similar_suppliers BOOLEAN DEFAULT FALSE,
  matched_supplier_ids TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. QUOTES
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID NOT NULL REFERENCES rfqs_enquiries(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES profiles_supplier(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles_buyer(id) ON DELETE CASCADE,
  unit_price NUMERIC(12,2) NOT NULL,
  moq_quoted INT NOT NULL,
  tax_gst_pct NUMERIC(5,2) DEFAULT 18.00,
  freight_charges NUMERIC(12,2) DEFAULT 0.00,
  total_amount NUMERIC(14,2) NOT NULL,
  estimated_lead_days INT DEFAULT 7,
  valid_until DATE,
  payment_terms VARCHAR(255),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID NOT NULL REFERENCES rfqs_enquiries(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL,
  message_text TEXT NOT NULL,
  attachments TEXT[],
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FOLLOW_UPS
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID NOT NULL REFERENCES rfqs_enquiries(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES profiles_supplier(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles_buyer(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;
    navigator.clipboard.writeText(sqlContent);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setDbState(db.getRawState());
    });
    return unsub;
  }, []);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleResetDatabase = () => {
    if (window.confirm('Reset all 8 relational database tables to standard factory seed data?')) {
      const reset = db.resetToSeed();
      setDbState(reset);
      setSimulationResult('Database successfully reset to seed records.');
    }
  };

  const handleSimulateLeadRouting = () => {
    setIsSimulating(true);
    setSimulationResult(null);

    setTimeout(() => {
      const created = db.createRFQEnquiry({
        buyer_id: 'buyer-prof-priya',
        supplier_id: null,
        requirement_title: testLeadTitle,
        category: `${testLeadCategory} > ${testLeadSubcategory}`,
        quantity_required: parseInt(testLeadQty, 10) || 1000,
        quantity_unit: 'Units',
        target_budget: 450000,
        delivery_location: 'Mumbai Central Hub',
        details: 'Simulated multi-supplier lead distribution event triggered for verified manufacturers.',
        attachments: ['auto_sim_spec.pdf'],
        status: 'new',
        type: 'public_rfq',
        send_to_similar_suppliers: true
      });

      setIsSimulating(false);
      setSimulationResult(
        `Lead successfully routed to ${created.matched_supplier_ids?.length || 3} verified suppliers (RFQ ID: ${created.id}). Inbox notifications and follow-up queues generated!`
      );
      setDbState(db.getRawState());
    }, 500);
  };

  const handleCopyJson = (data: any, id: string) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const tables: Array<{
    id: keyof DatabaseState;
    name: string;
    icon: React.ReactNode;
    count: number;
    description: string;
  }> = [
    {
      id: 'users',
      name: 'users',
      icon: <Users className="w-4 h-4 text-sky-600" />,
      count: dbState.users.length,
      description: 'System credentials, email/phone hash, RBAC roles'
    },
    {
      id: 'profiles_buyer',
      name: 'profiles_buyer',
      icon: <Users className="w-4 h-4 text-emerald-600" />,
      count: dbState.profiles_buyer.length,
      description: 'Buyer business entities, GST, categories, budgets'
    },
    {
      id: 'profiles_supplier',
      name: 'profiles_supplier',
      icon: <Building2 className="w-4 h-4 text-[#B90064]" />,
      count: dbState.profiles_supplier.length,
      description: 'Verified manufacturing hubs, GSTIN, trust score'
    },
    {
      id: 'products',
      name: 'products',
      icon: <ShoppingBag className="w-4 h-4 text-amber-600" />,
      count: dbState.products.length,
      description: 'B2B formulation catalogue, bulk pricing slabs, MOQ'
    },
    {
      id: 'rfqs_enquiries',
      name: 'rfqs_enquiries',
      icon: <FileText className="w-4 h-4 text-purple-600" />,
      count: dbState.rfqs_enquiries.length,
      description: 'Direct inquiries & public RFQs with lead routing'
    },
    {
      id: 'quotes',
      name: 'quotes',
      icon: <CheckCircle2 className="w-4 h-4 text-indigo-600" />,
      count: dbState.quotes.length,
      description: 'Commercial supplier quotes, counter-offers, terms'
    },
    {
      id: 'messages',
      name: 'messages',
      icon: <MessageSquare className="w-4 h-4 text-rose-600" />,
      count: dbState.messages.length,
      description: 'Real-time buyer-supplier communication logs'
    },
    {
      id: 'follow_ups',
      name: 'follow_ups',
      icon: <Clock className="w-4 h-4 text-teal-600" />,
      count: dbState.follow_ups.length,
      description: 'Supplier automated lead reminders & follow-ups'
    }
  ];

  const totalRecords = Object.values(dbState).reduce<number>((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0);
  const currentRecords = (dbState[activeTable] || []).filter((r: any) => {
    if (!searchTerm) return true;
    const str = JSON.stringify(r).toLowerCase();
    return str.includes(searchTerm.toLowerCase());
  });

  const currentSchema = TABLE_SCHEMAS[activeTable];

  return (
    <div 
      id="db-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-[6px] animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        id="db-modal-container"
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl border border-[#E8DFE3] w-full max-w-6xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col relative text-[#1C1B1B]"
      >
        
        {/* Top Header Bar */}
        <header className="px-5 py-4 border-b border-[#E8DFE3] flex items-center justify-between bg-[#FCF9F8] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FDE7F3] text-[#B90064] flex items-center justify-center shadow-xs shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#1C1B1B]">
                  Phase 4 Relational Schema &amp; Storage Engine
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  Live &amp; Synced
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF1F5] text-[#B90064] border border-[#E0BEC6]">
                  {totalRecords} Total Records
                </span>
              </div>
              <p className="text-xs text-[#594047] font-medium mt-0.5">
                8 Relational Entities • Foreign Key Indexing • Multi-Supplier Lead Distribution • Real-Time Event Bus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetDatabase}
              className="px-3 py-1.5 rounded-xl border border-[#E8DFE3] bg-white hover:bg-[#FAF1F5] hover:border-[#B90064] text-xs font-bold text-[#594047] hover:text-[#B90064] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Reset all tables to initial seed records"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Seed Data</span>
            </button>

            <button
              id="btn-close-db-modal"
              aria-label="Close Database Inspector"
              title="Close Database Inspector (Esc)"
              onClick={onClose}
              className="w-9 h-9 rounded-xl text-[#594047] hover:text-[#B90064] bg-stone-100 hover:bg-[#FDE7F3] border border-[#E8DFE3] hover:border-[#B90064]/30 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* View Mode Tabs */}
        <div className="px-5 py-2.5 bg-white border-b border-[#E8DFE3] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('supabase')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'supabase'
                  ? 'bg-[#3ECF8E] text-[#1C1B1B] shadow-xs'
                  : 'bg-[#FCF9F8] text-[#594047] hover:bg-[#FAF1F5] hover:text-[#B90064] border border-[#E8DFE3]'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Supabase Cloud DB</span>
              {isSupabaseConfigured() ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('records')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'records'
                  ? 'bg-[#B90064] text-white shadow-xs'
                  : 'bg-[#FCF9F8] text-[#594047] hover:bg-[#FAF1F5] hover:text-[#B90064] border border-[#E8DFE3]'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Record Explorer</span>
            </button>

            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'schema'
                  ? 'bg-[#B90064] text-white shadow-xs'
                  : 'bg-[#FCF9F8] text-[#594047] hover:bg-[#FAF1F5] hover:text-[#B90064] border border-[#E8DFE3]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Schema &amp; Foreign Keys</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-[#B90064] text-white shadow-xs'
                  : 'bg-[#FCF9F8] text-[#594047] hover:bg-[#FAF1F5] hover:text-[#B90064] border border-[#E8DFE3]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lead Routing Simulator</span>
            </button>
          </div>

          {activeTab === 'records' && (
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#8C7077] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search in ${activeTable}...`}
                className="w-full pl-8 pr-3 py-1 bg-[#FCF9F8] border border-[#E8DFE3] rounded-lg text-xs text-[#1C1B1B] focus:outline-none focus:border-[#B90064]"
              />
            </div>
          )}
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-[#FAF1F5]/40">
          
          {/* Table Selector Sidebar */}
          <aside className="w-64 sm:w-72 border-r border-[#E8DFE3] bg-[#FCF9F8] p-3 overflow-y-auto space-y-1 shrink-0 custom-scrollbar">
            <p className="px-2 py-1 text-[11px] font-black text-[#8C7077] uppercase tracking-wider">
              Relational Tables ({tables.length})
            </p>

            {tables.map((tbl) => {
              const isActive = activeTable === tbl.id;
              return (
                <button
                  key={tbl.id}
                  onClick={() => setActiveTable(tbl.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-white shadow-xs border border-[#B90064]/30 text-[#B90064]'
                      : 'hover:bg-white/80 text-[#594047]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1 rounded-lg bg-stone-50 border border-stone-100 shrink-0">
                      {tbl.icon}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold truncate">{tbl.name}</p>
                      <p className="text-[10px] text-[#8C7077] truncate">{tbl.count} records</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    isActive ? 'bg-[#FDE7F3] text-[#B90064]' : 'bg-stone-200 text-stone-700'
                  }`}>
                    {tbl.count}
                  </span>
                </button>
              );
            })}

            {/* Quick Helper Banner */}
            <div className="mt-4 p-3 bg-white rounded-xl border border-[#E8DFE3] space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Relational Integrity</span>
              </div>
              <p className="text-[10px] text-[#594047] leading-relaxed">
                All foreign keys are cross-referenced across users, RFQs, quotes, and chats with cascade protection.
              </p>
            </div>
          </aside>

          {/* Main Table Viewer Area */}
          <main className="flex-1 flex flex-col bg-white overflow-hidden min-h-0">
            
            {/* Table Meta Bar */}
            <div className="p-3.5 border-b border-[#E8DFE3] flex items-center justify-between bg-stone-50/70 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs sm:text-sm font-bold text-[#1C1B1B]">
                    table: <strong className="text-[#B90064]">{activeTable}</strong>
                  </span>
                  <span className="text-xs font-bold text-stone-500">
                    ({currentRecords.length} of {dbState[activeTable]?.length || 0} records)
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5">
                  {currentSchema.description}
                </p>
              </div>

              {activeTable === 'rfqs_enquiries' && onNavigateToScreen && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToScreen('buyer-rfqs');
                  }}
                  className="text-xs font-bold text-[#B90064] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>Open Buyer RFQ View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* TAB 4: SUPABASE CLOUD DATABASE INTEGRATION */}
            {activeTab === 'supabase' && (
              <div className="flex-1 overflow-auto p-5 space-y-5 custom-scrollbar bg-[#FCF9F8]">
                {/* Supabase Status Banner */}
                <div className="p-4 rounded-2xl bg-white border border-[#E8DFE3] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-[#3ECF8E]/15 text-[#3ECF8E] flex items-center justify-center shrink-0 border border-[#3ECF8E]/30">
                      <Cloud className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-black text-[#1C1B1B]">Supabase PostgreSQL Cloud Engine</h3>
                        {isSupabaseConfigured() ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Supabase Configured
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Local Fallback Mode Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#594047] font-medium mt-1">
                        Connect your live Supabase database to persist products, RFQs, quotes, messages, and profiles across real-time PostgreSQL sessions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleTestSupabase}
                      disabled={isTestingSupabase}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF1F5] border border-[#E8DFE3] hover:border-[#B90064] text-xs font-bold text-[#1C1B1B] flex items-center gap-2 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      <Zap className={`w-3.5 h-3.5 text-[#3ECF8E] ${isTestingSupabase ? 'animate-spin' : ''}`} />
                      <span>{isTestingSupabase ? 'Testing...' : 'Test Connection'}</span>
                    </button>

                    <button
                      onClick={handleSyncToSupabase}
                      disabled={isSyncingSupabase}
                      className="px-3.5 py-2 rounded-xl bg-[#3ECF8E] hover:bg-[#34b27b] text-[#1C1B1B] text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
                      <span>{isSyncingSupabase ? 'Syncing Tables...' : 'Sync Tables to Supabase'}</span>
                    </button>
                  </div>
                </div>

                {/* Test Feedback Notice */}
                {supabaseTestStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
                      supabaseTestStatus.connected
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {supabaseTestStatus.connected ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <span>{supabaseTestStatus.message}</span>
                    </div>
                    {supabaseTestStatus.latencyMs && (
                      <span className="text-[10px] font-mono font-bold bg-white/70 px-2 py-0.5 rounded border border-emerald-200">
                        {supabaseTestStatus.latencyMs}ms
                      </span>
                    )}
                  </motion.div>
                )}

                {supabaseSyncMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-medium flex items-center justify-between gap-2"
                  >
                    <span>{supabaseSyncMessage}</span>
                    <button
                      onClick={() => setSupabaseSyncMessage(null)}
                      className="text-purple-700 font-bold hover:underline shrink-0 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </motion.div>
                )}

                {/* Configuration Details & Setup Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Credentials & Environment Setup */}
                  <div className="bg-white p-4 rounded-xl border border-[#E8DFE3] shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-black text-[#1C1B1B]">
                        <KeyRound className="w-4 h-4 text-[#B90064]" />
                        <span>Supabase Credentials Status</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#8C7077]">.env / Secrets</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-[#FCF9F8] border border-[#E8DFE3]">
                        <div className="text-[10px] uppercase font-bold text-[#8C7077]">Project URL (VITE_SUPABASE_URL)</div>
                        <div className="font-mono text-xs text-[#1C1B1B] truncate mt-0.5">
                          {getSupabaseConfigInfo().url || 'https://your-project.supabase.co (defaulting to local fallback)'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#FCF9F8] border border-[#E8DFE3]">
                        <div className="text-[10px] uppercase font-bold text-[#8C7077]">Anon Key (VITE_SUPABASE_ANON_KEY)</div>
                        <div className="font-mono text-xs text-[#1C1B1B] truncate mt-0.5">
                          {getSupabaseConfigInfo().anonKeyTruncated}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E8DFE3] flex items-center justify-between text-[11px] text-[#594047]">
                      <span>Declared in <code className="text-[#B90064] font-mono">.env.example</code></span>
                      <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0050D6] font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Open Supabase Dashboard</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Right Column: 1-Click SQL Schema Copy */}
                  <div className="bg-white p-4 rounded-xl border border-[#E8DFE3] shadow-2xs space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-black text-[#1C1B1B]">
                          <Code2 className="w-4 h-4 text-[#3ECF8E]" />
                          <span>Supabase PostgreSQL Migration SQL</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          8 Tables + FKs
                        </span>
                      </div>
                      <p className="text-xs text-[#594047] mt-1.5 leading-relaxed">
                        Copy the complete DDL schema and paste it into the <strong>SQL Editor</strong> in your Supabase dashboard to create all 8 tables in 1 click.
                      </p>
                    </div>

                    <button
                      onClick={handleCopySupabaseSql}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#1C1B1B] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      {copiedSql ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied SQL Schema to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-stone-300" />
                          <span>Copy Supabase SQL Migration Script</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 8 Tables Synchronization Status Matrix */}
                <div className="bg-white p-4 rounded-xl border border-[#E8DFE3] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E8DFE3] pb-2">
                    <h4 className="text-xs font-black text-[#1C1B1B] uppercase tracking-wider">
                      Relational Database Tables Ready for Supabase ({tables.length})
                    </h4>
                    <span className="text-[11px] font-bold text-[#8C7077]">
                      {totalRecords} Total Local Records Available to Sync
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {tables.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-lg bg-[#FCF9F8] border border-[#E8DFE3] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {t.icon}
                          <span className="font-mono text-xs font-bold text-[#1C1B1B] truncate">{t.name}</span>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white border border-[#E8DFE3] text-[#B90064]">
                          {t.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step by step connection instructions */}
                <div className="bg-white p-4 rounded-xl border border-[#E8DFE3] shadow-2xs space-y-2.5 text-xs text-[#594047]">
                  <h4 className="font-black text-[#1C1B1B] flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[#0050D6]" />
                    <span>How to connect your live Supabase Project in 3 steps:</span>
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs leading-relaxed ml-1">
                    <li>Create a project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[#0050D6] font-bold underline">supabase.com</a>.</li>
                    <li>Go to the <strong>SQL Editor</strong> in Supabase, click <em>New Query</em>, paste the copied SQL schema, and click <strong>Run</strong>.</li>
                    <li>Go to <strong>Project Settings &gt; API</strong>, copy your <code>Project URL</code> and <code>anon public key</code>, and configure them as <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* TAB 1: RECORD EXPLORER */}
            {activeTab === 'records' && (
              <div className="flex-1 overflow-auto p-4 space-y-3 custom-scrollbar">
                {currentRecords.length === 0 ? (
                  <div className="text-center py-12 text-stone-400">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold">No records found matching your search.</p>
                  </div>
                ) : (
                  currentRecords.map((record: any, idx: number) => {
                    const recordId = record.id || `record-${idx}`;
                    const isCopied = copiedId === recordId;
                    return (
                      <div
                        key={recordId}
                        className="p-3.5 bg-[#FCF9F8] rounded-xl border border-[#E8DFE3] hover:border-[#B90064]/40 transition-colors shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between border-b border-[#E8DFE3] pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-black text-[#B90064]">
                              {record.id || `Record #${idx + 1}`}
                            </span>
                            {record.role && (
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#FDE7F3] text-[#B90064]">
                                {record.role}
                              </span>
                            )}
                            {record.status && (
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {record.status}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#8C7077]">
                              {record.created_at ? new Date(record.created_at).toLocaleString() : ''}
                            </span>
                            <button
                              onClick={() => handleCopyJson(record, recordId)}
                              className="px-2 py-0.5 rounded bg-white hover:bg-[#FAF1F5] border border-[#E8DFE3] text-[10px] font-bold text-[#594047] hover:text-[#B90064] flex items-center gap-1 transition-colors cursor-pointer"
                              title="Copy record JSON"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy JSON</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <pre className="text-xs font-mono text-[#1C1B1B] whitespace-pre-wrap overflow-x-auto max-h-56 p-2.5 bg-white rounded-lg border border-[#F0EDEC] leading-relaxed custom-scrollbar">
                          {JSON.stringify(record, null, 2)}
                        </pre>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: SCHEMA & FOREIGN KEYS */}
            {activeTab === 'schema' && (
              <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                <div className="bg-[#FCF9F8] rounded-xl border border-[#E8DFE3] overflow-hidden shadow-2xs">
                  <div className="px-4 py-3 bg-white border-b border-[#E8DFE3] flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#1C1B1B] uppercase tracking-wider">
                        Table Columns &amp; Data Types
                      </h4>
                      <p className="text-[11px] text-[#594047]">
                        Relational schema definition for <strong className="text-[#B90064]">{activeTable}</strong>
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-[#8C7077]">
                      {currentSchema.columns.length} columns defined
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-stone-50 border-b border-[#E8DFE3] text-[#594047] font-bold text-[11px]">
                          <th className="py-2.5 px-4">Column Name</th>
                          <th className="py-2.5 px-4">Data Type</th>
                          <th className="py-2.5 px-4">Key / Relation</th>
                          <th className="py-2.5 px-4">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8DFE3] bg-white">
                        {currentSchema.columns.map((col) => (
                          <tr key={col.name} className="hover:bg-[#FAF1F5]/50 transition-colors">
                            <td className="py-2.5 px-4 font-mono font-bold text-[#1C1B1B]">
                              {col.name}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-[#B90064] text-[11px]">
                              {col.type}
                            </td>
                            <td className="py-2.5 px-4">
                              {col.isPk ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  <KeyRound className="w-3 h-3 text-amber-600" />
                                  PRIMARY KEY
                                </span>
                              ) : col.fkTarget ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                  <ExternalLink className="w-3 h-3 text-sky-600" />
                                  FK → {col.fkTarget}
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#8C7077]">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-[#594047] text-[11px]">
                              {col.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: LEAD ROUTING SIMULATOR */}
            {activeTab === 'simulator' && (
              <div className="flex-1 overflow-auto p-5 custom-scrollbar space-y-4">
                <div className="bg-white p-4 rounded-xl border border-[#E8DFE3] space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2 text-[#B90064]">
                    <Sparkles className="w-4 h-4" />
                    <h4 className="text-sm font-bold">Live Lead Distribution &amp; Multi-Sourcing Test</h4>
                  </div>
                  <p className="text-xs text-[#594047] leading-relaxed">
                    Trigger a broadcast sourcing requirement to test the automated multi-supplier lead distribution logic across verified manufacturers.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-[#1C1B1B] mb-1">Master Category</label>
                      <select
                        value={testLeadCategory}
                        onChange={(e) => {
                          const cat = e.target.value;
                          setTestLeadCategory(cat);
                          const subs = getSubcategoriesForCategoryName(cat);
                          setTestLeadSubcategory(subs[0] || '');
                        }}
                        className="w-full text-xs p-2.5 bg-[#FCF9F8] border border-[#E8DFE3] rounded-lg focus:outline-none focus:border-[#B90064] cursor-pointer"
                      >
                        {Object.keys(CATEGORY_TAXONOMY).map((catKey) => (
                          <option key={catKey} value={catKey}>
                            {catKey}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1C1B1B] mb-1">Subcategory</label>
                      <select
                        value={testLeadSubcategory}
                        onChange={(e) => setTestLeadSubcategory(e.target.value)}
                        className="w-full text-xs p-2.5 bg-[#FCF9F8] border border-[#E8DFE3] rounded-lg focus:outline-none focus:border-[#B90064] cursor-pointer"
                      >
                        {getSubcategoriesForCategoryName(testLeadCategory).map((subKey) => (
                          <option key={subKey} value={subKey}>
                            {subKey}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1C1B1B] mb-1">Requirement Title</label>
                      <input
                        type="text"
                        value={testLeadTitle}
                        onChange={(e) => setTestLeadTitle(e.target.value)}
                        placeholder="Requirement Title"
                        className="w-full text-xs p-2.5 bg-[#FCF9F8] border border-[#E8DFE3] rounded-lg focus:outline-none focus:border-[#B90064]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1C1B1B] mb-1">Quantity (Units)</label>
                      <input
                        type="number"
                        value={testLeadQty}
                        onChange={(e) => setTestLeadQty(e.target.value)}
                        placeholder="Quantity"
                        className="w-full text-xs p-2.5 bg-[#FCF9F8] border border-[#E8DFE3] rounded-lg focus:outline-none focus:border-[#B90064]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      disabled={isSimulating}
                      onClick={handleSimulateLeadRouting}
                      className="bg-[#B90064] hover:bg-[#a00057] disabled:opacity-50 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSimulating ? 'Distributing Lead...' : 'Trigger Multi-Supplier Route'}</span>
                    </button>

                    <span className="text-[11px] text-[#8C7077]">
                      Writes to rfqs_enquiries &amp; generates follow-up queues
                    </span>
                  </div>

                  {simulationResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between gap-2"
                    >
                      <span>{simulationResult}</span>
                      <button 
                        onClick={() => setSimulationResult(null)}
                        className="text-emerald-700 font-bold hover:underline shrink-0 text-xs cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

          </main>

        </div>

        {/* Modal Footer */}
        <footer className="px-5 py-3 border-t border-[#E8DFE3] bg-[#FCF9F8] flex items-center justify-between text-xs text-[#594047] shrink-0">
          <div className="flex items-center gap-2 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">
              Strict B2B Marketplace Logic Active: Lead Routing, RFQ Enquiries &amp; Quote Negotiation
            </span>
            <span className="sm:hidden">
              Strict B2B Marketplace Logic Active
            </span>
          </div>
          <button
            id="btn-done-db-modal"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1C1B1B] hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </footer>

      </motion.div>
    </div>
  );
};
