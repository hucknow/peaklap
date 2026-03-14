-- Migration: Create find_resort_by_location function
-- This function finds a resort based on GPS coordinates using boundary box check
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.find_resort_by_location(
  lat numeric,
  lng numeric
)
RETURNS uuid AS $$
DECLARE
  resort_id uuid;
BEGIN
  -- Simple bounding box check against ski_areas boundary jsonb
  SELECT id INTO resort_id
  FROM public.ski_areas
  WHERE
    (boundary->>'minLat')::numeric <= lat AND
    (boundary->>'maxLat')::numeric >= lat AND
    (boundary->>'minLng')::numeric <= lng AND
    (boundary->>'maxLng')::numeric >= lng
  LIMIT 1;

  RETURN resort_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.find_resort_by_location(numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_resort_by_location(numeric, numeric) TO anon;
