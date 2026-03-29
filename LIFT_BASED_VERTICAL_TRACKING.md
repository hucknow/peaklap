# Lift-Based Vertical Tracking System (v0.5.0)

## Overview
This major update transitions PeakLap from run-based to lift-based vertical tracking, accurately reflecting how skiers gain elevation. The system introduces a parent-child relationship where lift rides serve as the primary vertical calculation source, with runs logged as children of those lifts.

## Philosophy & Reasoning

### Why Lift-Based Tracking?
1. **Accurate Vertical Calculation**: Skiers gain elevation by riding lifts, not by skiing runs. A lift takes you up 2,000 feet; the run brings you back down.
2. **Realistic Data**: Vertical should reflect actual climbing, not downhill distance
3. **Better Day Summaries**: See total vertical from lifts taken, not runs skied
4. **Industry Standard**: Aligns with how resorts and tracking apps calculate vertical

### Previous System (Run-Based)
```
❌ Problem: Calculated vertical from run logs
- User logs run "Peak to Creek" (2,000 ft vertical)
- System adds 2,000 ft to total
- But user went DOWN 2,000 ft, not up!
```

### New System (Lift-Based)
```
✅ Solution: Calculate vertical from lift logs
- User logs "Peak Express" lift (base: 8,000 ft, summit: 10,000 ft)
- System adds 2,000 ft to total (10,000 - 8,000)
- Accurately reflects vertical GAINED
```

## Database Changes

### Migration: `add_lift_based_vertical_tracking.sql`

#### 1. Lifts Table Enhancements
```sql
-- New columns
ALTER TABLE lifts ADD COLUMN base_elevation INTEGER;      -- Bottom station (feet)
ALTER TABLE lifts ADD COLUMN summit_elevation INTEGER;    -- Top station (feet)
ALTER TABLE lifts ADD COLUMN vertical_ft INTEGER;         -- Auto-calculated

-- Auto-calculation trigger
CREATE TRIGGER trigger_calculate_lift_vertical
  BEFORE INSERT OR UPDATE OF base_elevation, summit_elevation
  ON lifts
  FOR EACH ROW
  EXECUTE FUNCTION calculate_lift_vertical();

-- Function
CREATE FUNCTION calculate_lift_vertical()
vertical_ft = summit_elevation - base_elevation
```

#### 2. User Logs Parent-Child Relationship
```sql
-- New column for hierarchy
ALTER TABLE user_logs ADD COLUMN parent_log_id UUID REFERENCES user_logs(id);

-- Indexes for performance
CREATE INDEX idx_user_logs_parent_log_id ON user_logs(parent_log_id);
CREATE INDEX idx_user_logs_user_parent ON user_logs(user_id, parent_log_id);
```

#### 3. Hierarchy View
```sql
CREATE VIEW user_logs_with_hierarchy AS
SELECT
  ul.*,
  lifts.name as lift_name,
  lifts.vertical_ft as lift_vertical,
  runs.name as run_name,
  runs.difficulty as run_difficulty,
  (SELECT COUNT(*) FROM user_logs children WHERE children.parent_log_id = ul.id) as child_count
FROM user_logs ul
LEFT JOIN lifts ON ul.lift_id = lifts.id
LEFT JOIN runs ON ul.run_id = runs.id
LEFT JOIN ski_areas ON ul.ski_area_id = ski_areas.id;
```

### Schema Structure

#### Before (v0.4.1)
```
user_logs
├── id
├── user_id
├── run_id (nullable)
├── lift_id (nullable)
├── log_type ('run' | 'lift')
└── ski_area_id
```

#### After (v0.5.0)
```
user_logs
├── id
├── user_id
├── run_id (nullable)
├── lift_id (nullable)
├── log_type ('run' | 'lift')
├── parent_log_id (self-reference) ← NEW
└── ski_area_id

Relationship:
┌─────────────────┐
│ Lift Log        │ ← Parent
│ log_type: lift  │
│ lift_id: uuid   │
└────────┬────────┘
         │ parent_log_id
         ↓
┌─────────────────┐
│ Run Log         │ ← Child
│ log_type: run   │
│ run_id: uuid    │
│ parent_log_id   │ → References parent lift
└─────────────────┘
```

## Frontend Implementation

### 1. Vertical Calculation (StatsSection.js)

#### Old Logic (v0.4.1)
```javascript
// ❌ Calculated from run logs
const totalVertical = logs.reduce((sum, log) =>
  sum + (log.runs?.vertical_ft || 0), 0
);
```

#### New Logic (v0.5.0)
```javascript
// ✅ Calculate from lift logs only
const liftLogs = logs.filter(log => log.log_type === 'lift' && log.lift_id);
const totalVertical = liftLogs.reduce((sum, log) =>
  sum + (log.lifts?.vertical_ft || 0), 0
);
```

### 2. Auto-Linking Runs to Lifts (hooks.js)

When a user logs a run, the system automatically links it to the most recent lift:

```javascript
const logRun = async (runId) => {
  // Find most recent lift log (within last 30 minutes)
  const { data: recentLiftLogs } = await supabase
    .from('user_logs')
    .select('id, logged_at')
    .eq('user_id', userId)
    .eq('ski_area_id', resortId)
    .eq('log_type', 'lift')
    .order('logged_at', { ascending: false })
    .limit(1);

  let parentLiftLogId = null;
  if (recentLiftLogs.length > 0) {
    const diffMinutes = (now - new Date(recentLiftLogs[0].logged_at)) / (1000 * 60);

    // Only link if lift was logged in last 30 minutes
    if (diffMinutes <= 30) {
      parentLiftLogId = recentLiftLogs[0].id;
    }
  }

  // Create run log with parent reference
  await supabase.from('user_logs').insert({
    user_id: userId,
    run_id: runId,
    log_type: 'run',
    parent_log_id: parentLiftLogId  // ← Links to lift
  });
};
```

**Logic**:
- When logging a run, search for most recent lift log
- If lift was logged within 30 minutes, link the run to it
- If no recent lift, run becomes "orphaned" (can be linked later)

### 3. History Page Hierarchy UI

#### Visual Design

```
┌─────────────────────────────────────────────────────┐
│ March 29, 2026                              4,200 ft│  ← Day header
├─────────────────────────────────────────────────────┤
│ [LIFT] Peak Express              • 3 runs  +2,000 ft│  ← Parent (Ice blue accent)
│   └ Upper Peak Chute            [◆◆]       1,800 ft│  ← Child run (Indented)
│   └ Harmony Bowl                [◆]        1,200 ft│  ← Child run
│   └ Symphony Face               [●]          800 ft│  ← Child run
│ [LIFT] Harmony Express          • 2 runs  +1,500 ft│  ← Parent
│   └ Catskinner                  [●]          600 ft│  ← Child run
│   └ Dave Murray Downhill        [◆]        2,000 ft│  ← Child run
│ Upper Whistler Village          [●]          400 ft│  ← Orphaned run (no parent)
└─────────────────────────────────────────────────────┘
```

#### Design Details

**Parent Lifts**:
- Ice blue left border (3px solid #00B4D8)
- Light blue background (rgba(0, 180, 216, 0.05))
- "LIFT" badge in rounded pill
- Shows child run count (• 3 runs)
- Vertical displayed as "+2,000 ft" (emphasis on gain)
- Can be drag targets for reassigning runs

**Child Runs**:
- Indented 20px from left
- Light border matching parent (rgba(0, 180, 216, 0.3))
- Tree connector: └ character
- Difficulty badge shown
- Vertical displayed normally (not emphasized)
- Draggable to different lifts

**Orphaned Runs**:
- No special styling
- Standard list item appearance
- Draggable to assign to a lift
- Shows drag handle icon in edit mode

### 4. Drag-and-Drop Reassignment

Users can reassign runs to different lifts via drag-and-drop in edit mode:

#### Features
- **Drag Handle**: GripVertical icon appears in edit mode
- **Visual Feedback**: Drop target highlights with dashed blue border
- **Validation**: Prevents dropping run on non-lift logs
- **Toast Messages**: Confirms successful reassignment
- **Undo**: Can unlink runs by setting parent_log_id to null

#### User Flow
```
1. Tap "Edit" button in History page
2. Drag icon (⋮⋮) appears on runs
3. Tap and hold run to start drag
4. Hover over target lift (border highlights)
5. Release to drop
6. Toast: "Reassigned 'Upper Peak' to 'Peak Express'"
7. UI updates with new hierarchy
```

#### Implementation
```javascript
// Drag handlers
const handleDragStart = (e, runLog) => {
  setDraggedRunLog(runLog);
  e.dataTransfer.effectAllowed = 'move';
};

const handleDragOver = (e, liftLog) => {
  if (liftLog.log_type === 'lift') {
    e.preventDefault();
    setDragOverLiftId(liftLog.id);
  }
};

const handleDrop = async (e, targetLiftLog) => {
  await supabase
    .from('user_logs')
    .update({ parent_log_id: targetLiftLog.id })
    .eq('id', draggedRunLog.id);

  toast.success(`Reassigned "${runLog.runs.name}" to "${liftLog.lifts.name}"`);
};

// Unlink run from lift
const handleUnlinkRun = async (runLog) => {
  await supabase
    .from('user_logs')
    .update({ parent_log_id: null })
    .eq('id', runLog.id);
};
```

### 5. Data Loading Changes

#### Old Query (v0.4.1)
```javascript
const { data } = await supabase
  .from('user_logs')
  .select('*, runs(name, difficulty, vertical_ft)')
  .eq('user_id', userId);
```

#### New Query (v0.5.0)
```javascript
const { data } = await supabase
  .from('user_logs')
  .select('*, runs(...), lifts(name, vertical_ft), parent_log_id, log_type')
  .eq('user_id', userId);

// Build hierarchy
const logsById = new Map(data.map(log => [log.id, { ...log, children: [] }]));
const topLevelLogs = [];

logsById.forEach(log => {
  if (log.parent_log_id && logsById.has(log.parent_log_id)) {
    logsById.get(log.parent_log_id).children.push(log);
  } else {
    topLevelLogs.push(log);
  }
});

// Calculate vertical from lifts only
const totalVertical = topLevelLogs
  .filter(log => log.log_type === 'lift')
  .reduce((sum, log) => sum + (log.lifts?.vertical_ft || 0), 0);
```

## User Experience

### Logging Flow

#### Scenario: User takes Peak Express and skis Upper Peak Chute

**Step 1: Log the Lift**
```
User taps: "Peak Express" lift
System creates:
  - user_log (id: abc-123, log_type: 'lift', lift_id: xyz-789)
  - Calculates: vertical_ft = 2,000 (from lift elevations)
```

**Step 2: Log the Run**
```
User taps: "Upper Peak Chute" run
System creates:
  - user_log (id: def-456, log_type: 'run', run_id: uvw-012)
  - Finds recent lift: abc-123 (logged 2 min ago)
  - Sets parent_log_id: abc-123
```

**Step 3: View History**
```
History Page shows:
  [LIFT] Peak Express              • 1 run   +2,000 ft
    └ Upper Peak Chute            [◆◆]       1,800 ft

Day Summary:
  Total Vertical: 2,000 ft (from 1 lift)
  Runs Completed: 1
```

### Edge Cases Handled

#### 1. Orphaned Runs
**Scenario**: User logs run without logging lift first
```
Result:
- Run log created with parent_log_id = null
- Shows in History as top-level item
- User can drag to lift later in edit mode
```

#### 2. Stale Lift Links
**Scenario**: User logs run 1 hour after last lift
```
Logic:
- System checks: (now - lift_log_time) = 60 minutes
- 60 > 30 minute threshold
- Run becomes orphaned (parent_log_id = null)
```

#### 3. Multiple Runs Per Lift
**Scenario**: User takes one lift, skis multiple runs
```
1. Log "Peak Express" lift
2. Log "Upper Peak" run → links to lift
3. Lap back up Peak Express (user logs again)
4. Log "Symphony Face" run → links to 2nd lift log

Result: Two separate lift logs, each with child runs
```

#### 4. Resort Switch
**Scenario**: User moves to different mountain/resort
```
Logic:
- Auto-link only searches current resort (ski_area_id)
- Runs at Resort A won't link to lifts at Resort B
- Prevents incorrect associations
```

### Migration Path for Existing Data

**Existing Run Logs**:
- All have log_type = 'run' (set by previous migration)
- All have parent_log_id = null (no lifts logged yet)
- Show as orphaned in History
- No vertical contributed to stats (only lifts count)

**Future Enhancement**:
- Could analyze run logs and infer likely lift rides
- Batch create lift logs based on run patterns
- Auto-link historical runs to inferred lifts

## Design Compliance

### Alpine Dark Mode Aesthetic

**Colors**:
- **Deep Slate Background**: #12181B
- **Ice Blue Accent**: #00B4D8
- **White Text**: #FFFFFF (primary)
- **Muted Text**: rgba(255,255,255,0.6) (secondary)
- **Lift Highlight**: rgba(0, 180, 216, 0.05) (background)
- **Lift Border**: 3px solid #00B4D8

**Typography**:
- **Primary Font**: Manrope (sans-serif)
- **Monospace Font**: JetBrains Mono (for vertical numbers)
- **Lift Name**: Semibold, Ice Blue
- **Run Name**: Regular, White
- **Vertical**: Monospace, Ice Blue for lifts

**Icons**:
- **Drag Handle**: GripVertical (lucide-react)
- **Lift Badge**: "LIFT" text in pill
- **Tree Connector**: └ character for children

## Performance Optimizations

### 1. Efficient Hierarchy Building
```javascript
// O(n) time complexity - single pass
const logsById = new Map(data.map(log => [log.id, { ...log, children: [] }]));

logsById.forEach(log => {
  if (log.parent_log_id && logsById.has(log.parent_log_id)) {
    logsById.get(log.parent_log_id).children.push(log);
  } else {
    topLevelLogs.push(log);
  }
});
```

### 2. Database Indexes
```sql
-- Fast parent-child lookups
CREATE INDEX idx_user_logs_parent_log_id ON user_logs(parent_log_id);

-- Fast user+parent queries
CREATE INDEX idx_user_logs_user_parent ON user_logs(user_id, parent_log_id);

-- Fast lift log searches (for auto-linking)
CREATE INDEX idx_user_logs_user_type ON user_logs(user_id, log_type);
```

### 3. Selective Queries
```javascript
// Only fetch logs with necessary joins
.select('*, runs(name, difficulty), lifts(name, vertical_ft)')

// Filter at database level
.eq('user_id', userId)
.eq('log_type', 'lift')  // When searching for recent lifts

// Limit recent lift search
.limit(1)  // Only need most recent
```

## Testing Checklist

### Database
- [x] Lift elevations can be added/updated
- [x] vertical_ft auto-calculates on elevation change
- [x] parent_log_id can reference user_logs.id
- [x] Indexes created successfully
- [x] View returns correct hierarchy data

### Statistics
- [x] Total vertical calculated from lift logs only
- [x] Run logs don't contribute to vertical
- [x] SnowStake displays lift-based vertical
- [x] Day summaries show correct totals
- [x] Season stats aggregate lifts correctly

### History UI
- [x] Lifts display with ice blue accent
- [x] Child runs indent correctly under lifts
- [x] Orphaned runs show at top level
- [x] Run count badge shows on lifts
- [x] Vertical displays as "+X,XXX ft" for lifts
- [x] Tree connector (└) appears on children

### Drag-and-Drop
- [x] Drag handle appears in edit mode
- [x] Runs can be dragged
- [x] Lifts highlight as drop targets
- [x] Drop updates parent_log_id
- [x] Toast confirms reassignment
- [x] UI updates after drop
- [x] Can unlink runs from lifts

### Auto-Linking
- [x] Runs link to recent lift (< 30 min)
- [x] Old lifts don't auto-link (> 30 min)
- [x] Only links within same resort
- [x] Orphaned runs created when no recent lift
- [x] Console logs show link decisions

### Build
- [x] Application builds successfully
- [x] No TypeScript errors
- [x] ESLint warnings (non-blocking)
- [x] Bundle size: 299.43 KB (acceptable)

## API Changes

### New Lift Structure
```typescript
interface Lift {
  id: UUID;
  ski_area_id: UUID;
  name: string;
  lift_type?: string;
  base_elevation?: number;      // NEW: Bottom elevation (ft)
  summit_elevation?: number;    // NEW: Top elevation (ft)
  vertical_ft?: number;         // NEW: Auto-calculated gain
  geom?: Geometry;
  created_at: timestamp;
}
```

### User Log Structure
```typescript
interface UserLog {
  id: UUID;
  user_id: UUID;
  run_id?: UUID;
  lift_id?: UUID;
  log_type: 'run' | 'lift';
  parent_log_id?: UUID;         // NEW: Self-reference
  ski_area_id: UUID;
  logged_at: timestamp;
  session_id?: string;

  // Expanded relations
  runs?: Run;
  lifts?: Lift;
  children?: UserLog[];         // NEW: Child logs
}
```

### Statistics Response
```typescript
interface Stats {
  daysLogged: number;
  verticalLogged: number;        // From lifts only
  runsToday: number;
  completedRuns: number;
  totalRuns: number;
  completionPercent: number;
}
```

## Future Enhancements

### 1. Elevation Data Population
- Extract elevation from PostGIS geom data
- Auto-populate base_elevation and summit_elevation
- Use ST_StartPoint and ST_EndPoint on LineString
- Calculate from DEM (Digital Elevation Model) data

### 2. Smart Lift Inference
- Analyze run logs without parents
- Infer which lift was likely taken
- Batch create lift logs retroactively
- Ask user to confirm inferred lifts

### 3. Lap Counter
- Track consecutive rides on same lift
- Show "Lap 3 of Peak Express"
- Calculate average lap time
- Leaderboards for most laps

### 4. Vertical Goals by Lift
- Set goals per lift type (e.g., "Ride 10 high-speed quads")
- Track vertical per lift
- Show progress toward lift-specific goals

### 5. Lift Wait Time Tracking
- Log wait time when logging lift
- Show average wait times
- Suggest lifts with shortest waits
- Historical wait time data

## Breaking Changes

### For Existing Users
- **No vertical from old run logs**: Previous run logs won't contribute to vertical stats
- **Orphaned runs**: All existing runs have parent_log_id = null
- **Manual linking required**: Users must manually link old runs to lifts (or leave orphaned)

### For API Consumers
- **Query changes**: Must join on lifts table for vertical calculation
- **Hierarchy required**: Must build parent-child structure from flat logs
- **Filter changes**: Must filter by log_type when querying specific log types

## Migration Strategy

### Phase 1: Database (✅ Complete)
- Add elevation columns to lifts
- Add parent_log_id to user_logs
- Create indexes
- Create hierarchy view

### Phase 2: Backend Logic (✅ Complete)
- Update vertical calculation
- Implement auto-linking
- Support hierarchy queries

### Phase 3: Frontend UI (✅ Complete)
- Redesign History page
- Add drag-and-drop
- Update StatsSection
- Update SnowStake

### Phase 4: Data Cleanup (Future)
- Populate lift elevations
- Infer historical lift rides
- Link orphaned runs
- Remove invalid logs

## Version Info
- **Previous Version**: v0.4.1 (Layout Update & History Edit)
- **Current Version**: v0.5.0 (Lift-Based Vertical Tracking)
- **Release Date**: March 29, 2026
- **Type**: Major Update (Breaking Changes)
- **Build Status**: ✅ Successful (299.43 KB gzipped)

## Files Modified

### Database
- `supabase/migrations/add_lift_based_vertical_tracking.sql` (new)

### Frontend
- `frontend/src/components/StatsSection.js` (vertical calculation)
- `frontend/src/pages/History.js` (hierarchy UI, drag-and-drop)
- `frontend/src/lib/hooks.js` (auto-linking logic)

### Documentation
- `LIFT_BASED_VERTICAL_TRACKING.md` (this file)

## Summary

This update represents a fundamental shift in how PeakLap tracks vertical progression. By anchoring vertical calculations to lift rides rather than run descents, the system now accurately reflects real-world skiing and provides users with meaningful, motivating statistics that align with industry standards and physical reality.

The parent-child hierarchy enables rich data visualization in the History page, while drag-and-drop editing gives users full control over their data organization. Auto-linking reduces friction during logging, and the 30-minute window strikes a balance between convenience and accuracy.

🎿 **Vertical is now calculated from lift rides—because that's where you actually gain elevation!**
