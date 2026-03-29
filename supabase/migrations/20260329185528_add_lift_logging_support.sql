/*
  # Add Lift Logging Support (v0.4.0)

  ## Summary
  This migration adds support for logging lifts in addition to runs, enabling users to track their entire mountain experience.

  ## Changes Made

  1. **user_logs Table Updates**
     - Add `lift_id` column (foreign key to `lifts`)
     - Add `log_type` column ('run' or 'lift')
     - Update constraints to allow either run_id OR lift_id (not both)

  2. **Indexes**
     - Add index on `lift_id` for fast lookups
     - Add index on `log_type` for filtering

  ## Notes
  - Existing logs are automatically set to log_type='run'
  - RLS policies remain unchanged (inherit from existing policies)
  - Both run_id and lift_id are nullable, but at least one must be set
*/

-- Add lift_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_logs' AND column_name = 'lift_id'
  ) THEN
    ALTER TABLE user_logs ADD COLUMN lift_id UUID REFERENCES lifts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add log_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_logs' AND column_name = 'log_type'
  ) THEN
    ALTER TABLE user_logs ADD COLUMN log_type TEXT DEFAULT 'run' CHECK (log_type IN ('run', 'lift'));
  END IF;
END $$;

-- Set existing logs to 'run' type
UPDATE user_logs
SET log_type = 'run'
WHERE log_type IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_logs_lift_id ON user_logs(lift_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_log_type ON user_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_user_logs_user_type ON user_logs(user_id, log_type);

-- Add constraint to ensure either run_id or lift_id is set
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_logs_run_or_lift_check'
  ) THEN
    ALTER TABLE user_logs
    ADD CONSTRAINT user_logs_run_or_lift_check
    CHECK (
      (run_id IS NOT NULL AND lift_id IS NULL) OR
      (run_id IS NULL AND lift_id IS NOT NULL)
    );
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN user_logs.lift_id IS 'Reference to lift if this is a lift log';
COMMENT ON COLUMN user_logs.log_type IS 'Type of log: run or lift';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Lift logging support added (v0.4.0)';
  RAISE NOTICE '✅ user_logs table updated with lift_id and log_type';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '🎿 Users can now log both runs and lifts!';
END $$;
