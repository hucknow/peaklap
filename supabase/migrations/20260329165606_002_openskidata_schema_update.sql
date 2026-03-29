/*
  # OpenSkiData Schema Update

  ## Summary
  This migration adds views and helper functions for working with OpenSkiData.

  ## Changes Made

  1. **Database Views**
     - Create `runs_openskidata` view for standardized run queries
     - Create `lifts_openskidata` view for standardized lift queries

  2. **Helper Functions**
     - `find_resort_by_location` - Find nearest resort to GPS coordinates
     - `get_ski_area_stats` - Get statistics for a ski area

  ## Notes
  - All base columns already exist from base schema
  - Views provide standardized interface for querying
*/

-- ==========================================
-- CREATE DATABASE VIEWS
-- ==========================================

-- Drop views first to avoid column conflicts
DROP VIEW IF EXISTS runs_openskidata CASCADE;
DROP VIEW IF EXISTS lifts_openskidata CASCADE;

-- Recreate views with updated columns
CREATE VIEW runs_openskidata AS
SELECT
  id,
  ski_area_id,
  name,
  COALESCE(piste_difficulty, difficulty) as difficulty,
  piste_difficulty,
  piste_type,
  grooming,
  ref,
  description,
  vertical_ft,
  length_m,
  geom,
  created_at
FROM runs;

CREATE VIEW lifts_openskidata AS
SELECT
  id,
  ski_area_id,
  name,
  COALESCE(aerialway, lift_type) as lift_type,
  aerialway,
  capacity,
  ref,
  geom,
  created_at
FROM lifts;

-- ==========================================
-- ADD HELPER FUNCTIONS
-- ==========================================

CREATE OR REPLACE FUNCTION find_resort_by_location(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_radius_km NUMERIC DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  distance_km NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.id,
    sa.name,
    ROUND(
      ST_Distance(
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        ST_SetSRID(ST_MakePoint(sa.longitude, sa.latitude), 4326)::geography
      ) / 1000
    )::NUMERIC as distance_km
  FROM ski_areas sa
  WHERE sa.latitude IS NOT NULL 
    AND sa.longitude IS NOT NULL
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(sa.longitude, sa.latitude), 4326)::geography,
      p_radius_km * 1000
    )
  ORDER BY distance_km ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_ski_area_stats(p_ski_area_id UUID)
RETURNS TABLE (
  total_runs INTEGER,
  total_lifts INTEGER,
  total_vertical_ft INTEGER,
  beginner_runs INTEGER,
  intermediate_runs INTEGER,
  advanced_runs INTEGER,
  expert_runs INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM runs WHERE ski_area_id = p_ski_area_id) as total_runs,
    (SELECT COUNT(*)::INTEGER FROM lifts WHERE ski_area_id = p_ski_area_id) as total_lifts,
    (SELECT COALESCE(SUM(vertical_ft), 0)::INTEGER FROM runs WHERE ski_area_id = p_ski_area_id) as total_vertical_ft,
    (SELECT COUNT(*)::INTEGER FROM runs WHERE ski_area_id = p_ski_area_id AND COALESCE(piste_difficulty, difficulty) IN ('novice', 'easy')) as beginner_runs,
    (SELECT COUNT(*)::INTEGER FROM runs WHERE ski_area_id = p_ski_area_id AND COALESCE(piste_difficulty, difficulty) = 'intermediate') as intermediate_runs,
    (SELECT COUNT(*)::INTEGER FROM runs WHERE ski_area_id = p_ski_area_id AND COALESCE(piste_difficulty, difficulty) = 'advanced') as advanced_runs,
    (SELECT COUNT(*)::INTEGER FROM runs WHERE ski_area_id = p_ski_area_id AND COALESCE(piste_difficulty, difficulty) IN ('expert', 'freeride')) as expert_runs;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ==========================================

COMMENT ON VIEW runs_openskidata IS 'Standardized view for querying runs with OpenSkiData fields';
COMMENT ON VIEW lifts_openskidata IS 'Standardized view for querying lifts with OpenSkiData fields';
COMMENT ON FUNCTION find_resort_by_location IS 'Find nearest ski resorts to GPS coordinates within radius';
COMMENT ON FUNCTION get_ski_area_stats IS 'Get run/lift statistics for a ski area';