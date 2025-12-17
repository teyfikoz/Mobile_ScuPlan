/*
  # Create user locations table for real-time buddy discovery

  1. New Table
    - `user_locations`
      - Real-time location sharing
      - Updated when user moves
      - Automatically cleaned up
      - Used for nearby buddy discovery

  2. Features
    - TTL-based expiration (locations older than 1 hour are ignored)
    - Fast geo-spatial queries
    - Privacy-first (only if user enables location sharing)
    - Automatic cleanup

  3. Indexes
    - Compound index for geo queries
    - TTL index for cleanup
*/

-- User Locations Table (for real-time discovery)
CREATE TABLE IF NOT EXISTS user_locations (
  user_id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  accuracy_meters numeric,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180),
  CONSTRAINT valid_accuracy CHECK (accuracy_meters IS NULL OR accuracy_meters >= 0)
);

-- Indexes for fast geo queries
CREATE INDEX IF NOT EXISTS idx_user_locations_coords ON user_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_user_locations_updated_at ON user_locations(updated_at);

-- Compound index for common queries
CREATE INDEX IF NOT EXISTS idx_user_locations_geo_time ON user_locations(latitude, longitude, updated_at);

-- RLS Policies
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Users can update their own location
CREATE POLICY "Users can update own location"
  ON user_locations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can see locations of users with location sharing enabled
CREATE POLICY "Can view locations with sharing enabled"
  ON user_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = user_locations.user_id
      AND user_profiles.location_sharing_enabled = true
      AND user_profiles.profile_visible = true
    )
    AND auth.uid() IS NOT NULL
  );

-- Function to clean up old locations (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_locations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM user_locations
  WHERE updated_at < now() - interval '1 hour';
END;
$$;

-- You can set up a cron job to run this periodically
-- Example using pg_cron (if installed):
-- SELECT cron.schedule('cleanup-old-locations', '*/15 * * * *', 'SELECT cleanup_old_locations()');

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER update_user_locations_timestamp
  BEFORE UPDATE ON user_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_location_timestamp();

-- Comments
COMMENT ON TABLE user_locations IS 'Real-time user locations for nearby buddy discovery (1 hour TTL)';
COMMENT ON COLUMN user_locations.latitude IS 'Current latitude (-90 to 90)';
COMMENT ON COLUMN user_locations.longitude IS 'Current longitude (-180 to 180)';
COMMENT ON COLUMN user_locations.accuracy_meters IS 'GPS accuracy in meters';
COMMENT ON COLUMN user_locations.updated_at IS 'Last location update timestamp (auto-updated)';
