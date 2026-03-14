# Supabase Setup Guide for Sendit

Follow these steps to complete your Supabase configuration.

## Step 1: Disable Email Verification (Recommended for Development)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **Authentication** → **Providers** → **Email**
4. Scroll down to find "Confirm email"
5. **Toggle OFF** the "Confirm email" setting
6. Click "Save"

This allows users to login immediately after signup without email confirmation.

## Step 2: Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire schema from the problem statement OR use the shortened version below:
4. Click "Run" to execute

### Quick Schema (if not already created):

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Tables (see problem statement for complete schema)
-- You should have already created these tables:
-- - ski_areas
-- - lifts  
-- - runs
-- - points_of_interest
-- - profiles
-- - user_logs
-- - bucket_list
-- - waitlist

-- Verify tables exist:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## Step 3: Load Seed Data

1. Still in **SQL Editor**, click "New query"
2. Open the file `/app/whistler_seed_data.sql` 
3. Copy the entire contents
4. Paste into Supabase SQL Editor
5. Click "Run" to execute

This will insert:
- ✅ 1 ski area (Whistler Blackcomb)
- ✅ 10 lifts (Peak Express, Harmony Express, etc.)
- ✅ 40 runs (various difficulties across all zones)
- ✅ 8 POIs (Roundhouse Lodge, Merlin's Bar, etc.)

## Step 4: Verify Data

Run this query to confirm data was inserted:

```sql
-- Check counts
SELECT 
  (SELECT COUNT(*) FROM ski_areas) as ski_areas,
  (SELECT COUNT(*) FROM lifts) as lifts,
  (SELECT COUNT(*) FROM runs) as runs,
  (SELECT COUNT(*) FROM points_of_interest) as pois;

-- View sample runs
SELECT name, difficulty, zone, vertical_ft 
FROM runs 
LIMIT 10;
```

You should see:
- 1 ski area
- 10 lifts  
- 40 runs
- 8 POIs

## Step 5: Test Row Level Security (Optional)

If you're getting permission errors, check RLS policies:

```sql
-- Check which tables have RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- If needed, you can temporarily disable RLS for testing:
-- ALTER TABLE runs DISABLE ROW LEVEL SECURITY;
-- (Not recommended for production)
```

The seed data script includes policies that allow:
- Public read access to ski_areas, lifts, runs, POIs
- Authenticated users can manage their own profiles, logs, bucket list

## Troubleshooting

### "Email not confirmed" error
- You didn't disable email verification. Go back to Step 1.

### "Permission denied" errors  
- Check RLS policies are created correctly
- Ensure you're logged in when accessing protected tables

### "relation does not exist" errors
- Tables weren't created. Run the full schema from problem statement first.

### No runs showing in app
- Seed data wasn't loaded. Complete Step 3.

## Next Steps

Once setup is complete:

1. **Test Signup/Login**: 
   - Go to https://run-sesh.preview.emergentagent.com/signup
   - Create an account (should work immediately with email verification disabled)
   - Login and complete onboarding

2. **Explore the App**:
   - View the Snow Stake on home page
   - Browse 40 runs in Run Directory
   - Add runs to bucket list
   - Log a run with snow conditions
   - Check history and stats

3. **Test Region Switching**:
   - Go to Settings
   - Change difficulty region (NA/EU/JP/AU)
   - Notice all badges update colors immediately
   - Green runs always use vivid #00E676 lime green

---

**Setup Complete!** 🏔️

Your Sendit app is now ready with:
- Alpine Dark Mode design throughout
- Region-aware difficulty system  
- Snow Stake progress tracking
- Full run logging and history
- Bucket list functionality
- Whistler Blackcomb data (40 runs, 10 lifts, 8 POIs)
