# Sendit - Ski/Snowboard Tracking App

A React web app for tracking ski and snowboard runs at Whistler Blackcomb, built with Supabase backend.

## 🎨 Design System - Alpine Dark Mode

- **Primary Background**: `#12181B` (Deep Slate)
- **Secondary Background**: `#1A2126` (Charcoal)
- **Primary Action**: `#00B4D8` (Ice Blue)
- **Success/Green Runs**: `#00E676` (Vivid Lime Green)
- **Glassmorphism**: All cards use `rgba(255,255,255,0.05)` with 12px blur
- **Fonts**: 
  - Manrope (headings, UI)
  - JetBrains Mono (stats, numbers)
  - Inter (body text)

## 🏔️ Core Features Implemented

### Authentication
- ✅ Login with email/password
- ✅ Signup with auto-profile creation
- ✅ Supabase Auth integration
- ✅ Protected routes

### Onboarding Flow (4 Steps)
- ✅ Sport selection (Skier/Snowboarder/Adaptive)
- ✅ Difficulty preference & terrain style with region-aware badges
- ✅ Season goals (days & vertical feet) with bucket list selection
- ✅ Time preference, social style, notifications toggle
- ✅ Auto-region detection from browser language
- ✅ Skippable with ice blue progress bar

### Home Page
- ✅ Personalized greeting with date
- ✅ **Snow Stake** component (signature feature)
  - Vertical gradient fill based on progress
  - Gold color + pulse animation when goal crushed
  - JetBrains Mono for stats
- ✅ Stats row: Runs, Vertical, Resort Completion %
- ✅ Bucket list horizontal scroll with difficulty badges
- ✅ Recent activity feed

### Run Directory
- ✅ Search bar with focus ring
- ✅ Filter by difficulty (region-aware badges)
- ✅ Filter by mountain (Whistler/Blackcomb)
- ✅ Filter by run type (groomed/moguls/trees)
- ✅ Run cards with glassmorphism
- ✅ Bucket list heart toggle
- ✅ Navigate to run detail

### Run Detail
- ✅ Large difficulty badge
- ✅ Info grid (vertical, length, zone, grooming)
- ✅ Run description
- ✅ Recent conditions from logs
- ✅ "Log This Run" button
- ✅ Bucket list toggle

### Log a Run
- ✅ Searchable run selector
- ✅ Date & time pickers (Alpine Dark Mode styled)
- ✅ Snow condition selector (6 conditions with emojis)
- ✅ Notes textarea
- ✅ Glassmorphism success toast: "Logged! Nice run 🤙"

### History
- ✅ Season summary bar (total logs, days, vertical)
- ✅ Chronological log list with difficulty badges
- ✅ Delete logs with confirmation
- ✅ Premium lock after 20 entries (Sendit Pro CTA)

### Settings
- ✅ Username edit
- ✅ Sport identity display with onboarding link
- ✅ Season goals editor with stepper
- ✅ Mini Snow Stake preview
- ✅ **Difficulty Region selector** (NA/EU/JP/AU)
  - Updates all badges app-wide instantly
  - Green runs use #00E676 (vivid lime green)
- ✅ Sendit Pro card with waitlist modal
- ✅ Sign out

### Navigation
- ✅ Bottom bar with 5 tabs
- ✅ Center "Log" tab with ice blue circular pill
- ✅ Active state: #00E676, Inactive: rgba(255,255,255,0.35)
- ✅ Manrope font labels

## 🧩 Components

- `DifficultyBadge` - Region-aware pill badges with proper opacity
- `SnowStake` - Signature vertical progress component
- `GlassCard` - Reusable glassmorphism container
- `BottomNav` - 5-tab navigation with center prominence

## 🗄️ Database Schema

All tables are defined in the problem statement with PostGIS support. Required tables:

- `ski_areas` - Resort/mountain data
- `lifts` - Lift information with geometry
- `runs` - Run details with difficulty, vertical, length, zone
- `points_of_interest` - POIs (lodges, restaurants, bars)
- `profiles` - User profiles with difficulty_region
- `user_logs` - Run logs with snow conditions
- `bucket_list` - User's bucket list runs
- `waitlist` - Sendit Pro waitlist emails

## 🚀 Setup Instructions

### 1. Supabase Configuration

**IMPORTANT**: Email verification is currently enabled. You have two options:

#### Option A: Disable Email Verification (Recommended for Development)
1. Go to Supabase Dashboard
2. Navigate to: **Authentication** → **Providers** → **Email**
3. Toggle **OFF**: "Confirm email"
4. Save changes

#### Option B: Use Email Confirmation
- Check your email after signup for confirmation link
- Click the link to verify your account
- Then you can login

### 2. Database Setup

Run the complete schema from the problem statement in your Supabase SQL Editor:

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Then run all CREATE TABLE statements
-- See problem statement for full schema
```

### 3. Seed Data

The problem statement specifies pre-loaded data for Whistler Blackcomb:
- 1 ski_area (Whistler Blackcomb)
- 40 runs (various difficulties, zones)
- 10 lifts
- 8 POIs (lodges, restaurants, après venues)

You mentioned you'll seed the database manually. Make sure to:
- Use OSM-style difficulty values: `novice`, `easy`, `intermediate`, `advanced`, `expert`, `freeride`, `park`
- Include realistic `vertical_ft` and `length_m` values
- Assign zones: Peak, Harmony, Glacier, 7th Heaven, Showcase, Crystal, Garbanzo
- Add 1-2 sentence descriptions for each run

### 4. Environment Variables

Already configured in `/app/frontend/.env`:
```
REACT_APP_SUPABASE_URL=https://wnbtpsqsoxczncebwnds.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sb_publishable_kRt9AcMiCQkLsVkcxWvNVw_kW0xynLl
```

## 🧪 Testing Flow

1. **Signup**: Create account at `/signup`
2. **Email Verification**: Check email or disable in Supabase (see Setup Instructions)
3. **Login**: Sign in at `/login`
4. **Onboarding**: Complete 4-step onboarding (or skip)
5. **Home**: View Snow Stake, stats, bucket list
6. **Runs**: Browse run directory, filter, add to bucket list
7. **Log**: Log a run with snow conditions
8. **History**: View logged runs, delete entries
9. **Settings**: Edit goals, change difficulty region, see region-aware badge updates

## 🎯 Key Implementation Notes

### Difficulty Badge System
The app uses a sophisticated region-aware difficulty system:
- **NA (North America)**: Green, Blue, Black, Double Black ◆◆, Backcountry, Park
- **EU (Europe)**: Blue, Red, Black, Off-Piste, Park
- **JP (Japan)**: Green, Red, Black, Backcountry, Park
- **AU (Australia)**: Green, Blue, Black, Double Black ◆◆, Backcountry, Park

Green runs use `#00E676` (vivid lime green) for instant recognition on dark backgrounds.

### Snow Stake Component
- Height: 200px
- Gradient: `linear-gradient(to top, #0077B6, #2979FF, #00B4D8)`
- Gold color (`#FFD700`) with pulse animation at 100%
- Tick marks at 25/50/75/100%
- Displays days and vertical feet progress

### Glassmorphism
All cards, modals, and panels use:
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 16px;
```

## 📱 Responsive Design

- Mobile-first at 390px width
- Optimized for iPhone/Android dimensions
- Bottom navigation always visible
- Scrollable content areas

## 🔮 Future Enhancements

Not included in this prototype (as specified):
- ❌ GPS tracking
- ❌ Live maps
- ❌ Social features
- ❌ Photo uploads
- ❌ External API calls

## 🐛 Known Issues

- React Hook dependency warnings (non-breaking, can be fixed by adding useCallback)
- Email verification enabled by default (requires Supabase configuration)

## 📄 License

Built for Whistler Blackcomb prototype.
