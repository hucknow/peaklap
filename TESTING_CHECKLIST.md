# Sendit Testing Checklist

## Prerequisites
- ✅ Supabase email verification disabled
- ✅ Database schema created
- ✅ Seed data loaded (40 runs, 10 lifts, 8 POIs)

## Test Flow

### 1. Authentication Flow
- [ ] Visit `/signup`
- [ ] Create account with test@sendit.app / password123
- [ ] Should see success toast and redirect to `/login`
- [ ] Login with same credentials
- [ ] Should redirect to `/onboarding` (first time) or `/home` (returning)

### 2. Onboarding (First Time Only)
- [ ] **Step 1**: Select sport (Skier/Snowboarder/Adaptive)
  - Click a card, see border highlight #00B4D8
  - Click Continue
- [ ] **Step 2**: Select difficulty preference
  - See region-aware badges (default NA or auto-detected)
  - Green badges show vivid #00E676 lime green
  - Select terrain style (Groomers/Trees/Powder/Park/Backcountry)
- [ ] **Step 3**: Set season goals
  - Use +/- to adjust days (default 20)
  - Enter vertical feet goal (default 100,000)
  - Optionally select runs for bucket list
- [ ] **Step 4**: Set preferences
  - Choose time preference (Morning/Afternoon/All Day)
  - Choose social style (Solo/Crew/Both)
  - Toggle notifications
  - Click Complete Setup
- [ ] Should redirect to `/home`

### 3. Home Page
- [ ] See personalized greeting with username
- [ ] **Snow Stake Component**:
  - Vertical bar with gradient fill
  - Shows 0% progress (no runs logged yet)
  - JetBrains Mono font for numbers
  - Message: "Get out there — season starts now"
- [ ] Stats row shows: 0 runs, 0 ft vertical, 0% completion
- [ ] Bucket list preview (if added in onboarding)
- [ ] Recent activity shows empty state

### 4. Run Directory (`/runs`)
- [ ] See all 40 runs loaded from seed data
- [ ] **Test Search**: Type "Peak" → see Peak to Creek, other Peak zone runs
- [ ] **Test Difficulty Filter**: Click Green badge → see only green/easy runs
- [ ] **Test Mountain Filter**: Click "Whistler" → filter to Whistler mountain
- [ ] **Test Run Type**: Click "Groomed" → see only groomed runs
- [ ] **Bucket List**: Click heart icon on a run → should fill red
- [ ] Click on a run card → navigate to run detail

### 5. Run Detail (`/runs/:id`)
- [ ] See large difficulty badge at top
- [ ] Info grid shows: Vertical ft, Length m, Zone, Grooming (all in JetBrains Mono)
- [ ] Description paragraph displayed
- [ ] Recent conditions section (empty until runs are logged)
- [ ] Click "Log This Run" → navigate to `/log` with run pre-selected
- [ ] Click heart → toggle bucket list

### 6. Log a Run (`/log`)
- [ ] **If came from run detail**: Run should be pre-selected in card
- [ ] **If direct access**: See search box
  - Type "Franz" → see "Franz's Run" appear
  - Click run → selected in glassmorphism card
- [ ] Date defaults to today
- [ ] Time defaults to now
- [ ] **Snow Condition**: Click one of 6 conditions (❄️ Powder, 🎿 Groomed, etc.)
  - Card shows #00B4D8 border when selected
- [ ] Type notes (optional): "Great pow day!"
- [ ] Click "Save Run"
- [ ] See glassmorphism toast: "Logged! Nice run 🤙" with #00E676 left border
- [ ] Auto-redirect to `/home` after 1.5s

### 7. Home Page (After Logging)
- [ ] **Snow Stake** now shows progress:
  - Fill height increased
  - Numbers updated: 1 / 20 days (or your goal)
  - Vertical ft updated based on run's vertical
- [ ] Stats row updated: 1 run, XXX ft vertical
- [ ] Recent activity shows logged run with:
  - Run name in Manrope font
  - Difficulty badge (region-aware colors)
  - Date in JetBrains Mono
  - Snow condition displayed

### 8. History (`/history`)
- [ ] Season summary bar shows totals
- [ ] See logged run in list with all details
- [ ] Click trash icon → confirm deletion → run removed
- [ ] Log 20+ runs → see premium lock card appear:
  - Gold #FFD700 border
  - "You're on a roll" message
  - "Sendit Pro unlocks full history"
  - Upgrade button

### 9. Settings (`/settings`)
- [ ] Edit username → click Save Changes → see success toast
- [ ] Sport shows value from onboarding (with edit link)
- [ ] **Season Goals**:
  - Adjust days with +/- buttons
  - Edit vertical feet in input
  - See mini Snow Stake preview update in real-time
- [ ] **Difficulty Region** (KEY FEATURE):
  - Current region highlighted in #00B4D8
  - Click different region (EU/JP/AU)
  - Click Save Changes
  - Navigate to Run Directory → badges update to new region colors
  - Green runs always stay #00E676 vivid lime green
- [ ] **Sendit Pro Card**:
  - Gold border, lists benefits
  - Click "Upgrade Now" → modal appears
  - Enter email → "Join Waitlist" → success toast
- [ ] Click "Sign Out" → redirect to `/login`

### 10. Design System Verification
- [ ] **Backgrounds**: All pages use #12181B primary, #1A2126 secondary
- [ ] **Glassmorphism**: All cards have:
  - rgba(255,255,255,0.05) background
  - Visible 12px blur effect
  - 1px solid rgba(255,255,255,0.08) border
  - 16px border radius
- [ ] **Colors**:
  - Primary action buttons: #00B4D8 (ice blue) with dark text
  - Success/green runs: #00E676 (vivid lime green)
  - Active nav: #00E676, inactive: rgba(255,255,255,0.35)
- [ ] **Fonts**:
  - Headings: Manrope (bold, 600-800 weight)
  - Stats/numbers: JetBrains Mono
  - Body: Inter or system-ui
- [ ] **Bottom Navigation**:
  - 5 tabs visible on all pages
  - Center "Log" tab has ice blue circular pill
  - Active state clearly visible
  - Fixed to bottom, content scrolls behind

### 11. Mobile Responsiveness
- [ ] Test at 390px width (iPhone size)
- [ ] All text readable
- [ ] No horizontal scrolling
- [ ] Touch targets adequate size
- [ ] Bottom nav always accessible

### 12. Edge Cases
- [ ] Try logging run without selecting run → error toast
- [ ] Try logging run without snow condition → error toast  
- [ ] Search for non-existent run → "No runs found"
- [ ] Set goal to 0 → Snow Stake shows message
- [ ] Complete goal (log enough runs) → Stake turns gold with pulse
- [ ] Delete all logs → Recent activity shows empty state

## Success Criteria

✅ All 12 sections complete without errors
✅ Design system matches Alpine Dark Mode spec
✅ Region-aware badges working (green = #00E676 in all regions)
✅ Snow Stake animates and updates correctly
✅ Glassmorphism visible on all cards
✅ Fonts loaded correctly (Manrope, JetBrains Mono)
✅ Navigation works smoothly
✅ Data persists across page refreshes

## Known Non-Issues (As Designed)

- No GPS tracking (not in spec)
- No maps (not in spec)  
- No social features (not in spec)
- No photo uploads (not in spec)
- React Hook warnings (non-breaking, can be fixed later)

---

**Ready to Send It!** 🏂
