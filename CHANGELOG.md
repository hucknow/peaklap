# Changelog

All notable changes to the PeakLap project will be documented in this file.

## [0.5.2] - History & Snow Stake Fix
### Fixed
- **History Page & KPIs**: Fixed vertical footage calculations to use the new lift-based tracking system exclusively.

## [0.5.1] - Admin Publish Toggle & Visibility Fix
### Added
- **Publish Toggle**: Added convenient publish control directly in the ResortDetail header.
### Fixed
- **Visibility Issues**: Fixed text visibility issues with the Runs/Lifts toggle in ResortDetail.

## [0.4.1] - Layout Update & History Edit
### Added
- **History Edit**: Added edit functionality to the History page for modifying individual log entries (Date, Snow Condition, Notes).
### Changed
- **LogRun Redesign**: Updated layout to match Mountain page (Trail Map at top, Run/Lift toggle, standalone search, filter chips).

## [0.3.0] - Admin Proposal System
### Added
- **User Proposals**: Users can suggest new resorts, runs, and lifts via Settings.
- **Admin Review**: Dedicated interface to review, approve, or reject suggestions.
- **Enhanced Resort Management**: Clickable resort cards to view/delete runs and lifts.

## [0.2.0] - Daily Run Goal
### Added
- **Daily Goal Setting**: Users can set target runs per day in Settings.
- **Dynamic Tracking**: Snow Stake updates based on daily run goal when viewing "Today" stats.

## [0.5.0] - Lift-Based Vertical Tracking
### Added
- **Lift-Based Vertical Tracking**: Transitioned from run-based to lift-based vertical tracking to accurately reflect elevation gained.
- **Parent-Child Hierarchy**: Runs are now automatically linked as children of the most recently taken lift (within a 30-minute window).
- **Drag-and-Drop Reassignment**: Users can manually reassign orphaned runs to lifts in History edit mode.

### Changed
- `user_logs` table updated to support `parent_log_id` self-reference.
- `lifts` table enhanced with `base_elevation`, `summit_elevation`, and `vertical_ft`.
- Total vertical is now calculated exclusively from lift logs.
- Redesigned History page to show lift and run hierarchy utilizing the Alpine Dark Mode aesthetic.

## [0.4.0] - Unified Filtering & Lift Logging
### Added
- **Lift Logging System**: Added support to log lifts in addition to runs (`user_logs` table updated with `lift_id` and `log_type`).
- **Unified Filter Bar**: Reusable, collapsible filter bar with real-time text search, mountain filter, difficulty filter, type filter, and history tags.
- **Advanced History Management**: Added Edit Mode for individual and bulk day deletions.

### Changed
- Optimized database queries with new indexes (`idx_user_logs_lift_id`, `idx_user_logs_log_type`).

## Admin & System Updates
### Added
- **Admin Resort Loader**: Hidden admin screen (accessible via 3-second long-press on app version) to dynamically load ski resort data (runs, lifts, boundaries) from OpenSkiData using OSM IDs.
- **Database Migrations (`002_openskidata_schema_update.sql`)**: Added `osm_id`, `skimap_id` to `ski_areas`, and `piste_difficulty`, `piste_type`, `grooming` to `runs`. Added `runs_openskidata` and `lifts_openskidata` views.

### Fixed
- **React 19 Peer Dependency Conflicts**: Added `.npmrc` (`legacy-peer-deps=true`), `.yarnrc`, and `package.json` overrides to automatically resolve React 19 peer dependency warnings and installation errors.
- **NPM Vulnerabilities**: Fixed 20+ vulnerabilities and deprecated package warnings by overriding legacy packages like `inflight`, `glob`, `rimraf`, and `@babel/plugin-proposal-*`.
- **Black Screen Troubleshooting**: Documented that the dark slate background (`#12181B`) is intentional for the Alpine Dark Mode design. Added troubleshooting guide (hard refresh, clearing cache, supervisor restarts) for actual blank screens.