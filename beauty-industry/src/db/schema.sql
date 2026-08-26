-- ============================================================================
-- NEXORA LUXE - PHASE 4 POSTGRESQL / SUPABASE DATABASE MIGRATION & RLS SCHEMA
-- ============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('buyer', 'supplier', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILES_BUYER TABLE
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

-- 3. PROFILES_SUPPLIER TABLE
CREATE TABLE IF NOT EXISTS profiles_supplier (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo_url TEXT,
  cover_image_url TEXT,
  business_type VARCHAR(100) NOT NULL,
  verification_level VARCHAR(50) DEFAULT 'Basic' CHECK (verification_level IN ('Basic', 'Business Verified', 'Nexora Verified')),
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

-- 4. PRODUCTS TABLE
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
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive', 'rejected')),
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RFQS_ENQUIRIES TABLE
CREATE TABLE IF NOT EXISTS rfqs_enquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES profiles_buyer(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES profiles_supplier(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  requirement_title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity_required INT NOT NULL,
  quantity_unit VARCHAR(50) DEFAULT 'Units',
  target_budget NUMERIC(12,2),
  delivery_location VARCHAR(255) NOT NULL,
  details TEXT,
  attachments TEXT[],
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'responded', 'negotiating', 'closed')),
  type VARCHAR(20) DEFAULT 'direct_enquiry' CHECK (type IN ('direct_enquiry', 'public_rfq')),
  send_to_similar_suppliers BOOLEAN DEFAULT TRUE,
  matched_supplier_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. QUOTES TABLE
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID NOT NULL REFERENCES rfqs_enquiries(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES profiles_supplier(id) ON DELETE CASCADE,
  unit_price NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  moq_offered INT NOT NULL,
  lead_time VARCHAR(100) NOT NULL,
  validity_date TIMESTAMPTZ NOT NULL,
  terms_and_conditions TEXT,
  attachment_url TEXT,
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'rejected', 'negotiating')),
  sample_available BOOLEAN DEFAULT FALSE,
  sample_cost NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  counter_offer_price NUMERIC(12,2),
  counter_offer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id VARCHAR(255) NOT NULL,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rfq_id UUID REFERENCES rfqs_enquiries(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  message_body TEXT NOT NULL,
  attachments TEXT[],
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- 8. FOLLOW_UPS TABLE
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES profiles_supplier(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles_buyer(id) ON DELETE CASCADE,
  rfq_id UUID NOT NULL REFERENCES rfqs_enquiries(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  note TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'snoozed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles_buyer ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles_supplier ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check if current authenticated user is a verified supplier
CREATE OR REPLACE FUNCTION is_verified_supplier(supplier_profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles_supplier
    WHERE id = supplier_profile_id
      AND user_id = auth.uid()
      AND is_verified = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Users policy
DROP POLICY IF EXISTS users_self_access ON users;
CREATE POLICY users_self_access ON users
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. Buyer Profiles policy
DROP POLICY IF EXISTS buyer_profile_self_access ON profiles_buyer;
CREATE POLICY buyer_profile_self_access ON profiles_buyer
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Supplier Profiles policy (Public Read, Owner Update)
DROP POLICY IF EXISTS supplier_profile_public_read ON profiles_supplier;
CREATE POLICY supplier_profile_public_read ON profiles_supplier
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS supplier_profile_owner_update ON profiles_supplier;
CREATE POLICY supplier_profile_owner_update ON profiles_supplier
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Products policy (Public Read Active, Verified Supplier Owner Manage)
DROP POLICY IF EXISTS products_public_read ON products;
CREATE POLICY products_public_read ON products
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS products_supplier_owner_manage ON products;
CREATE POLICY products_supplier_owner_manage ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles_supplier
      WHERE profiles_supplier.id = products.supplier_id
        AND profiles_supplier.user_id = auth.uid()
        AND profiles_supplier.is_verified = TRUE
    )
  );

-- 5. RFQs & Enquiries policy
-- Authenticated buyers can view and manage their own inquiries
DROP POLICY IF EXISTS rfqs_buyer_own_inquiries ON rfqs_enquiries;
CREATE POLICY rfqs_buyer_own_inquiries ON rfqs_enquiries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles_buyer
      WHERE profiles_buyer.id = rfqs_enquiries.buyer_id
        AND profiles_buyer.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles_buyer
      WHERE profiles_buyer.id = rfqs_enquiries.buyer_id
        AND profiles_buyer.user_id = auth.uid()
    )
  );

-- Only verified suppliers can access leads targeted to their unique profiles_supplier ID or matched_supplier_ids
DROP POLICY IF EXISTS rfqs_verified_supplier_leads ON rfqs_enquiries;
CREATE POLICY rfqs_verified_supplier_leads ON rfqs_enquiries
  FOR SELECT USING (
    (type = 'public_rfq' AND EXISTS (
      SELECT 1 FROM profiles_supplier
      WHERE profiles_supplier.user_id = auth.uid()
        AND profiles_supplier.is_verified = TRUE
    ))
    OR
    EXISTS (
      SELECT 1 FROM profiles_supplier
      WHERE profiles_supplier.user_id = auth.uid()
        AND profiles_supplier.is_verified = TRUE
        AND (
          profiles_supplier.id = rfqs_enquiries.supplier_id
          OR profiles_supplier.id = ANY(rfqs_enquiries.matched_supplier_ids)
        )
    )
  );

-- 6. Quotes policy
DROP POLICY IF EXISTS quotes_verified_supplier_manage ON quotes;
CREATE POLICY quotes_verified_supplier_manage ON quotes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles_supplier
      WHERE profiles_supplier.id = quotes.supplier_id
        AND profiles_supplier.user_id = auth.uid()
        AND profiles_supplier.is_verified = TRUE
    )
  );

DROP POLICY IF EXISTS quotes_buyer_view_received ON quotes;
CREATE POLICY quotes_buyer_view_received ON quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rfqs_enquiries rfq
      JOIN profiles_buyer buyer ON buyer.id = rfq.buyer_id
      WHERE rfq.id = quotes.rfq_id
        AND buyer.user_id = auth.uid()
    )
  );

-- 7. Messages policy
DROP POLICY IF EXISTS messages_authenticated_participants ON messages;
CREATE POLICY messages_authenticated_participants ON messages
  FOR ALL USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id OR
    EXISTS (
      SELECT 1 FROM profiles_supplier
      WHERE profiles_supplier.user_id = auth.uid()
        AND profiles_supplier.is_verified = TRUE
        AND (
          messages.receiver_id = profiles_supplier.user_id OR
          messages.sender_id = profiles_supplier.user_id
        )
    )
  )
  WITH CHECK (auth.uid() = sender_id);

-- 8. Follow-ups policy
DROP POLICY IF EXISTS follow_ups_verified_supplier_only ON follow_ups;
CREATE POLICY follow_ups_verified_supplier_only ON follow_ups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles_supplier
      WHERE profiles_supplier.id = follow_ups.supplier_id
        AND profiles_supplier.user_id = auth.uid()
        AND profiles_supplier.is_verified = TRUE
    )
  );

-- 9. USER_LOCATIONS TABLE (authenticated live coordinate sync)
CREATE TABLE IF NOT EXISTS user_locations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  source VARCHAR(50) DEFAULT 'browser_geolocation',
  is_active BOOLEAN DEFAULT TRUE,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_user_location_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_synced_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_locations_updated_at ON user_locations;
CREATE TRIGGER trg_user_locations_updated_at
  BEFORE UPDATE ON user_locations
  FOR EACH ROW
  EXECUTE FUNCTION set_user_location_updated_at();

ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_locations_owner_select ON user_locations;
CREATE POLICY user_locations_owner_select ON user_locations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_locations_owner_insert ON user_locations;
CREATE POLICY user_locations_owner_insert ON user_locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_locations_owner_update ON user_locations;
CREATE POLICY user_locations_owner_update ON user_locations
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_locations_owner_delete ON user_locations;
CREATE POLICY user_locations_owner_delete ON user_locations
  FOR DELETE USING (auth.uid() = user_id);
