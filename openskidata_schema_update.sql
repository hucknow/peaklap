/*
  # OpenSkiData Schema Update

  ## Summary
  This migration updates the database schema to support dynamic resort loading from OpenSkiData.

  ## Changes Made

  1. **ski_areas Table Updates**
     - Add `osm_id` field to store OpenSkiMap OSM identifier
     - Add `skimap_id` field for cross-referencing
     - Ensure all necessary fields exist

  2. **runs Table Updates**
     - Add `piste_difficulty` field (primary difficulty field from OpenSkiData)
     - Add `piste_type` field (downhill, nordic, skitour, etc.)
     - Add `grooming` field (classic, skating, backcountry, mogul)
     - Add `ref` field (run reference/number)
     - Add `description` field
     - Add `length_m` field for run length in meters
     - Keep existing `difficulty` field for backward compatibility
     - Keep existing `vertical_ft` field

  3. **lifts Table Updates**
     - Add `aerialway` field (primary lift type from OpenSkiData)
     - Add `ref` field (lift reference/number)
     - Keep existing `lift_type` field for backward compatibility

  4. **Database Views**
     - Create `runs_openskidata` view for standardized run queries
     - Create `lifts_openskidata` view for standardized lift queries

  5. **Indexes**
     - Add performance indexes for new fields

  ## Notes
  - All operations use IF NOT EXISTS to prevent errors on re-run
  - Views provide a standardized interface for querying OpenSkiData
  - Existing fields are preserved for backward compatibility
*/

-- ==========================================
-- UPDATE SKI_AREAS TABLE
-- ==========================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ski_areas' AND column_name = 'osm_id'
  ) THEN
    ALTER TABLE ski_areas ADD COLUMN osm_id TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ski_areas' AND column_name = 'skimap_id'
  ) THEN
    ALTER TABLE ski_areas ADD COLUMN skimap_id INTEGER;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ski_areas' AND column_name = 'area_type'
  ) THEN
    ALTER TABLE ski_areas ADD COLUMN area_type TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ski_areas' AND column_name = 'country'
  ) THEN
    ALTER TABLE ski_areas ADD COLUMN country TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ski_areas' AND column_name = 'region'
  ) THEN
    ALTER TABLE ski_areas ADD COLUMN region TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ski_areas' AND column_name = 'website'
  ) THEN
    ALTER TABLE ski_areas ADD COLUMN website TEXT;
  END IF;
END $$;

-- ==========================================
-- UPDATE RUNS TABLE
-- ==========================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runs' AND column_name = 'piste_difficulty'
  ) THEN
    ALTER TABLE runs ADD COLUMN piste_difficulty TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runs' AND column_name = 'piste_type'
  ) THEN
    ALTER TABLE runs ADD COLUMN piste_type TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runs' AND column_name = 'grooming'
  ) THEN
    ALTER TABLE runs ADD COLUMN grooming TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runs' AND column_name = 'ref'
  ) THEN
    ALTER TABLE runs ADD COLUMN ref TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runs' AND column_name = 'description'
  ) THEN
    ALTER TABLE runs ADD COLUMN description TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runs' AND column_name = 'length_m'
  ) THEN
    ALTER TABLE runs ADD COLUMN length_m NUMERIC;
  END IF;
END $$;

-- ==========================================
-- UPDATE LIFTS TABLE
-- ==========================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lifts' AND column_name = 'aerialway'
  ) THEN
    ALTER TABLE lifts ADD COLUMN aerialway TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lifts' AND column_name = 'ref'
  ) THEN
    ALTER TABLE lifts ADD COLUMN ref TEXT;
  END IF;
END $$;

-- ==========================================
-- CREATE INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_ski_areas_osm_id ON ski_areas(osm_id);
CREATE INDEX IF NOT EXISTS idx_ski_areas_skimap_id ON ski_areas(skimap_id);
CREATE INDEX IF NOT EXISTS idx_ski_areas_country ON ski_areas(country);

CREATE INDEX IF NOT EXISTS idx_runs_piste_difficulty ON runs(piste_difficulty);
CREATE INDEX IF NOT EXISTS idx_runs_piste_type ON runs(piste_type);
CREATE INDEX IF NOT EXISTS idx_runs_ref ON runs(ref);

CREATE INDEX IF NOT EXISTS idx_lifts_aerialway ON lifts(aerialway);
CREATE INDEX IF NOT EXISTS idx_lifts_ref ON lifts(ref);

-- ==========================================
-- CREATE DATABASE VIEWS
-- ==========================================

CREATE OR REPLACE VIEW runs_openskidata AS
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

CREATE OR REPLACE VIEW lifts_openskidata AS
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
-- ADD HELPFUL FUNCTIONS
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
        ST_Centroid(sa.boundary)::geography
      ) / 1000
    )::NUMERIC as distance_km
  FROM ski_areas sa
  WHERE ST_DWithin(
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    ST_Centroid(sa.boundary)::geography,
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

COMMENT ON COLUMN ski_areas.osm_id IS 'OpenStreetMap ID for this ski area';
COMMENT ON COLUMN ski_areas.skimap_id IS 'OpenSkiMap internal ID';
COMMENT ON COLUMN ski_areas.area_type IS 'Type of ski area (downhill, nordic, etc.)';

COMMENT ON COLUMN runs.piste_difficulty IS 'Primary difficulty field from OpenSkiData (novice, easy, intermediate, advanced, expert, freeride)';
COMMENT ON COLUMN runs.piste_type IS 'Type of piste (downhill, nordic, skitour, sled, hike, sleigh, ice_skate, snow_park, playground, connection)';
COMMENT ON COLUMN runs.grooming IS 'Grooming type (classic, skating, backcountry, mogul, scooter)';
COMMENT ON COLUMN runs.ref IS 'Run reference number or identifier';
COMMENT ON COLUMN runs.length_m IS 'Run length in meters';

COMMENT ON COLUMN lifts.aerialway IS 'Primary lift type from OpenSkiData (cable_car, gondola, chair_lift, drag_lift, etc.)';
COMMENT ON COLUMN lifts.ref IS 'Lift reference number or identifier';

COMMENT ON VIEW runs_openskidata IS 'Standardized view for querying runs with OpenSkiData fields';
COMMENT ON VIEW lifts_openskidata IS 'Standardized view for querying lifts with OpenSkiData fields';

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '✅ OpenSkiData schema update completed!';
  RAISE NOTICE '✅ All new fields added to ski_areas, runs, and lifts tables';
  RAISE NOTICE '✅ Database views created: runs_openskidata, lifts_openskidata';
  RAISE NOTICE '✅ Helper functions added for resort search and stats';
  RAISE NOTICE '✅ Performance indexes created';
  RAISE NOTICE '🎿 Ready to load resorts from OpenSkiData!';
END $$;
