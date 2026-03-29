# Admin System for Ski Resort Management

## Overview

The PeakLap admin system provides comprehensive tools for managing ski resort visibility and bulk loading resort data from OpenSkiData. This system allows administrators to control which resorts are visible to users and efficiently import multiple resorts at once.

## Features

### 1. **Visibility Control**
- Publish/unpublish resorts to control user visibility
- Soft delete with `is_active` flag
- Display order management for resort picker

### 2. **Bulk Loading**
- Search OpenSkiData by name/location
- Select multiple resorts (up to 50 per batch)
- Sequential loading with progress tracking
- Automatic error handling and rollback

### 3. **Resort Management**
- Edit resort details (name, country, elevation, etc.)
- View run and lift statistics
- Reload data from OpenSkiData
- Delete resorts (soft delete)

### 4. **Admin Audit Trail**
- All actions logged to `admin_logs` table
- Track who did what and when
- Detailed action metadata in JSONB format

## Database Schema

### New Columns in `ski_areas`

```sql
is_published        BOOLEAN DEFAULT false  -- Visible to users
is_active           BOOLEAN DEFAULT true   -- Soft delete flag
display_order       INTEGER DEFAULT 0      -- Sort order
source              TEXT DEFAULT 'manual'  -- openskidata, manual, skimap
last_synced_at      TIMESTAMPTZ           -- Last sync timestamp
run_count           INTEGER DEFAULT 0      -- Cached count
lift_count          INTEGER DEFAULT 0      -- Cached count
load_status         TEXT DEFAULT 'empty'   -- empty, loading, loaded, error
load_error          TEXT                   -- Error message if failed
elevation_base_m    INTEGER                -- Base elevation in meters
elevation_summit_m  INTEGER                -- Summit elevation in meters
vertical_m          INTEGER                -- Calculated: summit - base
operating_status    TEXT DEFAULT 'open'    -- open, closed, hold
map_url             TEXT                   -- Trail map image URL
```

### New Column in `profiles`

```sql
is_admin           BOOLEAN DEFAULT false   -- Admin access flag
```

### New Table: `admin_logs`

```sql
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_id UUID,
  target_type TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Row Level Security (RLS)

### Visibility Policies

**Users see only published resorts:**
```sql
CREATE POLICY "Users see published resorts only"
  ON ski_areas FOR SELECT
  TO authenticated
  USING (
    (is_published = true AND is_active = true)
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
```

**Similar policies apply to runs, lifts, and POIs** to ensure unpublished resort data is never visible to regular users.

### Admin Access

Admins bypass visibility restrictions and can:
- View all resorts (published and unpublished)
- View all runs, lifts, and POIs
- Access admin screens and functions

## Accessing Admin Features

### For Admins

1. Navigate to **Settings**
2. Scroll to the bottom
3. **Long-press** (3 seconds) on "PeakLap v0.1.0"
4. You'll be redirected to the **Admin Dashboard**

### For Non-Admins

The same long-press gesture takes you to the **Simple Resort Loader** (single resort import).

## Admin Screens

### 1. Admin Dashboard (`/admin`)

**Summary Cards:**
- Total ski areas in database
- Published vs unpublished count
- Total runs and lifts
- Active loading processes
- Error count

**Quick Actions:**
- Bulk Load from OpenSkiData
- Manage Resorts

**Access:** Long-press on app version in Settings

### 2. Bulk Load Resorts (`/admin/bulk-load`)

**Step A: Search & Select**
- Search OpenSkiData by resort name
- Results show: name, country, region
- "Already loaded" badge for existing resorts
- Select All / Deselect All options
- Filter by country
- Max 50 resorts per batch

**Step B: Bulk Load Execution**
- Sequential loading (500ms delay between resorts)
- Live progress indicator showing:
  - ✓ Success with run/lift counts
  - ⟳ Currently loading
  - ○ Queued
  - ✗ Failed with error message
- Automatic rollback on per-resort failure
- All resorts default to `is_published = false`

**Step C: Retry Failed**
- List of failed resorts with error messages
- Retry button per resort

**API Calls:**
1. `GET /skiAreas?q={query}` - Search resorts
2. `GET /runs?skiAreaID={id}` - Fetch runs
3. `GET /lifts?skiAreaID={id}` - Fetch lifts

### 3. Manage Resorts (`/admin/manage-resorts`)

**Features:**
- List all ski areas (published and unpublished)
- Search, sort, and filter
- Toggle publish/unpublish per resort
- Edit, reload, or delete actions

**Each Resort Row Shows:**
- Name
- Country, region, run count, lift count
- Source badge (OpenSkiData, Manual, Skimap)
- Load status badge (loaded, loading, error, empty)
- Publish toggle switch
- Action buttons (Edit, Reload, Delete)

**Sort Options:**
- Name A-Z
- Country
- Published First
- Recently Loaded

**Filter Options:**
- All Resorts
- Published Only
- Unpublished Only
- Errors Only

**Bulk Actions:**
- Publish Selected
- Unpublish Selected
- Delete Selected

**Publish Confirmation:**
"Make {name} visible to all users? This will appear in the resort picker immediately."

### 4. Edit Resort (`/admin/edit-resort/:id`)

**Editable Fields:**
- Name
- Country
- Region
- Website (URL)
- Base Elevation (meters)
- Summit Elevation (meters)
- Vertical (auto-calculated: summit - base)
- Operating Status (open, closed, hold)
- Display Order (lower = higher in list)
- Published toggle
- Trail Map URL

**Read-Only Info:**
- OSM ID
- Source
- Load Status
- Last Synced timestamp

**Statistics:**
- Run count by difficulty
- Lift count by type

## Making a User Admin

### Method 1: SQL Update (Recommended)

```sql
UPDATE profiles
SET is_admin = true
WHERE id = 'your-user-id-here';
```

### Method 2: During Migration

The migration includes this line (update with your user ID):

```sql
UPDATE profiles
SET is_admin = true
WHERE id = '345c8ec9-d829-461b-aeb1-f88224495dd4';
```

## User-Facing Changes

### Resort Picker
- Only shows published resorts (`is_published = true AND is_active = true`)
- Sorted by `display_order` ASC, then `name` ASC
- Shows operating status pill (open/closed/hold)

### Handling Unpublished Resorts
If a user's:
- `current_resort_id`
- `primary_resort_id`
- `home_resort_id`

...points to an unpublished resort, the app treats it as null and prompts resort selection. No errors are shown.

### Log History
User logs for unpublished resorts show **"Resort unavailable"** instead of resort/run details.

## Important Constraints

### Atomic Loading
- Loading runs/lifts per resort is atomic
- If runs load but lifts fail → entire resort rolls back
- Resort marked as `load_status = 'error'`

### Duplicate Prevention
- Before inserting, check if `osm_id` exists
- If exists, offer "Reload" (overwrite data) instead

### Rate Limiting
- 500ms delay between each resort's API calls
- Prevents OpenSkiData API abuse
- Max 50 resorts per batch

### Admin Action Logging
All admin actions are logged:
- publish_resort
- unpublish_resort
- delete_resort
- bulk_load_resort
- reload_resort
- edit_resort

## Helper Functions

### `is_user_admin(p_user_id UUID)`
Returns boolean indicating if user is admin.

### `log_admin_action(p_action TEXT, p_target_id UUID, p_target_type TEXT, p_details JSONB)`
Logs an admin action with details.

### `get_admin_dashboard_stats()`
Returns summary statistics for admin dashboard.

### `update_resort_counts(p_ski_area_id UUID)`
Updates cached `run_count` and `lift_count` for a resort.

## Data Flow

### Bulk Load Process

1. **Search:** Query OpenSkiData API
2. **Select:** User chooses resorts to load
3. **For each resort:**
   - a. Insert `ski_area` with `load_status = 'loading'`
   - b. Fetch runs from API
   - c. Bulk insert runs
   - d. Fetch lifts from API
   - e. Bulk insert lifts
   - f. Update `ski_area`:
     - `load_status = 'loaded'`
     - `run_count = {count}`
     - `lift_count = {count}`
     - `last_synced_at = now()`
   - g. On error: Delete `ski_area` and mark as error
4. **Log:** Record action in `admin_logs`

### Publish/Unpublish Flow

1. Admin toggles switch
2. If publishing → show confirmation dialog
3. Update `ski_areas.is_published`
4. Log action in `admin_logs`
5. Toast notification
6. Resort immediately visible/hidden to users

## Security Considerations

### Admin-Only Access
- All admin screens check `profile.is_admin`
- Non-admins redirected to settings
- Admin routes protected by authentication

### RLS Enforcement
- Database-level enforcement
- Admins bypass user restrictions
- Regular users never see unpublished data

### Action Auditing
- Every admin action logged
- Includes user ID, timestamp, details
- Cannot be deleted (only viewable by admins)

## Troubleshooting

### "No resorts visible"
- Check if resorts are published: `SELECT * FROM ski_areas WHERE is_published = true`
- Verify RLS policies are active
- Check user is not admin (admins see all)

### "Bulk load failing"
- Check OpenSkiData API is accessible
- Verify OSM IDs are valid
- Check Supabase database permissions
- Look for errors in `ski_areas.load_error`

### "Admin dashboard not accessible"
- Verify user's `is_admin = true`
- Check long-press gesture (3 seconds)
- Clear browser cache and retry

### "Runs not loading for resort"
- Check resort is published
- Verify runs exist: `SELECT COUNT(*) FROM runs WHERE ski_area_id = '{id}'`
- Check RLS policies on runs table

## Best Practices

### Before Publishing
1. Review resort details (name, location correct)
2. Verify run and lift counts look reasonable
3. Check for load errors
4. Set appropriate display order

### Bulk Loading
1. Start with small batches (5-10 resorts)
2. Verify success before larger batches
3. Monitor for errors during load
4. Check loaded data before publishing

### Data Management
1. Regularly review unpublished resorts
2. Clean up error resorts or retry loads
3. Update display order for featured resorts
4. Keep operating status current

## Future Enhancements

### Planned Features
1. **Scheduled Sync:** Auto-refresh resort data daily/weekly
2. **Batch Operations:** Publish/unpublish multiple resorts at once
3. **User Permissions:** Fine-grained admin roles (editor, viewer, super-admin)
4. **Activity Dashboard:** Admin action history with filters
5. **Data Quality Checks:** Validate runs have vertical, lifts have capacity, etc.
6. **Import from CSV:** Manual resort data import
7. **Export to CSV:** Export resort data for backup
8. **API Integration:** Auto-detect new resorts in user's region

## Migration Instructions

### Step 1: Apply Database Migration

```bash
# In Supabase Dashboard > SQL Editor
# Copy and paste contents of admin_system_migration.sql
# Click "Run"
```

### Step 2: Set Your User as Admin

```sql
UPDATE profiles
SET is_admin = true
WHERE id = 'your-user-id-here';
```

### Step 3: Verify Installation

1. Log into PeakLap
2. Go to Settings
3. Long-press on app version
4. Should see Admin Dashboard

### Step 4: Test Bulk Load

1. From Admin Dashboard → Bulk Load
2. Search for a small resort (e.g., "Stevens Pass")
3. Select and load
4. Verify runs and lifts loaded correctly
5. Go to Manage Resorts → Publish the resort
6. Test in regular user view

## Support

For issues or questions about the admin system:
- Email: info@peaklap.com
- Include: Screenshots, error messages, and steps to reproduce

## API Documentation

### OpenSkiData API

**Base URL:** `https://api.openskidata.org`

**Endpoints:**
- `GET /skiAreas?q={query}&limit={limit}` - Search ski areas
- `GET /skiAreas?osm_id={osm_id}` - Get ski area by OSM ID
- `GET /runs?skiAreaID={id}` - Get runs for ski area
- `GET /lifts?skiAreaID={id}` - Get lifts for ski area

**Rate Limits:** Not officially documented, but respect the API with delays between requests

**Data Format:** GeoJSON FeatureCollection

## License

Internal admin tool for PeakLap. Not for public distribution.
