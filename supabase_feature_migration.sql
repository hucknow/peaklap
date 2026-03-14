-- Sendit Feature Migration Script
-- Run this in your Supabase SQL Editor

-- 1. Add home_resort_id to profiles (Feature 1)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS home_resort_id uuid REFERENCES public.ski_areas(id);

-- 2. Add session_id to user_logs if not exists (Feature 2)
ALTER TABLE public.user_logs 
ADD COLUMN IF NOT EXISTS session_id text;

-- 3. Create map_markers table for fallback map markers (Feature 3)
CREATE TABLE IF NOT EXISTS public.map_markers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.runs(id) ON DELETE CASCADE,
  ski_area_id uuid REFERENCES public.ski_areas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS for map_markers
ALTER TABLE public.map_markers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all markers" ON public.map_markers
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own markers" ON public.map_markers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own markers" ON public.map_markers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own markers" ON public.map_markers
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Create day_summaries table (Feature 5)
CREATE TABLE IF NOT EXISTS public.day_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ski_area_id uuid REFERENCES public.ski_areas(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  title text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, session_date)
);

-- RLS for day_summaries
ALTER TABLE public.day_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own summaries" ON public.day_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries" ON public.day_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own summaries" ON public.day_summaries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own summaries" ON public.day_summaries
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Create day_photos table (Feature 5)
CREATE TABLE IF NOT EXISTS public.day_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_summary_id uuid REFERENCES public.day_summaries(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

-- RLS for day_photos
ALTER TABLE public.day_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own photos" ON public.day_photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos" ON public.day_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos" ON public.day_photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos" ON public.day_photos
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Create RPC function for GPS resort detection (Feature 1)
-- This function finds the nearest resort to given coordinates
CREATE OR REPLACE FUNCTION find_resort_by_location(lat numeric, lng numeric)
RETURNS TABLE (
  id uuid,
  name text,
  distance_km numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.name,
    -- Calculate approximate distance in km using Haversine formula
    (6371 * acos(
      cos(radians(lat)) * cos(radians(COALESCE((sa.boundary->>'lat')::numeric, 0))) *
      cos(radians(COALESCE((sa.boundary->>'lng')::numeric, 0)) - radians(lng)) +
      sin(radians(lat)) * sin(radians(COALESCE((sa.boundary->>'lat')::numeric, 0)))
    ))::numeric as distance_km
  FROM ski_areas sa
  WHERE sa.boundary IS NOT NULL
  ORDER BY distance_km ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_logs_user_session ON public.user_logs(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_logged_at ON public.user_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_day_summaries_user_date ON public.day_summaries(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_runs_ski_area_zone ON public.runs(ski_area_id, zone);

-- 8. Update ski_areas with approximate center coordinates for GPS detection
-- (You may need to update these with actual coordinates)
UPDATE public.ski_areas 
SET boundary = jsonb_build_object('lat', 50.1163, 'lng', -122.9574)
WHERE name ILIKE '%whistler%' AND boundary IS NULL;

COMMENT ON COLUMN public.profiles.home_resort_id IS 'User''s home resort for quick access';
COMMENT ON COLUMN public.user_logs.session_id IS 'Groups all logs from the same calendar day per user';
COMMENT ON TABLE public.map_markers IS 'Custom map markers for resorts without GeoJSON data';
COMMENT ON TABLE public.day_summaries IS 'User-created summaries for ski days';
COMMENT ON TABLE public.day_photos IS 'Photos attached to day summaries';
