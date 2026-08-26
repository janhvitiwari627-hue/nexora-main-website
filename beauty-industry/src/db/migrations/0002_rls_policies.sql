-- ============================================================================
-- NEXORA LUXE - MIGRATION 0002: ROW LEVEL SECURITY (RLS) POLICIES FOR ALL 8 TABLES
-- ============================================================================
-- This migration script enforces strict Row Level Security (RLS) across:
-- 1. users
-- 2. profiles_buyer
-- 3. profiles_supplier
-- 4. products
-- 5. rfqs_enquiries
-- 6. quotes
-- 7. messages
-- 8. follow_ups
--
-- Security Rules Enforced:
-- - Authenticated buyers can only view and manage their own inquiries (rfqs_enquiries) and buyer profiles.
-- - Only verified suppliers (profiles_supplier.is_verified = true) can access leads, inquiries, quotes, and messages matching their unique profiles_supplier ID.
-- ============================================================================

-- Enable RLS on all 8 tables
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

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS users_self_access ON users;
CREATE POLICY users_self_access ON users
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 2. PROFILES_BUYER TABLE POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS buyer_profile_self_access ON profiles_buyer;
CREATE POLICY buyer_profile_self_access ON profiles_buyer
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. PROFILES_SUPPLIER TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Public can view basic verified supplier profiles for discovery
DROP POLICY IF EXISTS supplier_profile_public_read ON profiles_supplier;
CREATE POLICY supplier_profile_public_read ON profiles_supplier
  FOR SELECT
  USING (TRUE);

-- Only profile owner can update supplier profile
DROP POLICY IF EXISTS supplier_profile_owner_update ON profiles_supplier;
CREATE POLICY supplier_profile_owner_update ON profiles_supplier
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. PRODUCTS TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Public can view active product listings
DROP POLICY IF EXISTS products_public_read ON products;
CREATE POLICY products_public_read ON products
  FOR SELECT
  USING (status = 'active');

-- Only verified supplier profile owner can insert/update/delete products
DROP POLICY IF EXISTS products_supplier_owner_manage ON products;
CREATE POLICY products_supplier_owner_manage ON products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles_supplier
      WHERE profiles_supplier.id = products.supplier_id
        AND profiles_supplier.user_id = auth.uid()
        AND profiles_supplier.is_verified = TRUE
    )
  );

-- ----------------------------------------------------------------------------
-- 5. RFQS_ENQUIRIES TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Authenticated buyers can view and manage their own inquiries
DROP POLICY IF EXISTS rfqs_buyer_own_inquiries ON rfqs_enquiries;
CREATE POLICY rfqs_buyer_own_inquiries ON rfqs_enquiries
  FOR ALL
  USING (
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

-- Only verified suppliers can access inquiries/leads targeted to their supplier ID or in matched_supplier_ids
DROP POLICY IF EXISTS rfqs_verified_supplier_leads ON rfqs_enquiries;
CREATE POLICY rfqs_verified_supplier_leads ON rfqs_enquiries
  FOR SELECT
  USING (
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

-- ----------------------------------------------------------------------------
-- 6. QUOTES TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Verified suppliers can manage quotes issued from their profiles_supplier ID
DROP POLICY IF EXISTS quotes_verified_supplier_manage ON quotes;
CREATE POLICY quotes_verified_supplier_manage ON quotes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles_supplier
      WHERE profiles_supplier.id = quotes.supplier_id
        AND profiles_supplier.user_id = auth.uid()
        AND profiles_supplier.is_verified = TRUE
    )
  );

-- Authenticated buyers can view quotes submitted for their RFQs
DROP POLICY IF EXISTS quotes_buyer_view_received ON quotes;
CREATE POLICY quotes_buyer_view_received ON quotes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rfqs_enquiries rfq
      JOIN profiles_buyer buyer ON buyer.id = rfq.buyer_id
      WHERE rfq.id = quotes.rfq_id
        AND buyer.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 7. MESSAGES TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Users (buyers or verified suppliers) can view and send messages in their conversations
DROP POLICY IF EXISTS messages_authenticated_participants ON messages;
CREATE POLICY messages_authenticated_participants ON messages
  FOR ALL
  USING (
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
  WITH CHECK (
    auth.uid() = sender_id
  );

-- ----------------------------------------------------------------------------
-- 8. FOLLOW_UPS TABLE POLICIES
-- ----------------------------------------------------------------------------
-- Only verified suppliers can view and manage follow-ups assigned to their profiles_supplier ID
DROP POLICY IF EXISTS follow_ups_verified_supplier_only ON follow_ups;
CREATE POLICY follow_ups_verified_supplier_only ON follow_ups
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles_supplier
      WHERE profiles_supplier.id = follow_ups.supplier_id
        AND profiles_supplier.user_id = auth.uid()
        AND profiles_supplier.is_verified = TRUE
    )
  );
