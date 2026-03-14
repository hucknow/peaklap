# Supabase Setup Checklist - What You Need

## ✅ What You Have Already
- [x] ski_areas table
- [x] lifts table
- [x] runs table
- [x] points_of_interest table

## ⚠️ What's Missing (Run SQL to Create)

### Missing Tables (4 tables)
- [ ] **profiles** - User profile data
- [ ] **user_logs** - Run tracking/logging
- [ ] **bucket_list** - User's wishlist runs
- [ ] **waitlist** - Sendit Pro email capture

### Missing Configuration
- [ ] **PostGIS extension** - Required for geography data
- [ ] **Indexes** - For fast queries
- [ ] **Row Level Security** - Enabled on all tables
- [ ] **RLS Policies** - Access control rules

---

## 📋 Step-by-Step Instructions

### Step 1: Run Missing Tables SQL

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New query**
4. Copy contents of `/app/supabase_missing_tables.sql`
5. Paste into SQL Editor
6. Click **Run**

**Expected result**: ✅ All missing tables created with success message

---

### Step 2: Load Seed Data (40 Runs + 10 Lifts + 8 POIs)

1. Still in SQL Editor, click **New query**
2. Copy contents of `/app/whistler_seed_data.sql`
3. Paste into SQL Editor  
4. Click **Run**

**Expected result**: Message showing "40 runs, 10 lifts, 8 POIs added"

---

### Step 3: Verify Everything Works

Run this verification query:

```sql
-- Check all data loaded
SELECT 
  (SELECT COUNT(*) FROM ski_areas) as ski_areas,
  (SELECT COUNT(*) FROM lifts) as lifts,
  (SELECT COUNT(*) FROM runs) as runs,
  (SELECT COUNT(*) FROM points_of_interest) as pois,
  (SELECT COUNT(*) FROM profiles) as profiles;
```

**Expected results:**
- ski_areas: 1
- lifts: 10
- runs: 40
- points_of_interest: 8
- profiles: 0 (will populate when users sign up)

---

## 🎯 What Each Missing Table Does

### profiles
**Purpose**: Stores user profile data from onboarding
**Contains**: 
- username, avatar
- sport (skier/snowboarder/adaptive)
- difficulty preferences
- season goals (days, vertical feet)
- region setting (NA/EU/JP/AU)
- onboarding completion status

**Why needed**: The app tries to load profile after login. Without this table, you'll get 404 errors.

### user_logs
**Purpose**: Tracks every run a user logs
**Contains**:
- run_id (which run was logged)
- logged_at (date/time)
- snow_condition (powder/groomed/crud/ice/etc)
- notes (user's comments)

**Why needed**: For History page, stats calculations, recent activity on Home page.

### bucket_list
**Purpose**: Runs users want to complete (wishlist)
**Contains**:
- user_id + run_id pair
- is_completed flag
- completed_at timestamp

**Why needed**: Heart icon on run cards, bucket list preview on Home page.

### waitlist
**Purpose**: Email capture for Sendit Pro feature
**Contains**: email addresses

**Why needed**: When users click "Upgrade to Pro" in Settings, captures their email.

---

## 🔐 Row Level Security (RLS) Explained

**What it does**: Controls who can read/write each row

**Policies created:**
- ✅ **Public read** - Anyone can view ski data (runs, lifts, POIs, ski areas)
- ✅ **User own data** - Users can only read/write their own profiles, logs, bucket list
- ✅ **Waitlist insert** - Anyone can join waitlist

**Why needed**: Security! Prevents users from seeing other users' data.

---

## 🚨 Common Errors After Setup

### Error: "Failed to load resource: 404 /rest/v1/profiles"
**Cause**: profiles table doesn't exist
**Fix**: Run Step 1 (missing tables SQL)

### Error: "permission denied for table profiles"
**Cause**: RLS policies not created
**Fix**: Run Step 1 again (includes RLS policies)

### Error: "No runs showing in Run Directory"
**Cause**: Seed data not loaded
**Fix**: Run Step 2 (seed data SQL)

### Error: "extension 'postgis' does not exist"
**Cause**: PostGIS not enabled
**Fix**: Included in Step 1 SQL (CREATE EXTENSION postgis)

---

## ✅ Quick Verification Commands

After running both SQL files, verify with these:

### Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Should show 8 tables:
- bucket_list
- lifts
- points_of_interest
- profiles
- runs
- ski_areas
- user_logs
- waitlist

### Check Seed Data Loaded
```sql
SELECT name, difficulty, zone 
FROM runs 
LIMIT 5;
```

Should show runs like:
- Peak to Creek (intermediate, Peak)
- Franz's Run (intermediate, Peak)
- Burnt Stew Basin (advanced, Peak)
- etc.

### Check RLS Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`

---

## 📁 Files You Need

1. **`/app/supabase_missing_tables.sql`** ← Run this first
   - Creates 4 missing tables
   - Enables PostGIS
   - Creates indexes
   - Sets up RLS policies

2. **`/app/whistler_seed_data.sql`** ← Run this second
   - Inserts 1 ski area
   - Inserts 10 lifts
   - Inserts 40 runs (all zones, all difficulties)
   - Inserts 8 POIs (lodges, restaurants, bars)

---

## 🎉 After Setup Complete

Your app will have:
✅ Full authentication (signup/login)
✅ User profiles with onboarding
✅ 40 runs to browse and filter
✅ Run logging with snow conditions
✅ Bucket list functionality
✅ History tracking
✅ Stats calculations (days logged, vertical feet)
✅ Settings with region selection

---

## 📱 Test the Full Flow

1. **Signup**: Create account at `/signup`
2. **Onboarding**: Complete 4-step setup
3. **Home**: See Snow Stake and stats
4. **Runs**: Browse 40 runs, use filters
5. **Log**: Log a run with conditions
6. **History**: View logged runs
7. **Settings**: Change goals and region

---

## Need Help?

If you see errors:
1. Check browser console (F12)
2. Check Supabase SQL Editor for error messages
3. Verify both SQL files ran successfully
4. Hard refresh browser (Ctrl+Shift+R)

**Most common issue**: Forgetting to run one of the SQL files. Both are required!
