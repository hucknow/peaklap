-- Missing Supabase Tables and Configuration
-- Run this SQL in your Supabase SQL Editor

-- ==========================================
-- 1. ENABLE POSTGIS (if not already enabled)
-- ==========================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==========================================
-- 2. CREATE MISSING TABLES
-- ==========================================

-- User Profiles (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
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
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Activity Logs (for tracking runs)
CREATE TABLE IF NOT EXISTS user_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
  poi_id UUID REFERENCES points_of_interest(id) ON DELETE SET NULL,
  ski_area_id UUID REFERENCES ski_areas(id) ON DELETE SET NULL,
  logged_at TIMESTAMPTZ DEFAULT now(),
  snow_condition TEXT,
  notes TEXT,
  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bucket List (runs users want to complete)
CREATE TABLE IF NOT EXISTS bucket_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, run_id)
);

-- Waitlist (for Sendit Pro feature)
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ==========================================

-- Indexes on user_logs for fast queries
CREATE INDEX IF NOT EXISTS idx_user_logs_user_id ON user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_run_id ON user_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_logged_at ON user_logs(logged_at DESC);

-- Indexes on bucket_list
CREATE INDEX IF NOT EXISTS idx_bucket_list_user_id ON bucket_list(user_id);
CREATE INDEX IF NOT EXISTS idx_bucket_list_run_id ON bucket_list(run_id);

-- Indexes on runs for filtering
CREATE INDEX IF NOT EXISTS idx_runs_difficulty ON runs(difficulty);
CREATE INDEX IF NOT EXISTS idx_runs_zone ON runs(zone);
CREATE INDEX IF NOT EXISTS idx_runs_ski_area_id ON runs(ski_area_id);

-- ==========================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- If not already enabled on existing tables:
ALTER TABLE ski_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_of_interest ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 5. CREATE ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Public read access to ski data
DROP POLICY IF EXISTS "Public read ski_areas" ON ski_areas;
CREATE POLICY "Public read ski_areas" ON ski_areas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read lifts" ON lifts;
CREATE POLICY "Public read lifts" ON lifts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read runs" ON runs;
CREATE POLICY "Public read runs" ON runs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read points_of_interest" ON points_of_interest;
CREATE POLICY "Public read points_of_interest" ON points_of_interest FOR SELECT USING (true);

-- Profile policies (users manage their own profile)
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
CREATE POLICY "Users insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User logs policies (users manage their own logs)
DROP POLICY IF EXISTS "Users manage own logs" ON user_logs;
CREATE POLICY "Users manage own logs" ON user_logs 
  FOR ALL USING (auth.uid() = user_id);

-- Bucket list policies (users manage their own bucket list)
DROP POLICY IF EXISTS "Users manage own bucket list" ON bucket_list;
CREATE POLICY "Users manage own bucket list" ON bucket_list 
  FOR ALL USING (auth.uid() = user_id);

-- Waitlist policy (anyone can join)
DROP POLICY IF EXISTS "Anyone can join waitlist" ON waitlist;
CREATE POLICY "Anyone can join waitlist" ON waitlist 
  FOR INSERT WITH CHECK (true);

-- ==========================================
-- 6. VERIFICATION QUERIES
-- ==========================================

-- Check all tables exist
SELECT 
  'ski_areas' as table_name, COUNT(*) as count FROM ski_areas
UNION ALL
SELECT 'lifts', COUNT(*) FROM lifts
UNION ALL
SELECT 'runs', COUNT(*) FROM runs
UNION ALL
SELECT 'points_of_interest', COUNT(*) FROM points_of_interest
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'user_logs', COUNT(*) FROM user_logs
UNION ALL
SELECT 'bucket_list', COUNT(*) FROM bucket_list
UNION ALL
SELECT 'waitlist', COUNT(*) FROM waitlist;

-- Check RLS is enabled
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Success message
SELECT '✅ All missing tables created!' as status,
       '✅ Indexes created for performance' as indexes,
       '✅ Row Level Security enabled' as security,
       '✅ RLS Policies configured' as policies,
       '🎿 Ready to load seed data!' as next_step;
