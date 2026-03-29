/*
  # Add Daily Run Goal to Profiles

  1. Modified Tables
    - `profiles`
      - `daily_run_goal` (integer, default 3) - Target number of runs per day on the mountain
      - Constraint: Must be between 1 and 100

  2. Purpose
    - Allows users to set a daily run goal that they want to achieve when skiing/snowboarding
    - Used by the SnowStake component to track progress on the "Today" filter
    - Default value of 3 runs per day is a reasonable target for most riders

  3. Notes
    - This column integrates with existing season goals (season_goal_days, season_goal_vertical_ft)
    - No data migration needed as all existing profiles will get the default value of 3
*/

-- Add daily run goal column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_run_goal integer DEFAULT 3
  CHECK (daily_run_goal >= 1 AND daily_run_goal <= 100);

-- Add comment to explain the column
COMMENT ON COLUMN profiles.daily_run_goal IS 'Target number of runs the user aims to complete per day on the mountain (1-100)';
