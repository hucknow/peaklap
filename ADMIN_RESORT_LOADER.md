# Admin Resort Loader

## Overview

PeakLap now includes a hidden admin screen that allows you to dynamically load ski resort data from OpenSkiData API. This eliminates the need to manually maintain resort data and allows the app to support any ski resort in the world.

## Features

- **Dynamic Resort Loading**: Load any ski resort from OpenSkiData using its OSM ID
- **Automatic Data Import**: Fetches ski areas, runs, and lifts in a single flow
- **Progress Tracking**: Visual progress indicator showing current import step
- **Error Handling**: Automatic rollback if import fails
- **Data Validation**: Converts units and validates data before insertion

## Accessing the Admin Screen

The admin screen is intentionally hidden to prevent accidental access by regular users.

### How to Access:

1. Open the app and navigate to **Settings**
2. Scroll to the bottom of the page
3. Find the app version text: "PeakLap v0.1.0"
4. **Long-press** (hold for 3 seconds) on the version number
5. You'll be redirected to the Admin Resort Loader screen

### Mobile:
- Touch and hold the version number for 3 seconds

### Desktop:
- Click and hold the version number for 3 seconds

## Using the Admin Resort Loader

### Step 1: Find a Ski Resort on OpenSkiData

1. Visit [openskidata.org](https://openskidata.org)
2. Search for the ski resort you want to add
3. Click on the resort to view its details
4. Note the **OSM ID** from the URL or details panel
   - Example: For Whistler Blackcomb, the OSM ID might be `123456`

### Step 2: Load the Resort

1. Enter the OSM ID in the input field
2. Click **"Load Resort Data"**
3. Wait for the import to complete (usually 10-30 seconds)

### Import Process:

The loader performs these steps automatically:

1. **Fetch ski area data** from OpenSkiData API
2. **Insert ski area** into the database
3. **Fetch runs** for the ski area
4. **Insert runs** with proper unit conversion (meters → feet)
5. **Fetch lifts** for the ski area
6. **Insert lifts** into the database

### Progress Indicator:

You'll see a progress bar and status messages:
- "Fetching ski area data..." (10%)
- "Inserting ski area..." (25%)
- "Fetching runs..." (40%)
- "Inserting runs..." (60%)
- "Fetching lifts..." (75%)
- "Inserting lifts..." (90%)
- "Complete!" (100%)

### Success Message:

When complete, you'll see:
```
Success! Loaded [Resort Name]:
• X runs
• Y lifts
```

## Data Mapping

### Ski Area Fields:

| OpenSkiData Field | Database Field | Notes |
|------------------|----------------|-------|
| properties.name | name | Resort name |
| properties.type | area_type | downhill, nordic, etc. |
| properties.location.iso3166_1Alpha2 | country | ISO country code |
| properties.location.localized.en.region | region | Region name |
| properties.websites[0] | website | First website URL |
| properties.skimap_id | skimap_id | OpenSkiMap ID |
| geometry | boundary | GeoJSON polygon |
| osm_id (input) | osm_id | OSM identifier |

### Run Fields:

| OpenSkiData Field | Database Field | Notes |
|------------------|----------------|-------|
| properties.name | name | Run name |
| properties["piste:type"] | piste_type | downhill, nordic, etc. |
| properties["piste:difficulty"] | piste_difficulty | Primary difficulty field |
| properties["piste:difficulty"] | difficulty | Backward compatibility |
| properties["piste:grooming"] | grooming | classic, skating, etc. |
| properties.ref | ref | Run reference number |
| properties.description | description | Run description |
| properties.vertical | vertical_ft | Converted: meters × 3.28084 |
| properties.length | length_m | Length in meters |
| geometry | geom | GeoJSON linestring |

### Lift Fields:

| OpenSkiData Field | Database Field | Notes |
|------------------|----------------|-------|
| properties.name | name | Lift name |
| properties.aerialway | aerialway | Primary lift type |
| properties.aerialway | lift_type | Backward compatibility |
| properties.capacity.total | capacity | Total capacity |
| properties.ref | ref | Lift reference number |
| geometry | geom | GeoJSON linestring |

## Database Schema Updates

Before using the admin loader, apply the database migration:

### File: `openskidata_schema_update.sql`

This migration adds:

1. **New Fields**:
   - `ski_areas.osm_id`
   - `ski_areas.skimap_id`
   - `runs.piste_difficulty`
   - `runs.piste_type`
   - `runs.grooming`
   - `lifts.aerialway`

2. **Database Views**:
   - `runs_openskidata` - Standardized run queries
   - `lifts_openskidata` - Standardized lift queries

3. **Helper Functions**:
   - `find_resort_by_location(lat, lng, radius)` - Find nearby resorts
   - `get_ski_area_stats(ski_area_id)` - Get resort statistics

### Apply the Migration:

```bash
# In Supabase Dashboard > SQL Editor
# Copy and paste the contents of openskidata_schema_update.sql
# Click "Run"
```

## Error Handling

### Automatic Rollback:

If any step fails during import, the loader will:
1. Display the error message
2. Automatically delete the partially inserted ski area
3. Cascade delete any runs or lifts that were inserted
4. Reset the progress bar

### Common Errors:

**"No ski area found with that OSM ID"**
- The OSM ID doesn't exist or is incorrect
- Double-check the ID on openskidata.org

**"Failed to fetch ski area"**
- Network connection issue
- OpenSkiData API is down
- CORS policy blocking the request

**Database insert errors**
- Duplicate OSM ID (resort already exists)
- Missing required fields
- Invalid GeoJSON data

## Querying OpenSkiData

### Updated Query Patterns:

**Old Pattern (hardcoded resort):**
```javascript
const { data } = await supabase
  .from('runs')
  .select('*')
  .eq('name', 'Whistler Blackcomb');
```

**New Pattern (dynamic resort):**
```javascript
// Use the runs_openskidata view
const { data } = await supabase
  .from('runs_openskidata')
  .select('*, ski_areas(name)')
  .eq('ski_area_id', selectedResortId);
```

### Benefits of Views:

- **Standardized Fields**: Always use `piste_difficulty` instead of `difficulty`
- **Fallback Logic**: Views handle missing fields gracefully
- **Future-Proof**: Can update view logic without changing queries

## API Endpoints

### OpenSkiData API

**Base URL**: `https://api.openskidata.org`

**Endpoints Used:**

1. **Get Ski Area by OSM ID**
   ```
   GET /skiAreas?osm_id={osm_id}
   ```

2. **Get Runs by Ski Area**
   ```
   GET /runs?skiAreaID={id}
   ```
   Note: Use the `id` from skiAreas response, not the OSM ID

3. **Get Lifts by Ski Area**
   ```
   GET /lifts?skiAreaID={id}
   ```

### Rate Limits:

OpenSkiData API has no documented rate limits, but be respectful:
- Don't spam requests
- Load resorts one at a time
- Cache results when possible

## Security Considerations

### Why Hide the Admin Screen?

1. **Prevent Accidental Data Imports**: Regular users shouldn't accidentally load duplicate resorts
2. **Data Quality Control**: Admin access ensures data is validated before import
3. **API Usage Management**: Prevents abuse of OpenSkiData API

### Access Control:

Currently, the admin screen requires:
- User authentication (protected route)
- Knowledge of the long-press gesture

**Future Enhancement**: Add a `is_admin` flag to the `profiles` table for proper role-based access control.

## Troubleshooting

### Long-Press Not Working:

**Desktop:**
- Make sure to hold the mouse button down for the full 3 seconds
- Don't move the mouse while holding

**Mobile:**
- Press and hold firmly without moving your finger
- Ensure touch gestures are enabled

**Alternative Access:**
- Manually navigate to `/admin/resort-loader` in your browser

### Import Hanging:

If the import appears stuck:
1. Wait 60 seconds (some resorts have thousands of runs)
2. Check browser console for errors
3. Refresh the page and try again
4. Try a smaller resort first to verify connectivity

### Duplicate Resort Error:

If you get a duplicate key error:
- The resort (OSM ID) already exists in the database
- Check the resorts list to confirm
- Delete the existing resort if you want to re-import

## Future Enhancements

### Planned Features:

1. **Bulk Import**: Load multiple resorts at once
2. **Update Existing**: Refresh data for existing resorts
3. **Search by Name**: Find OSM ID by resort name
4. **Preview Before Import**: Show stats before confirming
5. **Import History**: Track what's been imported and when
6. **Role-Based Access**: Proper admin permissions

### Integration Ideas:

1. **Automatic Location Detection**: Auto-load nearest resort
2. **Community Contributions**: Let users submit resorts
3. **Data Validation**: Verify run difficulties match regional conventions
4. **Image Upload**: Add resort photos during import

## Support

For issues or questions:
- Email: info@peaklap.com
- Include: OSM ID, error message, and browser console logs

## References

- [OpenSkiData API Documentation](https://openskimap.org/api/)
- [OpenStreetMap Wiki - Piste Maps](https://wiki.openstreetmap.org/wiki/Piste_Maps)
- [Supabase Documentation](https://supabase.com/docs)
