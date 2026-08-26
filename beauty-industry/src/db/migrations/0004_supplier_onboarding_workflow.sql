-- Nexora supplier journey: auth -> business -> catalog -> review -> verified.
-- This migration is additive and safe to run after the original Phase 4 schema.
ALTER TABLE profiles_supplier
  ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(24) NOT NULL DEFAULT 'business_pending'
    CHECK (onboarding_status IN ('business_pending', 'catalog_pending', 'review', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Public cards and profiles may only expose the trust badge after approval.
CREATE INDEX IF NOT EXISTS profiles_supplier_onboarding_status_idx
  ON profiles_supplier(onboarding_status);

-- Owners can create their initial listing, but approval remains an explicit state
-- transition (admin/service role), never a client-side privilege escalation.
DROP POLICY IF EXISTS supplier_profile_owner_insert ON profiles_supplier;
CREATE POLICY supplier_profile_owner_insert ON profiles_supplier
  FOR INSERT WITH CHECK (auth.uid() = user_id AND onboarding_status = 'business_pending');

CREATE OR REPLACE FUNCTION approve_supplier_onboarding(profile_id UUID, notes TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles_supplier
  SET onboarding_status = 'approved',
      verification_level = 'Nexora Verified',
      is_verified = TRUE,
      reviewed_at = NOW(),
      approved_at = NOW(),
      verification_notes = notes,
      updated_at = NOW()
  WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
