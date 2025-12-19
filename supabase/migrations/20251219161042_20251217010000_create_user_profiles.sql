/*
  # Create user profiles and authentication system

  1. New Tables
    - `user_profiles`
      - User authentication data linked to Supabase Auth
      - Personal information (name, email, photo)
      - Privacy preferences
      - GDPR/KVKK consent tracking
      - Statistics and preferences

    - `dive_history`
      - Complete dive log for each user
      - Links to dive sessions
      - Stats aggregation

    - `user_consents`
      - GDPR/KVKK consent tracking
      - Version control for legal compliance
      - Timestamp tracking

  2. Security
    - RLS policies for user data
    - Privacy-first design
    - Consent enforcement
*/

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  display_name text,
  avatar_url text,
  phone text,

  -- Diving Information
  certification_org text,
  certification_level text,
  experience_dives integer DEFAULT 0,
  specialties jsonb DEFAULT '[]'::jsonb,

  -- Location
  country text,
  city text,
  region text,

  -- Privacy Settings
  profile_visible boolean DEFAULT true,
  location_sharing_enabled boolean DEFAULT false,
  show_real_name boolean DEFAULT false,

  -- Consent Tracking
  gdpr_consent_given boolean DEFAULT false,
  gdpr_consent_date timestamptz,
  kvkk_consent_given boolean DEFAULT false,
  kvkk_consent_date timestamptz,
  terms_accepted boolean DEFAULT false,
  terms_accepted_date timestamptz,
  marketing_consent boolean DEFAULT false,

  -- Statistics
  total_dives integer DEFAULT 0,
  total_dive_time_minutes integer DEFAULT 0,
  max_depth_meters numeric DEFAULT 0,
  last_dive_date timestamptz,

  -- Emergency Contact
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,

  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_login_at timestamptz,

  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_display_name CHECK (display_name IS NULL OR (length(display_name) > 0 AND length(display_name) <= 50)),
  CONSTRAINT valid_experience CHECK (experience_dives >= 0),
  CONSTRAINT valid_total_dives CHECK (total_dives >= 0)
);

-- Dive History Table
CREATE TABLE IF NOT EXISTS dive_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id uuid REFERENCES dive_sessions(id) ON DELETE SET NULL,

  -- Dive Details
  dive_number integer NOT NULL,
  dive_date timestamptz NOT NULL,
  dive_site_name text,
  dive_site_country text,
  dive_site_city text,

  -- Dive Stats
  max_depth_meters numeric NOT NULL,
  duration_minutes integer NOT NULL,
  water_temperature_celsius numeric,
  visibility_meters numeric,

  -- Equipment
  gas_mix text,
  tank_volume_liters numeric,
  starting_pressure_bar numeric,
  ending_pressure_bar numeric,

  -- Conditions
  weather_conditions text,
  sea_state text,
  current_strength text,

  -- Buddies
  buddy_names text[],
  instructor_name text,

  -- Notes
  notes text,
  highlights text[],
  wildlife_spotted text[],

  -- Photos/Media
  photo_urls text[],

  -- Ratings
  difficulty_rating integer,
  enjoyment_rating integer,

  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT valid_depth CHECK (max_depth_meters > 0 AND max_depth_meters <= 400),
  CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 600),
  CONSTRAINT valid_ratings CHECK (
    (difficulty_rating IS NULL OR (difficulty_rating >= 1 AND difficulty_rating <= 5)) AND
    (enjoyment_rating IS NULL OR (enjoyment_rating >= 1 AND enjoyment_rating <= 5))
  )
);

-- User Consents Table (for legal compliance)
CREATE TABLE IF NOT EXISTS user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  consent_version text NOT NULL,
  consent_text text NOT NULL,
  granted boolean NOT NULL,
  granted_at timestamptz DEFAULT now() NOT NULL,
  ip_address text,
  user_agent text,

  CONSTRAINT valid_consent_type CHECK (consent_type IN ('GDPR', 'KVKK', 'TERMS', 'MARKETING'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_country_city ON user_profiles(country, city);
CREATE INDEX IF NOT EXISTS idx_user_profiles_location_sharing ON user_profiles(location_sharing_enabled) WHERE location_sharing_enabled = true;
CREATE INDEX IF NOT EXISTS idx_dive_history_user_id ON dive_history(user_id);
CREATE INDEX IF NOT EXISTS idx_dive_history_dive_date ON dive_history(dive_date DESC);
CREATE INDEX IF NOT EXISTS idx_dive_history_dive_site ON dive_history(dive_site_country, dive_site_city);
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(user_id, consent_type);

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dive_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles visible to authenticated users"
  ON user_profiles FOR SELECT
  USING (
    profile_visible = true
    AND auth.uid() IS NOT NULL
    AND auth.uid() != id
  );

-- Dive History Policies
CREATE POLICY "Users can view own dive history"
  ON dive_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dive history"
  ON dive_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dive history"
  ON dive_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dive history"
  ON dive_history FOR DELETE
  USING (auth.uid() = user_id);

-- User Consents Policies
CREATE POLICY "Users can view own consents"
  ON user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents"
  ON user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dive_history_updated_at
  BEFORE UPDATE ON dive_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update user dive statistics
CREATE OR REPLACE FUNCTION update_user_dive_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET
    total_dives = (SELECT COUNT(*) FROM dive_history WHERE user_id = NEW.user_id),
    total_dive_time_minutes = (SELECT COALESCE(SUM(duration_minutes), 0) FROM dive_history WHERE user_id = NEW.user_id),
    max_depth_meters = (SELECT COALESCE(MAX(max_depth_meters), 0) FROM dive_history WHERE user_id = NEW.user_id),
    last_dive_date = (SELECT MAX(dive_date) FROM dive_history WHERE user_id = NEW.user_id)
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update stats
CREATE TRIGGER update_user_stats_on_dive_insert
  AFTER INSERT ON dive_history
  FOR EACH ROW
  EXECUTE FUNCTION update_user_dive_stats();

CREATE TRIGGER update_user_stats_on_dive_update
  AFTER UPDATE ON dive_history
  FOR EACH ROW
  EXECUTE FUNCTION update_user_dive_stats();

-- Comments
COMMENT ON TABLE user_profiles IS 'User profiles linked to Supabase Auth with GDPR/KVKK compliance';
COMMENT ON TABLE dive_history IS 'Complete dive log history for users';
COMMENT ON TABLE user_consents IS 'Legal consent tracking for GDPR/KVKK compliance';
COMMENT ON COLUMN user_profiles.gdpr_consent_given IS 'EU GDPR consent for data processing';
COMMENT ON COLUMN user_profiles.kvkk_consent_given IS 'Turkish KVKK consent for data processing';
COMMENT ON COLUMN user_profiles.location_sharing_enabled IS 'Enable real-time location sharing with nearby divers';
