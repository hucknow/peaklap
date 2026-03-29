# Admin Proposal System - v0.3.0

**Release Date**: March 29, 2026
**Version**: v0.2.0 → v0.3.0 (Functional Update)

## Summary

Added a comprehensive admin and user proposal system that allows users to suggest new resorts, runs, and lifts. Admins can review, approve, or reject these proposals through a dedicated admin interface. The admin area now includes enhanced resort management with publish/unpublish toggles and detailed views of runs and lifts.

## What Changed

### 1. User Proposal System
**Users can now propose content** through Settings → "Propose Content":
- **Propose Runs**: Suggest missing runs at existing resorts
- **Propose Lifts**: Suggest missing lifts at existing resorts
- **Propose Resorts**: Suggest entirely new ski resorts

Each proposal includes:
- Name and basic details (difficulty, type, capacity, etc.)
- Associated resort (for runs/lifts)
- Description field for additional context
- Automatic status tracking (pending/approved/rejected)

### 2. Admin Proposal Review
**New Admin Panel** at `/admin/proposals`:
- View all user-submitted proposals
- Filter by status: Pending, Approved, Rejected
- Review detailed proposal information
- Approve or reject proposals with admin notes
- Track who reviewed and when

### 3. Enhanced Admin Resort Management
**Publish/Unpublish Toggle**:
- Quickly publish or unpublish resorts from the Manage Resorts page
- Published resorts appear to all users
- Unpublished resorts are hidden from user resort selectors
- Confirmation dialog when publishing

**Clickable Resort Cards**:
- Click any resort in the Manage Resorts list to view details
- View all runs and lifts at a resort
- Toggle between Runs and Lifts tabs
- Search within runs and lifts
- Delete individual runs or lifts

### 4. Resort Detail Page
**New page** at `/admin/resort/:id`:
- View resort information (location, run count, lift count, source)
- Browse all runs with difficulty badges and details
- Browse all lifts with type and capacity information
- Search functionality for quick filtering
- Delete runs or lifts directly from the detail view
- Link to edit resort details

## Files Created

### Frontend
- `frontend/src/pages/ResortDetail.js` - Admin resort detail page with runs/lifts
- `frontend/src/pages/AdminProposals.js` - Admin proposal review interface
- `frontend/src/components/ProposeContent.js` - User proposal submission dialog

### Database
- `user_proposals` table - Stores all user-submitted proposals
  - Columns: id, user_id, proposal_type, parent_id, status, data, admin_notes, reviewed_by, reviewed_at, created_at
  - RLS policies: Users can submit and view own proposals, admins can view/update all

## Files Modified

### Frontend
- `frontend/src/pages/ManageResorts.js` - Added clickable resort cards, fixed event propagation for buttons
- `frontend/src/pages/Settings.js` - Added "Propose Content" button in Support section (v0.3.0)
- `frontend/src/pages/AdminDashboard.js` - Added "User Proposals" card linking to review page
- `frontend/src/App.js` - Added routes for ResortDetail and AdminProposals pages

### Database Migration
- `supabase/migrations/add_user_proposals_system.sql` - Created proposals table with RLS

## SQL Migration

**File**: `admin_proposal_system_migration.sql`

Apply this migration to your hosted database to enable the proposal system.

## User Experience

### For Users:
1. Go to Settings → "Support PeakLap"
2. Click "Propose Content"
3. Choose to propose a Run, Lift, or Resort
4. Fill in the details
5. Submit for admin review
6. Receive toast confirmation

### For Admins:
1. Go to Admin Dashboard
2. Click "User Proposals" card
3. Review pending proposals
4. Click approve (✓) or reject (✗)
5. Optionally add admin notes
6. Confirm decision
7. Manually add approved content to database if desired

## Admin Features Summary

- **Publish/Unpublish**: Control resort visibility with toggle switch
- **Resort Detail View**: Click resort to see all runs and lifts
- **Run/Lift Management**: Search, view, and delete runs/lifts
- **Proposal Review**: Approve or reject user suggestions
- **Admin Notes**: Add context to approval/rejection decisions

## Build Status

✅ Build completed successfully
⚠️ Minor ESLint warnings (pre-existing, not related to this update)
⚠️ Source map warnings (dependency issue, does not affect functionality)

## Next Steps

When a proposal is approved:
1. Admin adds the data manually to the appropriate table (ski_areas, runs, or lifts)
2. Data becomes available to all users immediately
3. User is notified through their proposals list (future enhancement)

## Technical Notes

- All proposals stored as JSONB for flexibility
- RLS ensures users can only see their own proposals
- Admins have full visibility and update permissions
- Indexes added for performance on status, user_id, type, and parent_id
- Cascade delete ensures referential integrity
