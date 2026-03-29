/*
  # Add Daily Run Goal to Profiles

  1. Changes
    - Add `daily_run_goal` column to `profiles` table
      - Type: integer
      - Default: 3 (reasonable daily goal for casual skiers)
      - Constraint: Must be positive (1-100 range)
  
  2. Notes
    - This enables users to set daily run goals in addition to season goals
    - Used by the Snow Stake component to track daily progress
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'daily_run_goal'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_run_goal integer DEFAULT 3 CHECK (daily_run_goal >= 1 AND daily_run_goal <= 100);
  END IF;
END $$;
