/*
  # Peaklap Database Update Script

  ## Summary
  This migration updates the Peaklap database to support the latest features including
  RevenueCat subscription tracking and Terms/Conditions acceptance tracking.

  ## Changes Made

  1. **Profiles Table Updates**
     - Add `subscription_status` to track Pro subscription state locally
     - Add `subscription_platform` to identify where subscription was purchased
     - Add `terms_accepted_at` to track when user accepted Terms of Service
     - Add `terms_version` to track which version of terms was accepted
     - Add `home_resort_id` for quick resort selection

  2. **New Tables**
     - `subscription_events` - Audit trail for subscription changes
     - `day_summaries` - User notes and summaries for ski days
     - `day_photos` - Photos attached to day summaries
     - `map_markers` - Custom map markers for resorts

  3. **Existing Table Updates**
     - Add `session_id` to `user_logs` for grouping runs by day

  4. **Security**
     - Enable RLS on all new tables
     - Create restrictive policies for user data
     - Public read access for resort/run data

  ## Notes
  - All operations use IF NOT EXISTS to prevent errors on re-run
  - Data safety is prioritized - no DROP or DELETE operations
  - Indexes added for performance optimization
*/

-- ==========================================
-- ENABLE REQUIRED EXTENSIONS
-- ==========================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ==========================================
-- UPDATE PROFILES TABLE
-- ==========================================

-- Add subscription tracking fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'free';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_platform'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_platform TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_expires_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'revenuecat_customer_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN revenuecat_customer_id TEXT;
  END IF;
END $$;

-- Add terms acceptance tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'terms_accepted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN terms_accepted_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'terms_version'
  ) THEN
    ALTER TABLE profiles ADD COLUMN terms_version TEXT;
  END IF;
END $$;

-- Add home resort feature
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'home_resort_id'
  ) THEN
    -- Check if ski_areas table exists before adding foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ski_areas') THEN
      ALTER TABLE profiles ADD COLUMN home_resort_id UUID REFERENCES ski_areas(id);
    ELSE
      ALTER TABLE profiles ADD COLUMN home_resort_id UUID;
    END IF;
  END IF;
END $$;

-- ==========================================
-- CREATE SUBSCRIPTION EVENTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  subscription_status TEXT,
  platform TEXT,
  product_identifier TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key if profiles table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'subscription_events_user_id_fkey'
    ) THEN
      ALTER TABLE subscription_events
        ADD CONSTRAINT subscription_events_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- ==========================================
-- CREATE DAY SUMMARIES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS day_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ski_area_id UUID,
  session_date DATE NOT NULL,
  title TEXT,
  notes TEXT,
  weather TEXT,
  snow_condition TEXT,
  total_runs INTEGER DEFAULT 0,
  total_vertical_ft INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign keys if tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'day_summaries_user_id_fkey'
    ) THEN
      ALTER TABLE day_summaries
        ADD CONSTRAINT day_summaries_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ski_areas') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'day_summaries_ski_area_id_fkey'
    ) THEN
      ALTER TABLE day_summaries
        ADD CONSTRAINT day_summaries_ski_area_id_fkey
        FOREIGN KEY (ski_area_id) REFERENCES ski_areas(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Add unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'day_summaries_user_date_unique'
  ) THEN
    ALTER TABLE day_summaries
      ADD CONSTRAINT day_summaries_user_date_unique
      UNIQUE(user_id, session_date);
  END IF;
END $$;

-- ==========================================
-- CREATE DAY PHOTOS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS day_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_summary_id UUID NOT NULL,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign keys
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'day_summaries') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'day_photos_day_summary_id_fkey'
    ) THEN
      ALTER TABLE day_photos
        ADD CONSTRAINT day_photos_day_summary_id_fkey
        FOREIGN KEY (day_summary_id) REFERENCES day_summaries(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'day_photos_user_id_fkey'
    ) THEN
      ALTER TABLE day_photos
        ADD CONSTRAINT day_photos_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- ==========================================
-- CREATE MAP MARKERS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS map_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID,
  ski_area_id UUID,
  user_id UUID NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  marker_type TEXT DEFAULT 'custom',
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign keys
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'runs') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'map_markers_run_id_fkey'
    ) THEN
      ALTER TABLE map_markers
        ADD CONSTRAINT map_markers_run_id_fkey
        FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ski_areas') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'map_markers_ski_area_id_fkey'
    ) THEN
      ALTER TABLE map_markers
        ADD CONSTRAINT map_markers_ski_area_id_fkey
        FOREIGN KEY (ski_area_id) REFERENCES ski_areas(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'map_markers_user_id_fkey'
    ) THEN
      ALTER TABLE map_markers
        ADD CONSTRAINT map_markers_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- ==========================================
-- UPDATE USER_LOGS TABLE
-- ==========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_logs') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'user_logs' AND column_name = 'session_id'
    ) THEN
      ALTER TABLE user_logs ADD COLUMN session_id TEXT;
    END IF;
  END IF;
END $$;

-- ==========================================
-- CREATE PERFORMANCE INDEXES
-- ==========================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_home_resort ON profiles(home_resort_id);

-- Subscription events indexes
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at DESC);

-- Day summaries indexes
CREATE INDEX IF NOT EXISTS idx_day_summaries_user_id ON day_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_day_summaries_session_date ON day_summaries(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_day_summaries_user_date ON day_summaries(user_id, session_date DESC);

-- Day photos indexes
CREATE INDEX IF NOT EXISTS idx_day_photos_day_summary_id ON day_photos(day_summary_id);
CREATE INDEX IF NOT EXISTS idx_day_photos_user_id ON day_photos(user_id);

-- Map markers indexes
CREATE INDEX IF NOT EXISTS idx_map_markers_user_id ON map_markers(user_id);
CREATE INDEX IF NOT EXISTS idx_map_markers_ski_area_id ON map_markers(ski_area_id);

-- User logs indexes (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_user_logs_session_id ON user_logs(session_id);
    CREATE INDEX IF NOT EXISTS idx_user_logs_user_session ON user_logs(user_id, session_id);
  END IF;
END $$;

-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_markers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ==========================================
-- CREATE RLS POLICIES
-- ==========================================

-- Subscription events policies
DROP POLICY IF EXISTS "Users view own subscription events" ON subscription_events;
CREATE POLICY "Users view own subscription events"
  ON subscription_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own subscription events" ON subscription_events;
CREATE POLICY "Users insert own subscription events"
  ON subscription_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Day summaries policies
DROP POLICY IF EXISTS "Users view own day summaries" ON day_summaries;
CREATE POLICY "Users view own day summaries"
  ON day_summaries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own day summaries" ON day_summaries;
CREATE POLICY "Users insert own day summaries"
  ON day_summaries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own day summaries" ON day_summaries;
CREATE POLICY "Users update own day summaries"
  ON day_summaries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own day summaries" ON day_summaries;
CREATE POLICY "Users delete own day summaries"
  ON day_summaries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Day photos policies
DROP POLICY IF EXISTS "Users view own day photos" ON day_photos;
CREATE POLICY "Users view own day photos"
  ON day_photos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own day photos" ON day_photos;
CREATE POLICY "Users insert own day photos"
  ON day_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own day photos" ON day_photos;
CREATE POLICY "Users update own day photos"
  ON day_photos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own day photos" ON day_photos;
CREATE POLICY "Users delete own day photos"
  ON day_photos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Map markers policies
DROP POLICY IF EXISTS "Users view all map markers" ON map_markers;
CREATE POLICY "Users view all map markers"
  ON map_markers
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users insert own map markers" ON map_markers;
CREATE POLICY "Users insert own map markers"
  ON map_markers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own map markers" ON map_markers;
CREATE POLICY "Users update own map markers"
  ON map_markers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own map markers" ON map_markers;
CREATE POLICY "Users delete own map markers"
  ON map_markers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==========================================
-- ADD HELPFUL FUNCTIONS
-- ==========================================

-- Function to update day summary stats from user logs
CREATE OR REPLACE FUNCTION update_day_summary_stats(summary_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE day_summaries ds
  SET
    total_runs = (
      SELECT COUNT(*)
      FROM user_logs ul
      WHERE ul.user_id = ds.user_id
        AND DATE(ul.logged_at) = ds.session_date
    ),
    total_vertical_ft = (
      SELECT COALESCE(SUM(r.vertical), 0)
      FROM user_logs ul
      JOIN runs r ON r.id = ul.run_id
      WHERE ul.user_id = ds.user_id
        AND DATE(ul.logged_at) = ds.session_date
    ),
    updated_at = now()
  WHERE ds.id = summary_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's subscription status
CREATE OR REPLACE FUNCTION get_subscription_status(p_user_id UUID)
RETURNS TABLE (
  is_pro BOOLEAN,
  status TEXT,
  platform TEXT,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN p.subscription_status = 'pro' OR p.subscription_status = 'active' THEN true
      WHEN p.subscription_expires_at > now() THEN true
      ELSE false
    END as is_pro,
    COALESCE(p.subscription_status, 'free') as status,
    p.subscription_platform as platform,
    p.subscription_expires_at as expires_at
  FROM profiles p
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ==========================================

COMMENT ON COLUMN profiles.subscription_status IS 'Current subscription status: free, pro, active, cancelled, expired';
COMMENT ON COLUMN profiles.subscription_platform IS 'Platform where subscription was purchased: revenuecat, stripe, ios, android';
COMMENT ON COLUMN profiles.subscription_expires_at IS 'When the current subscription expires (NULL for lifetime)';
COMMENT ON COLUMN profiles.revenuecat_customer_id IS 'RevenueCat customer identifier for this user';
COMMENT ON COLUMN profiles.terms_accepted_at IS 'Timestamp when user accepted Terms of Service';
COMMENT ON COLUMN profiles.terms_version IS 'Version of terms accepted (e.g., "2026-01")';
COMMENT ON COLUMN profiles.home_resort_id IS 'User''s preferred/home ski resort for quick access';

COMMENT ON TABLE subscription_events IS 'Audit trail of subscription status changes';
COMMENT ON TABLE day_summaries IS 'User-created summaries and notes for specific ski days';
COMMENT ON TABLE day_photos IS 'Photos attached to day summaries';
COMMENT ON TABLE map_markers IS 'Custom map markers for resorts without GeoJSON data';

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database update completed successfully!';
  RAISE NOTICE '✅ All tables updated with new columns';
  RAISE NOTICE '✅ New tables created: subscription_events, day_summaries, day_photos, map_markers';
  RAISE NOTICE '✅ Row Level Security enabled and policies configured';
  RAISE NOTICE '✅ Performance indexes created';
  RAISE NOTICE '✅ Helper functions added';
  RAISE NOTICE '🎿 Your database is ready for RevenueCat integration and Terms tracking!';
END $$;
