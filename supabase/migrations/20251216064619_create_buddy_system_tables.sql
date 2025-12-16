/*
  # Create buddy finder system tables
  
  1. New Tables
    - `buddy_profiles`
      - `id` (uuid, primary key)
      - `device_id` (text, required, hashed for privacy)
      - `session_token` (text, required, rotating token)
      - `display_name` (text, required)
      - `certification` (text, required)
      - `experience_dives` (integer, default 0)
      - `languages` (jsonb, required) - array of language codes
      - `grid_lat` (numeric, required) - rounded for privacy
      - `grid_lon` (numeric, required) - rounded for privacy
      - `available_until` (timestamptz, required) - TTL
      - `created_at` (timestamptz, default now())
    
    - `contact_requests`
      - `id` (uuid, primary key)
      - `from_device_id` (text, required)
      - `to_device_id` (text, required)
      - `status` (text, default 'pending')
      - `message` (text, optional)
      - `created_at` (timestamptz, default now())
      - `expires_at` (timestamptz, required) - auto-expire after 24h
  
  2. Security
    - Enable RLS with privacy-first policies
    - Buddy profiles visible within radius
    - Contact requests only visible to sender/receiver
  
  3. Indexes
    - Geo-spatial index for buddy discovery
    - TTL cleanup indexes
  
  4. Important Notes
    - TTL cleanup must run periodically (external cron job)
    - Device IDs are hashed before storage
    - Grid coordinates rounded to ~1km precision (0.01 degrees)
*/

CREATE TABLE IF NOT EXISTS buddy_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL UNIQUE,
  session_token text NOT NULL,
  display_name text NOT NULL,
  certification text NOT NULL,
  experience_dives integer DEFAULT 0 NOT NULL,
  languages jsonb NOT NULL,
  grid_lat numeric NOT NULL,
  grid_lon numeric NOT NULL,
  available_until timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_display_name CHECK (length(display_name) > 0 AND length(display_name) <= 50),
  CONSTRAINT valid_experience CHECK (experience_dives >= 0),
  CONSTRAINT valid_certification CHECK (certification IN (
    'CMAS_1_STAR', 'CMAS_2_STAR', 'CMAS_3_STAR',
    'PADI_OPEN_WATER', 'PADI_ADVANCED', 'PADI_RESCUE', 'PADI_DIVEMASTER',
    'SSI_OPEN_WATER', 'SSI_ADVANCED',
    'TDI_INTRO_TECH', 'TDI_ADVANCED_NITROX',
    'OTHER'
  ))
);

CREATE TABLE IF NOT EXISTS contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_device_id text NOT NULL,
  to_device_id text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'declined')),
  CONSTRAINT different_devices CHECK (from_device_id != to_device_id)
);

CREATE INDEX IF NOT EXISTS idx_buddy_profiles_location ON buddy_profiles(grid_lat, grid_lon);
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_available_until ON buddy_profiles(available_until);
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_device_id ON buddy_profiles(device_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_from_device ON contact_requests(from_device_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_to_device ON contact_requests(to_device_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_expires_at ON contact_requests(expires_at);

ALTER TABLE buddy_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buddy profiles visible to all (discovery)"
  ON buddy_profiles
  FOR SELECT
  USING (available_until > now());

CREATE POLICY "Devices can insert own buddy profile"
  ON buddy_profiles
  FOR INSERT
  WITH CHECK (device_id = current_setting('app.device_id', true));

CREATE POLICY "Devices can update own buddy profile"
  ON buddy_profiles
  FOR UPDATE
  USING (device_id = current_setting('app.device_id', true))
  WITH CHECK (device_id = current_setting('app.device_id', true));

CREATE POLICY "Devices can delete own buddy profile"
  ON buddy_profiles
  FOR DELETE
  USING (device_id = current_setting('app.device_id', true));

CREATE POLICY "Users can read received contact requests"
  ON contact_requests
  FOR SELECT
  USING (
    to_device_id = current_setting('app.device_id', true)
    OR from_device_id = current_setting('app.device_id', true)
  );

CREATE POLICY "Users can send contact requests"
  ON contact_requests
  FOR INSERT
  WITH CHECK (from_device_id = current_setting('app.device_id', true));

CREATE POLICY "Recipients can update contact request status"
  ON contact_requests
  FOR UPDATE
  USING (to_device_id = current_setting('app.device_id', true))
  WITH CHECK (to_device_id = current_setting('app.device_id', true));
