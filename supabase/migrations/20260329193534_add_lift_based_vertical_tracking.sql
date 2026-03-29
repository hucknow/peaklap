/*
  # Lift-Based Vertical Tracking (v0.5.0)

  ## Summary
  This migration transitions vertical calculation from run-based to lift-based tracking, 
  enabling accurate elevation gain calculations and parent-child relationships between 
  lift rides and subsequent runs.

  ## Changes Made

  1. **lifts Table Updates**
     - Add `base_elevation` (integer, feet) - Bottom station elevation
     - Add `summit_elevation` (integer, feet) - Top station elevation
     - Add `vertical_ft` (computed column) - Calculated vertical gain
     
  2. **user_logs Table Updates**
     - Add `parent_log_id` (UUID, self-referencing) - Links run logs to parent lift log
     - Add index on `parent_log_id` for fast hierarchy queries
     - Runs become "children" of lift rides
     
  3. **Vertical Calculation Logic**
     - Vertical is now calculated from lifts: (summit_elevation - base_elevation)
     - Run logs reference their parent lift log via parent_log_id
     - Stats aggregate vertical from lift logs, not run logs

  ## Migration Strategy
  - All columns nullable to support existing data
  - Existing lift logs remain valid (vertical = 0 if no elevation data)
  - Run logs can exist without parent (orphaned) until user assigns them
  - Future: Can calculate/populate elevations from geom data

  ## Notes
  - This enables accurate vertical tracking based on actual lift rides
  - Users can reassign runs to different lifts in History edit mode
  - Orphaned runs (no parent_log_id) will need manual lift assignment
*/

-- Add elevation columns to lifts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lifts' AND column_name = 'base_elevation'
  ) THEN
    ALTER TABLE lifts ADD COLUMN base_elevation INTEGER;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lifts' AND column_name = 'summit_elevation'
  ) THEN
    ALTER TABLE lifts ADD COLUMN summit_elevation INTEGER;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lifts' AND column_name = 'vertical_ft'
  ) THEN
    ALTER TABLE lifts ADD COLUMN vertical_ft INTEGER;
  END IF;
END $$;

-- Add parent_log_id to user_logs for hierarchy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_logs' AND column_name = 'parent_log_id'
  ) THEN
    ALTER TABLE user_logs ADD COLUMN parent_log_id UUID REFERENCES user_logs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for parent-child queries
CREATE INDEX IF NOT EXISTS idx_user_logs_parent_log_id ON user_logs(parent_log_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_user_parent ON user_logs(user_id, parent_log_id);

-- Add constraint: parent_log_id can only reference lift logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_logs_parent_must_be_lift_check'
  ) THEN
    -- Note: This constraint will be enforced at the application level
    -- to avoid circular dependency issues during inserts
    NULL;
  END IF;
END $$;

-- Create function to calculate lift vertical from elevations
CREATE OR REPLACE FUNCTION calculate_lift_vertical()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.summit_elevation IS NOT NULL AND NEW.base_elevation IS NOT NULL THEN
    NEW.vertical_ft := NEW.summit_elevation - NEW.base_elevation;
  ELSE
    NEW.vertical_ft := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate vertical_ft
DROP TRIGGER IF EXISTS trigger_calculate_lift_vertical ON lifts;
CREATE TRIGGER trigger_calculate_lift_vertical
  BEFORE INSERT OR UPDATE OF base_elevation, summit_elevation
  ON lifts
  FOR EACH ROW
  EXECUTE FUNCTION calculate_lift_vertical();

-- Add comments for documentation
COMMENT ON COLUMN lifts.base_elevation IS 'Base/bottom station elevation in feet';
COMMENT ON COLUMN lifts.summit_elevation IS 'Summit/top station elevation in feet';
COMMENT ON COLUMN lifts.vertical_ft IS 'Calculated vertical gain (summit - base) in feet';
COMMENT ON COLUMN user_logs.parent_log_id IS 'Reference to parent lift log - links runs to the lift ride they came from';

-- Create view for lift logs with their child runs (for History UI)
CREATE OR REPLACE VIEW user_logs_with_hierarchy AS
SELECT 
  ul.*,
  lifts.name as lift_name,
  lifts.vertical_ft as lift_vertical,
  runs.name as run_name,
  runs.difficulty as run_difficulty,
  runs.vertical_ft as run_vertical,
  ski_areas.name as resort_name,
  (
    SELECT COUNT(*)
    FROM user_logs children
    WHERE children.parent_log_id = ul.id
  ) as child_count
FROM user_logs ul
LEFT JOIN lifts ON ul.lift_id = lifts.id
LEFT JOIN runs ON ul.run_id = runs.id
LEFT JOIN ski_areas ON ul.ski_area_id = ski_areas.id;

-- Grant access to the view
GRANT SELECT ON user_logs_with_hierarchy TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Lift-based vertical tracking enabled (v0.5.0)';
  RAISE NOTICE '✅ lifts table: added base_elevation, summit_elevation, vertical_ft';
  RAISE NOTICE '✅ user_logs table: added parent_log_id for lift-run hierarchy';
  RAISE NOTICE '✅ Auto-calculation trigger created for lift vertical';
  RAISE NOTICE '✅ View created: user_logs_with_hierarchy';
  RAISE NOTICE '🎿 Vertical is now calculated from lift rides!';
END $$;
