/*
  # Admin System and Visibility Migration

  ## Summary
  This migration adds a comprehensive admin system for managing ski area visibility
  and bulk loading resorts from OpenSkiData.

  ## Changes Made

  1. **ski_areas Table Updates**
     - Add `is_published` flag (visible to users)
     - Add `is_active` flag (soft delete)
     - Add `display_order` for sort control
     - Add `source` field (openskidata, manual, skimap)
     - Add `last_synced_at` timestamp
     - Add `run_count` for quick stats
     - Add `lift_count` for quick stats
     - Add `load_status` (empty, loading, loaded, error)
     - Add `load_error` for error messages

  2. **profiles Table Updates**
     - Add `is_admin` flag for admin access

  3. **admin_logs Table**
     - Track all admin actions

  4. **RLS Policies**
     - Users see only published resorts
     - Admins see all resorts
     - Apply to ski_areas, runs, lifts, points_of_interest

  5. **Initial Data**
     - Mark existing resorts as published
     - Set your user as admin

  ## Notes
  - Preserves all existing data
  - Adds visibility layer without breaking existing features
  - Admin actions are fully audited
*/

-- ==========================================
-- UPDATE SKI_AREAS TABLE
-- ==========================================

ALTER TABLE ski_areas
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS run_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lift_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS load_status TEXT DEFAULT 'empty',
  ADD COLUMN IF NOT EXISTS load_error TEXT;

-- Add elevation fields if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ski_areas' AND column_name = 'elevation_base_m'
  ) THEN
    ALTER TABLE ski_areas ADD COLUMN elevation_base_m INTEGER;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ski_areas' AND column_name = 'elevation_summit_m'
  ) THEN
    ALTER TABLE ski_areas ADD COLUMN elevation_summit_m INTEGER;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ski_areas' AND column_name = 'vertical_m'
  ) THEN
    ALTER TABLE ski_areas ADD COLUMN vertical_m INTEGER;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ski_areas' AND column_name = 'operating_status'
  ) THEN
    ALTER TABLE ski_areas ADD COLUMN operating_status TEXT DEFAULT 'open';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ski_areas' AND column_name = 'map_url'
  ) THEN
    ALTER TABLE ski_areas ADD COLUMN map_url TEXT;
  END IF;
END $$;

-- ==========================================
-- UPDATE PROFILES TABLE
-- ==========================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Set specific user as admin (replace with your actual user ID)
UPDATE profiles
SET is_admin = true
WHERE id = '345c8ec9-d829-461b-aeb1-f88224495dd4';

-- ==========================================
-- CREATE ADMIN_LOGS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_id UUID,
  target_type TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- UPDATE EXISTING RESORTS
-- ==========================================

-- Mark existing resorts as published and loaded
UPDATE ski_areas
SET
  is_published = true,
  is_active = true,
  load_status = 'loaded',
  source = COALESCE(source, 'openskidata'),
  run_count = (SELECT COUNT(*) FROM runs WHERE runs.ski_area_id = ski_areas.id),
  lift_count = (SELECT COUNT(*) FROM lifts WHERE lifts.ski_area_id = ski_areas.id)
WHERE load_status IS NULL OR load_status = 'empty';

-- ==========================================
-- CREATE INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_ski_areas_is_published ON ski_areas(is_published);
CREATE INDEX IF NOT EXISTS idx_ski_areas_is_active ON ski_areas(is_active);
CREATE INDEX IF NOT EXISTS idx_ski_areas_display_order ON ski_areas(display_order);
CREATE INDEX IF NOT EXISTS idx_ski_areas_load_status ON ski_areas(load_status);
CREATE INDEX IF NOT EXISTS idx_ski_areas_published_active ON ski_areas(is_published, is_active);

CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);

-- ==========================================
-- DROP EXISTING RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users see published resorts only" ON ski_areas;
DROP POLICY IF EXISTS "Admins see all resorts" ON ski_areas;
DROP POLICY IF EXISTS "Users see published runs only" ON runs;
DROP POLICY IF EXISTS "Admins see all runs" ON runs;
DROP POLICY IF EXISTS "Users see published lifts only" ON lifts;
DROP POLICY IF EXISTS "Admins see all lifts" ON lifts;
DROP POLICY IF EXISTS "Users see published POIs only" ON points_of_interest;
DROP POLICY IF EXISTS "Admins see all POIs" ON points_of_interest;

-- ==========================================
-- CREATE RLS POLICIES FOR VISIBILITY
-- ==========================================

-- Ski Areas: Users see published, Admins see all
CREATE POLICY "Users see published resorts only"
  ON ski_areas
  FOR SELECT
  TO authenticated
  USING (
    (is_published = true AND is_active = true)
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Runs: Users see runs from published resorts only
CREATE POLICY "Users see published runs only"
  ON runs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ski_areas
      WHERE ski_areas.id = runs.ski_area_id
      AND (
        (ski_areas.is_published = true AND ski_areas.is_active = true)
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.is_admin = true
        )
      )
    )
  );

-- Lifts: Users see lifts from published resorts only
CREATE POLICY "Users see published lifts only"
  ON lifts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ski_areas
      WHERE ski_areas.id = lifts.ski_area_id
      AND (
        (ski_areas.is_published = true AND ski_areas.is_active = true)
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.is_admin = true
        )
      )
    )
  );

-- Points of Interest: Users see POIs from published resorts only
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'points_of_interest') THEN
    EXECUTE 'CREATE POLICY "Users see published POIs only"
      ON points_of_interest
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM ski_areas
          WHERE ski_areas.id = points_of_interest.ski_area_id
          AND (
            (ski_areas.is_published = true AND ski_areas.is_active = true)
            OR EXISTS (
              SELECT 1 FROM profiles
              WHERE profiles.id = auth.uid()
              AND profiles.is_admin = true
            )
          )
        )
      )';
  END IF;
END $$;

-- Admin Logs: Only admins can view
CREATE POLICY "Admins view logs"
  ON admin_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins insert logs"
  ON admin_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_target_id UUID DEFAULT NULL,
  p_target_type TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_logs (admin_user_id, action, target_id, target_type, details)
  VALUES (auth.uid(), p_action, p_target_id, p_target_type, p_details)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin dashboard stats
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
  total_ski_areas INTEGER,
  published_ski_areas INTEGER,
  unpublished_ski_areas INTEGER,
  loading_ski_areas INTEGER,
  error_ski_areas INTEGER,
  total_runs INTEGER,
  total_lifts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM ski_areas WHERE is_active = true) as total_ski_areas,
    (SELECT COUNT(*)::INTEGER FROM ski_areas WHERE is_published = true AND is_active = true) as published_ski_areas,
    (SELECT COUNT(*)::INTEGER FROM ski_areas WHERE is_published = false AND is_active = true) as unpublished_ski_areas,
    (SELECT COUNT(*)::INTEGER FROM ski_areas WHERE load_status = 'loading') as loading_ski_areas,
    (SELECT COUNT(*)::INTEGER FROM ski_areas WHERE load_status = 'error') as error_ski_areas,
    (SELECT COUNT(*)::INTEGER FROM runs) as total_runs,
    (SELECT COUNT(*)::INTEGER FROM lifts) as total_lifts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update resort counts
CREATE OR REPLACE FUNCTION update_resort_counts(p_ski_area_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE ski_areas
  SET
    run_count = (SELECT COUNT(*) FROM runs WHERE ski_area_id = p_ski_area_id),
    lift_count = (SELECT COUNT(*) FROM lifts WHERE ski_area_id = p_ski_area_id)
  WHERE id = p_ski_area_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ADD COMMENTS
-- ==========================================

COMMENT ON COLUMN ski_areas.is_published IS 'Whether resort is visible to regular users';
COMMENT ON COLUMN ski_areas.is_active IS 'Soft delete flag - false hides from everyone except admins';
COMMENT ON COLUMN ski_areas.display_order IS 'Sort order in user-facing resort picker (lower = higher)';
COMMENT ON COLUMN ski_areas.source IS 'Data source: openskidata, manual, or skimap';
COMMENT ON COLUMN ski_areas.last_synced_at IS 'Last time data was fetched from external source';
COMMENT ON COLUMN ski_areas.run_count IS 'Cached count of runs for performance';
COMMENT ON COLUMN ski_areas.lift_count IS 'Cached count of lifts for performance';
COMMENT ON COLUMN ski_areas.load_status IS 'Loading state: empty, loading, loaded, or error';
COMMENT ON COLUMN ski_areas.load_error IS 'Error message if load_status is error';
COMMENT ON COLUMN ski_areas.operating_status IS 'Current operating status: open, closed, or hold';

COMMENT ON COLUMN profiles.is_admin IS 'Admin users can access admin dashboard and manage resorts';

COMMENT ON TABLE admin_logs IS 'Audit log of all admin actions';

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Admin system migration completed!';
  RAISE NOTICE '✅ Visibility system added to ski_areas';
  RAISE NOTICE '✅ Admin flag added to profiles';
  RAISE NOTICE '✅ Admin logs table created';
  RAISE NOTICE '✅ RLS policies updated for visibility control';
  RAISE NOTICE '✅ Helper functions created';
  RAISE NOTICE '🎿 Admin dashboard ready to use!';
END $$;
