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

1. Create a Supabase project
2. Run migrations in order:
   - `001_base_schema.sql` - Core tables and RLS
   - `002_openskidata_schema_update.sql` - Admin system
3. Load seed data: `whistler_seed_data.sql`
4. Make your user an admin (see above)

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
