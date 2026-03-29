/*
  # Peaklap Base Schema

  ## Summary
  This migration creates the complete base schema for the Peaklap ski tracking application.
  
  ## Tables Created
  
  1. **ski_areas** - Ski resorts and their information
  2. **runs** - Ski runs within resorts
  3. **lifts** - Ski lifts within resorts
  4. **points_of_interest** - POIs like lodges, restaurants
  5. **profiles** - User profiles linked to auth
  6. **user_logs** - User activity tracking
  7. **bucket_list** - User's saved runs
  8. **waitlist** - Email waitlist
  
  ## Security
  - RLS enabled on all tables
  - Public read for resort data
  - Private user data access
*/

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==========================================
-- SKI AREAS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS ski_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  boundary JSONB,
  geom GEOMETRY(Geometry, 4326),
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  elevation_base_m INTEGER,
  elevation_summit_m INTEGER,
  vertical_m INTEGER,
  operating_status TEXT DEFAULT 'open',
  map_url TEXT,
  website TEXT,
  country TEXT,
  region TEXT,
  area_type TEXT,
  osm_id TEXT,
  skimap_id INTEGER,
  is_published BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  source TEXT DEFAULT 'manual',
  last_synced_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  lift_count INTEGER DEFAULT 0,
  load_status TEXT DEFAULT 'empty',
  load_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- RUNS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ski_area_id UUID NOT NULL REFERENCES ski_areas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  difficulty TEXT,
  piste_difficulty TEXT,
  piste_type TEXT,
  grooming TEXT,
  ref TEXT,
  description TEXT,
  vertical_ft INTEGER,
  length_m NUMERIC,
  zone TEXT,
  geom GEOMETRY(LineString, 4326),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- LIFTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS lifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ski_area_id UUID NOT NULL REFERENCES ski_areas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lift_type TEXT,
  aerialway TEXT,
  capacity INTEGER,
  ref TEXT,
  geom GEOMETRY(LineString, 4326),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- POINTS OF INTEREST TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS points_of_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ski_area_id UUID NOT NULL REFERENCES ski_areas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  poi_type TEXT,
  description TEXT,
  lat NUMERIC,
  lng NUMERIC,
  geom GEOMETRY(Point, 4326),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- PROFILES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  sport TEXT,
  difficulty_preference TEXT,
  shred_style TEXT,
  preferred_time TEXT,
  social_style TEXT,
  wants_notifications BOOLEAN DEFAULT false,
  season_goal_days INTEGER,
  season_goal_vertical_ft INTEGER,
  difficulty_region TEXT DEFAULT 'NA',
  onboarding_complete BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  subscription_status TEXT DEFAULT 'free',
  subscription_platform TEXT,
  subscription_expires_at TIMESTAMPTZ,
  revenuecat_customer_id TEXT,
  terms_accepted_at TIMESTAMPTZ,
  terms_version TEXT,
  home_resort_id UUID REFERENCES ski_areas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- USER LOGS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS user_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
  poi_id UUID REFERENCES points_of_interest(id) ON DELETE SET NULL,
  ski_area_id UUID REFERENCES ski_areas(id) ON DELETE SET NULL,
  logged_at TIMESTAMPTZ DEFAULT now(),
  snow_condition TEXT,
  notes TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- BUCKET LIST TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS bucket_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, run_id)
);

-- ==========================================
-- WAITLIST TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- SUBSCRIPTION EVENTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  subscription_status TEXT,
  platform TEXT,
  product_identifier TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- DAY SUMMARIES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS day_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ski_area_id UUID REFERENCES ski_areas(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  title TEXT,
  notes TEXT,
  weather TEXT,
  snow_condition TEXT,
  total_runs INTEGER DEFAULT 0,
  total_vertical_ft INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, session_date)
);

-- ==========================================
-- DAY PHOTOS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS day_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_summary_id UUID NOT NULL REFERENCES day_summaries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- MAP MARKERS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS map_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
  ski_area_id UUID REFERENCES ski_areas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  marker_type TEXT DEFAULT 'custom',
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- ADMIN LOGS TABLE
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
-- CREATE INDEXES
-- ==========================================

-- Ski areas indexes
CREATE INDEX IF NOT EXISTS idx_ski_areas_name ON ski_areas(name);
CREATE INDEX IF NOT EXISTS idx_ski_areas_country ON ski_areas(country);
CREATE INDEX IF NOT EXISTS idx_ski_areas_osm_id ON ski_areas(osm_id);
CREATE INDEX IF NOT EXISTS idx_ski_areas_skimap_id ON ski_areas(skimap_id);
CREATE INDEX IF NOT EXISTS idx_ski_areas_is_published ON ski_areas(is_published);
CREATE INDEX IF NOT EXISTS idx_ski_areas_is_active ON ski_areas(is_active);
CREATE INDEX IF NOT EXISTS idx_ski_areas_published_active ON ski_areas(is_published, is_active);

-- Runs indexes
CREATE INDEX IF NOT EXISTS idx_runs_ski_area_id ON runs(ski_area_id);
CREATE INDEX IF NOT EXISTS idx_runs_difficulty ON runs(difficulty);
CREATE INDEX IF NOT EXISTS idx_runs_piste_difficulty ON runs(piste_difficulty);
CREATE INDEX IF NOT EXISTS idx_runs_zone ON runs(zone);

-- Lifts indexes
CREATE INDEX IF NOT EXISTS idx_lifts_ski_area_id ON lifts(ski_area_id);
CREATE INDEX IF NOT EXISTS idx_lifts_aerialway ON lifts(aerialway);

-- POI indexes
CREATE INDEX IF NOT EXISTS idx_poi_ski_area_id ON points_of_interest(ski_area_id);

-- User logs indexes
CREATE INDEX IF NOT EXISTS idx_user_logs_user_id ON user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_run_id ON user_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_logged_at ON user_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_logs_session_id ON user_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_user_session ON user_logs(user_id, session_id);

-- Bucket list indexes
CREATE INDEX IF NOT EXISTS idx_bucket_list_user_id ON bucket_list(user_id);
CREATE INDEX IF NOT EXISTS idx_bucket_list_run_id ON bucket_list(run_id);

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
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

-- Admin logs indexes
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE ski_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_of_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- CREATE RLS POLICIES
-- ==========================================

-- Ski areas: Users see published, admins see all
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

CREATE POLICY "Admins manage all resorts"
  ON ski_areas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Runs: Users see published resorts' runs
CREATE POLICY "Users see published runs"
  ON runs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ski_areas
      WHERE ski_areas.id = runs.ski_area_id
      AND ski_areas.is_published = true
      AND ski_areas.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Lifts: Users see published resorts' lifts
CREATE POLICY "Users see published lifts"
  ON lifts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ski_areas
      WHERE ski_areas.id = lifts.ski_area_id
      AND ski_areas.is_published = true
      AND ski_areas.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- POIs: Users see published resorts' POIs
CREATE POLICY "Users see published POIs"
  ON points_of_interest
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ski_areas
      WHERE ski_areas.id = points_of_interest.ski_area_id
      AND ski_areas.is_published = true
      AND ski_areas.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Profiles: Users manage their own profile
CREATE POLICY "Users read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- User logs: Users manage their own logs
CREATE POLICY "Users manage own logs"
  ON user_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Bucket list: Users manage their own bucket list
CREATE POLICY "Users manage own bucket list"
  ON bucket_list
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Waitlist: Anyone can join
CREATE POLICY "Anyone can join waitlist"
  ON waitlist
  FOR INSERT
  WITH CHECK (true);

-- Subscription events: Users manage their own
CREATE POLICY "Users view own subscription events"
  ON subscription_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own subscription events"
  ON subscription_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Day summaries: Users manage their own
CREATE POLICY "Users manage own day summaries"
  ON day_summaries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Day photos: Users manage their own
CREATE POLICY "Users manage own day photos"
  ON day_photos
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Map markers: Users see all, manage their own
CREATE POLICY "Users view all map markers"
  ON map_markers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users manage own map markers"
  ON map_markers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own map markers"
  ON map_markers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own map markers"
  ON map_markers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin logs: Admins only
CREATE POLICY "Admins view admin logs"
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