# Version Policy & Update Requirements

## Version Numbering

PeakLap follows semantic versioning: `vMAJOR.MINOR.PATCH`

### Version Bump Rules

- **Minor updates (v0.1.X → v0.1.X+1)**: Bug fixes, UI tweaks, documentation updates
- **Functional updates (v0.X.0 → v0.X+1.0)**: New features, database schema changes, functional improvements
- **Major updates (vX.0.0 → vX+1.0.0)**: Breaking changes, major rewrites (future use)

### Where to Update Version

The version number is displayed in:
- `frontend/src/pages/Settings.js` (line 853) - User-facing version display

## Required Deliverables for ALL Updates

### 1. Version Number Update

**ALWAYS** update the version number in `Settings.js` based on the type of change:

```javascript
// For functional updates (new features):
PeakLap v0.2.0  // Increment MINOR version

// For minor updates (bug fixes):
PeakLap v0.1.1  // Increment PATCH version
```

### 2. SQL Migration Script File

**ALWAYS** provide a standalone SQL migration script file for any database changes.

- Even if the migration was applied via Supabase MCP tool, create the `.sql` file
- Reason: The database is hosted elsewhere and needs the raw SQL script
- Location: Create in `/tmp/cc-agent/64923421/project/supabase/migrations/` (if Supabase-specific) or project root (if standalone)
- Naming convention: `YYYYMMDDHHMMSS_descriptive_name.sql` or `descriptive_name.sql`

### Example SQL Migration Script Format

```sql
/*
  # Feature Name

  1. New Tables / Modified Tables
    - `table_name`
      - `column_name` (type, constraints)
      - Description of changes

  2. Security
    - RLS policies added/modified

  3. Notes
    - Any important information about the migration
*/

-- Migration SQL here
ALTER TABLE profiles ADD COLUMN daily_run_goal integer DEFAULT 3
  CHECK (daily_run_goal >= 1 AND daily_run_goal <= 100);
```

## Update Checklist

Before marking any update as complete, ensure:

- [ ] Version number updated in `Settings.js`
- [ ] SQL migration script file created (if database changes were made)
- [ ] Migration includes detailed comments explaining changes
- [ ] Build completed successfully (`npm run build`)
- [ ] User-facing summary provided (what changed, not how)

## Examples

### Functional Update Example (v0.1.0 → v0.2.0)

**Change**: Added daily run goal tracking feature

**Required**:
1. ✅ Update version to `v0.2.0` in Settings.js
2. ✅ Create `20260329173605_add_daily_run_goal_to_profiles.sql`
3. ✅ Run build to verify
4. ✅ Provide user-facing summary

### Minor Update Example (v0.2.0 → v0.2.1)

**Change**: Fixed typo in Settings page

**Required**:
1. ✅ Update version to `v0.2.1` in Settings.js
2. ⏭️ Skip SQL script (no database changes)
3. ✅ Run build to verify
4. ✅ Provide user-facing summary

## Notes for AI Assistant

When working on updates:
1. **Always ask yourself**: "Is this a minor update (patch) or functional update (minor)?"
2. **Before completing any task**: Check if version was bumped and SQL script was created
3. **For all database changes**: Create the standalone SQL file even if using Supabase MCP tools
4. **Document everything**: User needs to understand what changed without reading code
