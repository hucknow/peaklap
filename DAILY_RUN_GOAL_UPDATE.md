# Daily Run Goal Feature - v0.2.0

**Release Date**: March 29, 2026
**Version**: v0.1.0 → v0.2.0 (Functional Update)

## Summary

Added a new "Daily Run Goal" feature that allows users to set their target number of runs per day when on the mountain. The app now tracks progress toward this goal in real-time on the home screen.

## What Changed

### 1. New Settings Option
- Users can now set a daily run goal (1-100 runs per day) in the Settings page
- Default value is 3 runs per day
- Easy-to-use stepper interface with +/- buttons

### 2. Dynamic Progress Tracking
- The Snow Stake on the home screen now shows daily run progress
- When viewing "Today" stats, it displays "X Runs Today" vs your Daily Run Goal
- The stake fills up and glows gold when you hit 100% of your goal
- Seamlessly integrates with existing "Season" and "Lifetime" tracking

### 3. Smart Goal Display
- **Today filter**: Shows runs completed today vs Daily Run Goal
- **Season filter**: Shows days skied this season vs Season Days Goal
- **Lifetime filter**: Shows average days per season vs Season Days Goal

## Files Modified

### Frontend
- `frontend/src/pages/Settings.js` - Added daily run goal stepper (v0.2.0)
- `frontend/src/components/SnowStake.js` - Dynamic goal tracking
- `frontend/src/components/StatsSection.js` - Pass metrics to SnowStake

### Database
- `profiles` table - Added `daily_run_goal` column (integer, 1-100, default 3)

## SQL Migration

**File**: `daily_run_goal_migration.sql`

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_run_goal integer DEFAULT 3
  CHECK (daily_run_goal >= 1 AND daily_run_goal <= 100);
```

Apply this migration to your hosted database.

## Build Status

✅ Build completed successfully with no errors
⚠️ Minor ESLint warnings (pre-existing, not related to this update)
⚠️ Source map warnings (dependency issue, does not affect functionality)

## User Experience

Users can now:
1. Go to Settings → "Set Your Goals"
2. Adjust their "Daily Run Goal" using the stepper
3. Save their settings
4. View real-time progress on the home screen's Snow Stake
5. Feel motivated when the stake glows gold upon reaching their goal

## Next Steps

None required - feature is fully functional and ready to use.
