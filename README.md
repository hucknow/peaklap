# PeakLap - Ski & Snowboard Run Tracker

A modern, offline-first ski tracking application with comprehensive resort management, subscription system, and native mobile support.

## Quick Links

- **[Complete Project Summary](PROJECT_SUMMARY.md)** - Comprehensive overview of all features
- **[Supabase Setup Guide](SUPABASE_SETUP.md)** - Database configuration instructions
- **[Admin System Guide](ADMIN_SYSTEM.md)** - Resort management documentation
- **[RevenueCat Integration](REVENUECAT_INTEGRATION.md)** - Subscription setup
- **[Offline Implementation](OFFLINE_ANDROID_IMPLEMENTATION.md)** - Offline capabilities guide
- **[Testing Checklist](TESTING_CHECKLIST.md)** - QA testing procedures

## Features

### Core User Features
- 🎿 Run tracking with snow conditions and notes
- 📊 Season statistics and progress visualization
- 🗺️ Trail maps with offline caching
- 🎯 Bucket list and run directory
- 📱 Native Android app with offline support
- 💎 Subscription system (Monthly, Yearly, Lifetime)

### Admin Features
- 🏔️ Bulk resort import from OpenSkiData
- ✅ Publish/unpublish resort visibility
- ✏️ Edit resort details and metadata
- 📈 Run and lift statistics
- 🔍 Search, sort, and filter resorts
- 📝 Complete audit trail

## Tech Stack

- **Frontend:** React 19, Capacitor, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + PostGIS)
- **Payments:** RevenueCat
- **Mobile:** Android native with offline support
- **APIs:** OpenSkiData for resort data

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- RevenueCat account (for subscriptions)

### Installation

```bash
# Install dependencies
cd frontend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase and RevenueCat keys

# Run database migrations
# Copy supabase/migrations/*.sql to Supabase SQL Editor and run

# Start development
npm start
```

### Android Build

```bash
# Build for production
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

## Project Structure

```
project/
├── frontend/               # React application
│   ├── src/
│   │   ├── pages/         # User and admin pages
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # State management
│   │   └── lib/           # Utilities and services
│   └── android/           # Native Android build
├── supabase/
│   └── migrations/        # Database schema
└── documentation/         # Guides and references
```

## Key Documentation

### For Developers
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Complete feature list and architecture
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Database setup instructions
- [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) - QA procedures

### For Admins
- [ADMIN_SYSTEM.md](ADMIN_SYSTEM.md) - Resort management guide
- Access admin dashboard: Settings → Long-press app version (3 seconds)

### For Integration
- [REVENUECAT_INTEGRATION.md](REVENUECAT_INTEGRATION.md) - Subscription setup
- [OFFLINE_ANDROID_IMPLEMENTATION.md](OFFLINE_ANDROID_IMPLEMENTATION.md) - Offline features

## Environment Variables

Required in `frontend/.env`:

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_REVENUECAT_API_KEY=your_revenuecat_key
```

## Making a User Admin

```sql
UPDATE profiles
SET is_admin = true
WHERE id = 'user-id-here';
```

## Database Setup

### 1. Run Missing Tables & Base Schema
1. Open your Supabase Dashboard and go to the **SQL Editor**.
2. Click **New query** and run `001_base_schema.sql` (or `supabase_missing_tables.sql`).
   *This creates the core tables (`profiles`, `user_logs`, `bucket_list`, `waitlist`), enables PostGIS, and sets up RLS policies.*

### 2. Run Schema Updates
1. Create a new query and run `002_openskidata_schema_update.sql` to set up the Admin system.

### 3. Load Seed Data
1. Click **New query**, paste the contents of `whistler_seed_data.sql`, and click **Run**.
   *This loads 40 runs, 10 lifts, and 8 POIs for Whistler Blackcomb.*

### 4. Verify Setup
Run this verification query to ensure everything loaded correctly:
```sql
SELECT 
  (SELECT COUNT(*) FROM ski_areas) as ski_areas,
  (SELECT COUNT(*) FROM lifts) as lifts,
  (SELECT COUNT(*) FROM runs) as runs,
  (SELECT COUNT(*) FROM points_of_interest) as pois,
  (SELECT COUNT(*) FROM profiles) as profiles;
```
*Expected results: ski_areas: 1, lifts: 10, runs: 40, pois: 8, profiles: 0*

### 5. Make Your User an Admin
After signing up in the app, run the SQL command from the **Making a User Admin** section above.

## Testing

```bash
# Run development server
npm start

# Build for production
npm run build

# Sync to Android
npx cap sync android
```

See [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) for complete testing procedures.

## License

Proprietary - All rights reserved

## Support

For questions or issues, refer to the documentation files or contact the development team.
