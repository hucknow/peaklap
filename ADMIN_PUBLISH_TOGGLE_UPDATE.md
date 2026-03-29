# Admin Publish Toggle & Visibility Fix

## Summary
Updated the admin area to ensure all text is visible (fixed Runs/Lifts toggle) and added a publish toggle to the ResortDetail page for easier resort visibility management.

## Changes Made

### 1. Fixed Runs/Lifts Toggle Visibility (ResortDetail.js)

#### Problem
The Runs/Lifts tab toggle text was not visible due to missing text color styling in the Tabs component.

#### Solution
Added explicit text color classes to TabsList and TabsTrigger components:

```javascript
<TabsList className="grid w-full grid-cols-2 bg-slate-100">
  <TabsTrigger
    value="runs"
    className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-slate-700"
  >
    Runs ({runs.length})
  </TabsTrigger>
  <TabsTrigger
    value="lifts"
    className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-slate-700"
  >
    Lifts ({lifts.length})
  </TabsTrigger>
</TabsList>
```

**Styling Details**:
- **Background**: Light slate gray (`bg-slate-100`) for the tab container
- **Inactive Tabs**: Medium slate text (`text-slate-700`) for visibility
- **Active Tab**: White background (`bg-white`) with dark slate text (`text-slate-900`)
- **Hover States**: Inherited from shadcn/ui Tabs component

### 2. Added Publish Toggle to ResortDetail Page

#### Location
Added to the header of ResortDetail page, next to the "Edit Resort" button.

#### UI Design
```
┌─────────────────────────────────────────────────────────┐
│ 🏔 Resort Name [Published Badge]                        │
│                                                          │
│                        Published  [Toggle] [Edit Resort]│
└─────────────────────────────────────────────────────────┘
```

#### Implementation
```javascript
const handleTogglePublish = async (checked) => {
  const { error } = await supabase
    .from('ski_areas')
    .update({ is_published: checked })
    .eq('id', id);

  if (error) throw error;

  setResort(prev => ({ ...prev, is_published: checked }));
  toast.success(`Resort ${checked ? 'published' : 'unpublished'}`);
};

// In JSX:
<div className="flex items-center gap-2">
  <span className="text-sm text-slate-600">
    {resort.is_published ? 'Published' : 'Hidden'}
  </span>
  <Switch
    checked={resort.is_published || false}
    onCheckedChange={handleTogglePublish}
  />
</div>
```

### 3. Existing Publish Toggle (ManageResorts.js)

The ManageResorts page already had a functioning publish toggle with:
- **Switch Component**: On each resort row
- **Label**: "Published" or "Hidden" text
- **Confirmation Dialog**: When publishing a resort (unpublishing is immediate)
- **Admin Logging**: Logs publish/unpublish actions via `log_admin_action` RPC
- **Toast Notifications**: Confirms successful status changes

## User Flows

### Flow 1: Toggle Publish from Manage Resorts
```
1. Navigate to Admin Dashboard → Manage Resorts
2. Find resort in list
3. Toggle switch next to resort name
   - Publishing: Shows confirmation dialog
   - Unpublishing: Immediate action
4. Toast confirms: "Resort Name published/unpublished"
5. Badge updates: [Published] or [Unpublished]
```

### Flow 2: Toggle Publish from Resort Detail
```
1. Navigate to Admin Dashboard → Manage Resorts
2. Click on a resort to view details
3. Toggle switch in header (next to Edit button)
4. Toast confirms: "Resort published/unpublished"
5. Badge updates instantly
```

### Flow 3: View Runs/Lifts (Fixed Visibility)
```
1. Navigate to Resort Detail page
2. Click "Runs" or "Lifts" tab
   ✅ Text now clearly visible
   ✅ Active tab has white background
   ✅ Inactive tab has slate text
3. Run/lift counts shown in tabs
```

## Design Details

### Colors & Styling
- **Active Tab**: White background, dark slate text
- **Inactive Tab**: Transparent background, medium slate text
- **Tab Container**: Light slate background
- **Toggle Switch**: Uses shadcn/ui Switch component
- **Labels**: Slate-600 text color
- **Badges**: Green for published, gray for unpublished

### Typography
- **Tab Labels**: Default font (14px)
- **Toggle Label**: Small text (12px)
- **Counts**: Shown in parentheses in tabs

### Accessibility
- **Keyboard Navigation**: All toggles and tabs are keyboard accessible
- **Screen Readers**: Labels clearly indicate publish state
- **Visual Contrast**: Sufficient contrast for text visibility
- **Focus States**: Visible focus indicators on interactive elements

## Database Impact

### Schema (No Changes)
The `ski_areas` table already has the `is_published` column:
```sql
ski_areas
├── id (uuid)
├── name (text)
├── is_published (boolean)  ← Used by toggle
├── is_active (boolean)
└── ...
```

### Queries
```javascript
// Update publish status
await supabase
  .from('ski_areas')
  .update({ is_published: true/false })
  .eq('id', resortId);
```

## Testing Checklist

### Visibility Tests
- [x] Runs tab text visible in ResortDetail
- [x] Lifts tab text visible in ResortDetail
- [x] Active tab has clear visual distinction
- [x] Inactive tab text is readable
- [x] Run/lift counts display correctly

### Publish Toggle Tests (ResortDetail)
- [x] Toggle appears in header
- [x] Toggle reflects current publish state
- [x] Clicking toggle updates database
- [x] Toast notification appears
- [x] Badge updates after toggle
- [x] State persists on page reload

### Publish Toggle Tests (ManageResorts)
- [x] Toggle works on each resort row
- [x] Confirmation dialog shows when publishing
- [x] Unpublishing is immediate (no dialog)
- [x] Admin action logged to database
- [x] Resort list updates after toggle
- [x] Filter by published/unpublished works

### Build
- [x] Application builds successfully
- [x] No TypeScript errors
- [x] ESLint warnings (non-blocking)
- [x] Bundle size: 299.51 KB (acceptable)

## Files Modified

### Frontend
- `frontend/src/pages/ResortDetail.js`:
  - Added Switch import
  - Added handleTogglePublish function
  - Added publish toggle to header
  - Fixed TabsList and TabsTrigger visibility styling

### No Backend Changes
- All functionality uses existing database schema
- Uses existing `is_published` column
- No new migrations required

## Admin Features Summary

### Current Admin Capabilities
1. **Dashboard**: View system statistics
2. **Manage Resorts**: List, search, filter, sort resorts
3. **Publish Control**: Toggle resort visibility (2 locations)
4. **Resort Detail**: View runs/lifts with clear tabs
5. **Edit Resort**: Modify resort metadata
6. **Delete Resort**: Remove resort and associated data
7. **Reload Resort**: Re-fetch data from OpenSkiMap
8. **Bulk Load**: Import multiple resorts from OpenSkiMap
9. **Proposal Review**: Review user-submitted content proposals

### Publish Toggle Locations
1. **ManageResorts page**: In each resort row
2. **ResortDetail page**: In the header (NEW)

Both locations update the same `is_published` field and provide instant feedback.

## Version Info
- **Previous Version**: v0.5.0 (Lift-Based Vertical Tracking)
- **Current Version**: v0.5.1 (Admin Publish Toggle & Visibility Fix)
- **Release Date**: March 29, 2026
- **Type**: Enhancement (Non-Breaking)
- **Build Status**: ✅ Successful (299.51 KB gzipped)

## Summary

This update improves the admin experience by:
1. **Fixing visibility issues** with the Runs/Lifts toggle in ResortDetail
2. **Adding convenient publish control** directly in the ResortDetail header
3. **Maintaining consistency** with existing publish toggle in ManageResorts

Admins can now easily toggle resort visibility from two locations, and all text in the admin interface is clearly visible with proper contrast.
