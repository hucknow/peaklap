-- Sendit Seed Data for Whistler Blackcomb
-- Run this script in your Supabase SQL Editor

-- 1. Insert Ski Area
INSERT INTO ski_areas (id, osm_id, name, area_type, country, region, timezone, boundary)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  123456789,
  'Whistler Blackcomb',
  'resort',
  'Canada',
  'British Columbia',
  'America/Vancouver',
  ST_GeogFromText('MULTIPOLYGON(((-122.95 50.05, -122.85 50.05, -122.85 50.15, -122.95 50.15, -122.95 50.05)))')
);

-- 2. Insert Lifts
INSERT INTO lifts (ski_area_id, osm_id, name, lift_type, capacity, occupancy, is_open, geom) VALUES
('00000000-0000-0000-0000-000000000001', 101, 'Peak Express', 'express_quad', 2400, 4, true, ST_GeogFromText('MULTILINESTRING((-122.950 50.060, -122.945 50.070))')),
('00000000-0000-0000-0000-000000000001', 102, 'Harmony Express', 'express_six', 3000, 6, true, ST_GeogFromText('MULTILINESTRING((-122.940 50.065, -122.935 50.075))')),
('00000000-0000-0000-0000-000000000001', 103, 'Glacier Express', 'express_quad', 2400, 4, true, ST_GeogFromText('MULTILINESTRING((-122.930 50.070, -122.925 50.080))')),
('00000000-0000-0000-0000-000000000001', 104, 'Garbanzo Express', 'express_quad', 2400, 4, true, ST_GeogFromText('MULTILINESTRING((-122.920 50.060, -122.915 50.070))')),
('00000000-0000-0000-0000-000000000001', 105, 'Blackcomb Gondola', 'gondola', 2800, 8, true, ST_GeogFromText('MULTILINESTRING((-122.910 50.055, -122.905 50.075))')),
('00000000-0000-0000-0000-000000000001', 106, 'Excalibur Gondola', 'gondola', 2800, 8, true, ST_GeogFromText('MULTILINESTRING((-122.900 50.058, -122.895 50.072))')),
('00000000-0000-0000-0000-000000000001', 107, 'Jersey Cream Express', 'express_quad', 2400, 4, true, ST_GeogFromText('MULTILINESTRING((-122.890 50.062, -122.885 50.074))')),
('00000000-0000-0000-0000-000000000001', 108, 'Crystal Ridge Express', 'express_quad', 2400, 4, true, ST_GeogFromText('MULTILINESTRING((-122.880 50.064, -122.875 50.076))')),
('00000000-0000-0000-0000-000000000001', 109, '7th Heaven Express', 'express_quad', 2400, 4, true, ST_GeogFromText('MULTILINESTRING((-122.870 50.066, -122.865 50.080))')),
('00000000-0000-0000-0000-000000000001', 110, 'Showcase T-Bar', 't-bar', 1200, 2, true, ST_GeogFromText('MULTILINESTRING((-122.860 50.082, -122.855 50.088))'));

-- 3. Insert Runs (40 runs across various zones and difficulties)

-- PEAK ZONE (Whistler)
INSERT INTO runs (ski_area_id, osm_id, name, piste_type, difficulty, grooming, is_uphill, aspect, vertical_ft, length_m, zone, run_type, description, geom) VALUES
('00000000-0000-0000-0000-000000000001', 201, 'Peak to Creek', 'downhill', 'intermediate', 'groomed', false, 'north', 3280, 11000, 'Peak', 'groomed', 'The longest continuous descent in North America, offering stunning glacier views and consistent intermediate terrain.', ST_GeogFromText('LINESTRING(-122.950 50.070, -122.945 50.060)')),
('00000000-0000-0000-0000-000000000001', 202, 'Franz''s Run', 'downhill', 'intermediate', 'groomed', false, 'northeast', 2200, 2800, 'Peak', 'groomed', 'Wide open cruiser with breathtaking views of the Coast Mountains. Perfect morning warm-up run.', ST_GeogFromText('LINESTRING(-122.948 50.069, -122.943 50.062)')),
('00000000-0000-0000-0000-000000000001', 203, 'Burnt Stew Basin', 'downhill', 'advanced', 'ungroomed', false, 'northwest', 1800, 2200, 'Peak', 'bowl', 'Wide alpine bowl with varied terrain. Best after fresh snowfall for powder stashes.', ST_GeogFromText('LINESTRING(-122.952 50.071, -122.947 50.064)')),
('00000000-0000-0000-0000-000000000001', 204, 'West Bowl', 'downhill', 'expert', 'ungroomed', false, 'west', 2100, 1800, 'Peak', 'bowl', 'Steep alpine terrain with pillow lines and cliff drops. Advanced riders only.', ST_GeogFromText('LINESTRING(-122.954 50.072, -122.949 50.065)')),
('00000000-0000-0000-0000-000000000001', 205, 'Whistler Bowl', 'downhill', 'advanced', 'ungroomed', false, 'south', 1950, 2100, 'Peak', 'bowl', 'Classic bowl skiing with multiple entry points and natural features throughout.', ST_GeogFromText('LINESTRING(-122.951 50.070, -122.946 50.063)')),

-- HARMONY ZONE (Whistler)
INSERT INTO runs (ski_area_id, osm_id, name, piste_type, difficulty, grooming, is_uphill, aspect, vertical_ft, length_m, zone, run_type, description, geom) VALUES
('00000000-0000-0000-0000-000000000001', 206, 'Harmony Piste', 'downhill', 'intermediate', 'groomed', false, 'east', 1200, 2100, 'Harmony', 'groomed', 'Perfectly groomed wide run descending from Harmony Ridge. Great for building confidence.', ST_GeogFromText('LINESTRING(-122.940 50.075, -122.935 50.068)')),
('00000000-0000-0000-0000-000000000001', 207, 'Symphony Bowl', 'downhill', 'advanced', 'ungroomed', false, 'northeast', 1600, 1900, 'Harmony', 'bowl', 'Tree-lined bowl with natural features and powder pockets. Musical name, epic terrain.', ST_GeogFromText('LINESTRING(-122.942 50.076, -122.937 50.069)')),
('00000000-0000-0000-0000-000000000001', 208, 'Poco Solo', 'downhill', 'expert', 'ungroomed', false, 'north', 1400, 1200, 'Harmony', 'trees', 'Tight tree run through old growth forest. Technical and rewarding for experts.', ST_GeogFromText('LINESTRING(-122.941 50.074, -122.936 50.068)')),
('00000000-0000-0000-0000-000000000001', 209, 'Green Acres', 'downhill', 'easy', 'groomed', false, 'southeast', 800, 1800, 'Harmony', 'groomed', 'Gentle green run perfect for learning to link turns. Beautiful tree-lined corridor.', ST_GeogFromText('LINESTRING(-122.939 50.073, -122.934 50.067)')),
('00000000-0000-0000-0000-000000000001', 210, 'Harmony Ridge', 'downhill', 'intermediate', 'groomed', false, 'south', 1100, 2300, 'Harmony', 'groomed', 'Scenic ridge traverse with panoramic views before dropping into the main runs.', ST_GeogFromText('LINESTRING(-122.938 50.075, -122.933 50.068)')),

-- GLACIER ZONE (Blackcomb)
INSERT INTO runs (ski_area_id, osm_id, name, piste_type, difficulty, grooming, is_uphill, aspect, vertical_ft, length_m, zone, run_type, description, geom) VALUES
('00000000-0000-0000-0000-000000000001', 211, 'Blackcomb Glacier', 'downhill', 'intermediate', 'groomed', false, 'north', 1800, 3200, 'Glacier', 'groomed', 'Summer skiing destination with consistent snow and stunning glacier terrain year-round.', ST_GeogFromText('LINESTRING(-122.930 50.080, -122.925 50.072)')),
('00000000-0000-0000-0000-000000000001', 212, 'Showcase Bowl', 'downhill', 'expert', 'ungroomed', false, 'northeast', 2200, 2100, 'Glacier', 'bowl', 'Massive alpine bowl accessed via Showcase T-Bar. Big mountain terrain at its finest.', ST_GeogFromText('LINESTRING(-122.932 50.082, -122.927 50.074)')),
('00000000-0000-0000-0000-000000000001', 213, 'Horstman Glacier', 'downhill', 'intermediate', 'groomed', false, 'northwest', 1500, 2800, 'Glacier', 'groomed', 'High alpine skiing with reliable snow conditions. Training ground for national teams.', ST_GeogFromText('LINESTRING(-122.931 50.081, -122.926 50.073)')),
('00000000-0000-0000-0000-000000000001', 214, 'Glacier Drive', 'downhill', 'easy', 'groomed', false, 'east', 900, 2400, 'Glacier', 'groomed', 'Long cruising run from the glacier back to mid-mountain. Smooth and scenic.', ST_GeogFromText('LINESTRING(-122.929 50.079, -122.924 50.072)')),
('00000000-0000-0000-0000-000000000001', 215, 'Jersey Cream', 'downhill', 'advanced', 'moguls', false, 'south', 1300, 1400, 'Glacier', 'moguls', 'Classic mogul run that tests your technique. Consistent bump field top to bottom.', ST_GeogFromText('LINESTRING(-122.928 50.078, -122.923 50.071)')),

-- 7TH HEAVEN ZONE (Blackcomb)
INSERT INTO runs (ski_area_id, osm_id, name, piste_type, difficulty, grooming, is_uphill, aspect, vertical_ft, length_m, zone, run_type, description, geom) VALUES
('00000000-0000-0000-0000-000000000001', 216, 'Spanky''s Ladder', 'downhill', 'expert', 'ungroomed', false, 'west', 800, 600, '7th Heaven', 'chute', 'Steep chute with mandatory air. Legendary among locals and definitely earns its name.', ST_GeogFromText('LINESTRING(-122.870 50.080, -122.865 50.076)')),
('00000000-0000-0000-0000-000000000001', 217, 'Couloir Extreme', 'downhill', 'expert', 'ungroomed', false, 'north', 1200, 800, '7th Heaven', 'chute', 'One of the steepest inbounds runs in North America. Expert terrain with serious consequences.', ST_GeogFromText('LINESTRING(-122.872 50.081, -122.867 50.077)')),
('00000000-0000-0000-0000-000000000001', 218, 'Cloud Nine', 'downhill', 'advanced', 'ungroomed', false, 'northeast', 1100, 1300, '7th Heaven', 'trees', 'Tree skiing paradise with natural features and powder stashes between the glades.', ST_GeogFromText('LINESTRING(-122.871 50.079, -122.866 50.075)')),
('00000000-0000-0000-0000-000000000001', 219, 'Seventh Heaven', 'downhill', 'intermediate', 'groomed', false, 'east', 1400, 2200, '7th Heaven', 'groomed', 'Main artery from the alpine providing consistent pitch and great flow.', ST_GeogFromText('LINESTRING(-122.869 50.078, -122.864 50.072)')),
('00000000-0000-0000-0000-000000000001', 220, 'Pakalolo', 'downhill', 'advanced', 'ungroomed', false, 'south', 1250, 1600, '7th Heaven', 'trees', 'Technical tree run with natural hits and tight spacing. Locals favorite for powder days.', ST_GeogFromText('LINESTRING(-122.868 50.077, -122.863 50.071)')),

-- SHOWCASE ZONE (Blackcomb)
INSERT INTO runs (ski_area_id, osm_id, name, piste_type, difficulty, grooming, is_uphill, aspect, vertical_ft, length_m, zone, run_type, description, geom) VALUES
('00000000-0000-0000-0000-000000000001', 221, 'Showcase', 'downhill', 'advanced', 'ungroomed', false, 'northwest', 1800, 1700, 'Showcase', 'bowl', 'Wide open alpine terrain perfect for big turns and high speeds in any conditions.', ST_GeogFromText('LINESTRING(-122.862 50.084, -122.857 50.076)')),
('00000000-0000-0000-0000-000000000001', 222, 'Ruby Bowl', 'downhill', 'expert', 'ungroomed', false, 'north', 1600, 1400, 'Showcase', 'bowl', 'Hidden gem accessed from Showcase ridge. Pristine alpine bowl with minimal traffic.', ST_GeogFromText('LINESTRING(-122.864 50.085, -122.859 50.077)')),
('00000000-0000-0000-0000-000000000001', 223, 'Diamond Bowl', 'downhill', 'advanced', 'ungroomed', false, 'northeast', 1550, 1550, 'Showcase', 'bowl', 'Beautiful bowl skiing with options for every line. Holds powder longer than most zones.', ST_GeogFromText('LINESTRING(-122.863 50.083, -122.858 50.076)')),
('00000000-0000-0000-0000-000000000001', 224, 'Garnet Bowl', 'downhill', 'intermediate', 'ungroomed', false, 'east', 1200, 1800, 'Showcase', 'bowl', 'More forgiving bowl terrain perfect for intermediates exploring off-piste skiing.', ST_GeogFromText('LINESTRING(-122.861 50.082, -122.856 50.075)')),

-- CRYSTAL ZONE (Blackcomb)
INSERT INTO runs (ski_area_id, osm_id, name, piste_type, difficulty, grooming, is_uphill, aspect, vertical_ft, length_m, zone, run_type, description, geom) VALUES
('00000000-0000-0000-0000-000000000001', 225, 'Crystal Ridge', 'downhill', 'intermediate', 'groomed', false, 'south', 1300, 2400, 'Crystal', 'groomed', 'Long cruiser with stunning views of the Fitzsimmons Valley and surrounding peaks.', ST_GeogFromText('LINESTRING(-122.880 50.076, -122.875 50.068)')),
('00000000-0000-0000-0000-000000000001', 226, 'Crystal Traverse', 'downhill', 'easy', 'groomed', false, 'southeast', 600, 2800, 'Crystal', 'groomed', 'Gentle traverse connecting the upper mountain zones. Scenic and relaxing.', ST_GeogFromText('LINESTRING(-122.882 50.077, -122.877 50.070)')),
('00000000-0000-0000-0000-000000000001', 227, 'Secret Bowl', 'downhill', 'advanced', 'ungroomed', false, 'west', 1100, 1100, 'Crystal', 'trees', 'Hidden tree run off Crystal Ridge. Short but sweet with natural features throughout.', ST_GeogFromText('LINESTRING(-122.881 50.075, -122.876 06.069)')),
('00000000-0000-0000-0000-000000000001', 228, 'Crystal Chair', 'downhill', 'intermediate', 'groomed', false, 'north', 1000, 1900, 'Crystal', 'groomed', 'Main artery for Crystal zone serving consistent intermediate terrain.', ST_GeogFromText('LINESTRING(-122.879 50.074, -122.874 50.068)')),

-- GARBANZO ZONE (Blackcomb)
INSERT INTO runs (ski_area_id, osm_id, name, piste_type, difficulty, grooming, is_uphill, aspect, vertical_ft, length_m, zone, run_type, description, geom) VALUES
('00000000-0000-0000-0000-000000000001', 229, 'Garbanzo Way', 'downhill', 'easy', 'groomed', false, 'east', 1400, 3200, 'Garbanzo', 'groomed', 'Long gentle run from mid-mountain to base. Perfect for beginners and end-of-day cruising.', ST_GeogFromText('LINESTRING(-122.920 50.070, -122.915 50.060)')),
('00000000-0000-0000-0000-000000000001', 230, 'Easy Out', 'downhill', 'novice', 'groomed', false, 'south', 800, 2100, 'Garbanzo', 'groomed', 'Ultra-gentle learning terrain. The perfect place to experience your first mountain runs.', ST_GeogFromText('LINESTRING(-122.922 50.069, -122.917 50.062)')),
('00000000-0000-0000-0000-000000000001', 231, 'Lower Gear Jammer', 'downhill', 'intermediate', 'groomed', false, 'northeast', 1100, 2000, 'Garbanzo', 'groomed', 'Fun intermediate run with good flow and enough pitch to carry speed.', ST_GeogFromText('LINESTRING(-122.921 50.068, -122.916 06.061)')),

-- TERRAIN PARK
INSERT INTO runs (ski_area_id, osm_id, name, piste_type, difficulty, grooming, is_uphill, aspect, vertical_ft, length_m, zone, run_type, description, geom) VALUES
('00000000-0000-0000-0000-000000000001', 232, 'Nintendo Terrain Park', 'downhill', 'park', 'park', false, 'north', 600, 800, 'Peak', 'park', 'World-class terrain park featuring progressive jumps, rails, and features for all abilities.', ST_GeogFromText('LINESTRING(-122.949 50.068, -122.944 50.064)')),
('00000000-0000-0000-0000-000000000001', 233, 'Highest Level Terrain Park', 'downhill', 'park', 'park', false, 'south', 500, 600, 'Glacier', 'park', 'Advanced park with large jumps and technical features. Summer training destination.', ST_GeogFromText('LINESTRING(-122.927 50.077, -122.922 50.074)')),

-- BACKCOUNTRY ACCESS
INSERT INTO runs (ski_area_id, osm_id, name, piste_type, difficulty, grooming, is_uphill, aspect, vertical_ft, length_m, zone, run_type, description, geom) VALUES
('00000000-0000-0000-0000-000000000001', 234, 'Flute Bowl', 'downhill', 'freeride', 'ungroomed', false, 'west', 2800, 2500, 'Peak', 'backcountry', 'Classic backcountry zone accessible from Whistler Peak. Requires avalanche gear and knowledge.', ST_GeogFromText('LINESTRING(-122.956 50.073, -122.950 50.066)')),
('00000000-0000-0000-0000-000000000001', 235, 'Decker Mountain', 'downhill', 'freeride', 'ungroomed', false, 'northwest', 3200, 3000, 'Harmony', 'backcountry', 'Remote backcountry zone with pristine powder and serious terrain. Expert only.', ST_GeogFromText('LINESTRING(-122.944 50.078, -122.938 50.070)')),

-- ADDITIONAL VARIETY RUNS
INSERT INTO runs (ski_area_id, osm_id, name, piste_type, difficulty, grooming, is_uphill, aspect, vertical_ft, length_m, zone, run_type, description, geom) VALUES
('00000000-0000-0000-0000-000000000001', 236, 'Ego Bowl', 'downhill', 'expert', 'ungroomed', false, 'north', 1400, 1100, 'Peak', 'bowl', 'Steep and consequential bowl. Live up to your ego or get humbled quickly.', ST_GeogFromText('LINESTRING(-122.953 50.069, -122.948 50.063)')),
('00000000-0000-0000-0000-000000000001', 237, 'Dave Murray Downhill', 'downhill', 'advanced', 'groomed', false, 'east', 2800, 3100, 'Peak', 'groomed', 'Olympic downhill course from 2010 Winter Games. Fast and flowing with big turns.', ST_GeogFromText('LINESTRING(-122.947 50.071, -122.942 50.062)')),
('00000000-0000-0000-0000-000000000001', 238, 'Saudan Couloir', 'downhill', 'expert', 'ungroomed', false, 'northeast', 1000, 500, 'Glacier', 'chute', 'Narrow couloir requiring technical skiing. Short but intense with a mandatory entry drop.', ST_GeogFromText('LINESTRING(-122.933 50.081, -122.928 50.078)')),
('00000000-0000-0000-0000-000000000001', 239, 'Steve''s Staircase', 'downhill', 'advanced', 'moguls', false, 'south', 900, 1000, '7th Heaven', 'moguls', 'Relentless bump run that feels like climbing stairs backwards. Great workout.', ST_GeogFromText('LINESTRING(-122.873 50.079, -122.868 50.074)')),
('00000000-0000-0000-0000-000000000001', 240, 'Cruiser', 'downhill', 'easy', 'groomed', false, 'west', 1200, 2600, 'Garbanzo', 'groomed', 'Wide and forgiving run perfect for building confidence and practicing technique.', ST_GeogFromText('LINESTRING(-122.919 50.067, -122.914 50.060)'));

-- 4. Insert Points of Interest

-- On-Mountain Restaurants/Lodges
INSERT INTO points_of_interest (ski_area_id, osm_id, name, poi_type, category, description, elevation_m, price_range, peak_hours, distance_from_base_m, is_verified, geom) VALUES
('00000000-0000-0000-0000-000000000001', 301, 'Roundhouse Lodge', 'restaurant', 'on_mountain', 'Main mid-mountain lodge on Whistler with multiple dining options, stunning views, and a large sunny deck.', 1850, '$$', '12:00-14:00', 1500, true, ST_GeogFromText('POINT(-122.950 50.068)')),
('00000000-0000-0000-0000-000000000001', 302, 'Horstman Hut', 'restaurant', 'on_mountain', 'Blackcomb''s highest dining experience at the top of the Glacier. Rustic alpine atmosphere with incredible panoramas.', 2285, '$$', '11:30-13:30', 2800, true, ST_GeogFromText('POINT(-122.930 50.080)')),
('00000000-0000-0000-0000-000000000001', 303, 'Christine''s Restaurant', 'restaurant', 'on_mountain', 'Fine dining at the top of Blackcomb Gondola. Upscale cuisine with the best views in the resort.', 1840, '$$$', '12:00-14:30', 1600, true, ST_GeogFromText('POINT(-122.910 50.072)')),
('00000000-0000-0000-0000-000000000001', 304, 'Raven''s Nest', 'restaurant', 'on_mountain', 'Casual mid-mountain eatery serving quick bites and hot beverages. Perfect for a quick refuel.', 1630, '$', '11:00-15:00', 1200, true, ST_GeogFromText('POINT(-122.935 50.065)'));

-- Après Venues (Base Area)
INSERT INTO points_of_interest (ski_area_id, osm_id, name, poi_type, category, description, elevation_m, price_range, peak_hours, distance_from_base_m, is_verified, geom) VALUES
('00000000-0000-0000-0000-000000000001', 305, 'Merlin''s Bar', 'bar', 'apres', 'Legendary après spot at the base of Blackcomb. Live music, dancing on tables, and unbeatable energy.', 675, '$$', '15:00-18:00', 50, true, ST_GeogFromText('POINT(-122.905 50.058)')),
('00000000-0000-0000-0000-000000000001', 306, 'Garibaldi Lift Co', 'bar', 'apres', 'Modern après bar and restaurant at Whistler base. Craft cocktails, local beers, and shareable plates.', 670, '$$', '15:30-19:00', 30, true, ST_GeogFromText('POINT(-122.955 50.061)')),
('00000000-0000-0000-0000-000000000001', 307, 'Dusty''s Bar', 'bar', 'apres', 'Classic Whistler après institution. Loud music, cold beers, and the best patio for people watching.', 672, '$', '14:30-18:00', 40, true, ST_GeogFromText('POINT(-122.952 50.060)')),
('00000000-0000-0000-0000-000000000001', 308, 'Longhorn Saloon', 'bar', 'apres', 'Boot-stomping après with live bands, pitchers of beer, and a wild party atmosphere. Whistler tradition.', 668, '$', '15:00-19:00', 60, true, ST_GeogFromText('POINT(-122.958 50.062)'));

-- Success message
SELECT 'Seed data inserted successfully! 1 ski area, 10 lifts, 40 runs, and 8 POIs added.' as status;
