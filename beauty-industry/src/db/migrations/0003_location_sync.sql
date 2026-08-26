-- ============================================================================
-- NEXORA LUXE - MIGRATION 0003: AUTHENTICATED LOCATION SYNCHRONIZATION
-- ============================================================================
-- Adds a single-row-per-user location table for live coordinate synchronization.
--
-- Security:
-- - The client uses the anon key only.
-- - Row Level Security is enabled so the authenticated user can only read,
--   insert, and update their OWN location row (auth.uid() = user_id).
-- - No service_role is used by the application.
-- ============================================================================

-- 9. USER_LOCATIONS TABLE
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

-- Keep the update timestamp current on every write.
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

-- RLS
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Authenticated users may read their own live location.
DROP POLICY IF EXISTS user_locations_owner_select ON user_locations;
CREATE POLICY user_locations_owner_select ON user_locations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users may insert/update their own live location only.
DROP POLICY IF EXISTS user_locations_owner_insert ON user_locations;
CREATE POLICY user_locations_owner_insert ON user_locations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_locations_owner_update ON user_locations;
CREATE POLICY user_locations_owner_update ON user_locations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users may delete their own location row during cleanup.
DROP POLICY IF EXISTS user_locations_owner_delete ON user_locations;
CREATE POLICY user_locations_owner_delete ON user_locations
  FOR DELETE
  USING (auth.uid() = user_id);
