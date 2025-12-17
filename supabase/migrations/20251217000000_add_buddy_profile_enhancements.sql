/*
  # Enhance buddy profiles with location, instructor role, and specialties

  1. Changes
    - Add location fields (country, city, region)
    - Add role field (DIVER or INSTRUCTOR)
    - Add certification organization field
    - Update certification level to generic levels
    - Add specialties array
    - Add bio field for profile description
    - Add is_instructor boolean for quick filtering

  2. Migration Strategy
    - Add new columns with defaults
    - Create indexes for filtering
    - Update constraints
    - Keep existing data compatible
*/

-- Add new columns to buddy_profiles
ALTER TABLE buddy_profiles
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'DIVER' NOT NULL,
  ADD COLUMN IF NOT EXISTS certification_org text,
  ADD COLUMN IF NOT EXISTS certification_level text,
  ADD COLUMN IF NOT EXISTS specialties jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS is_instructor boolean DEFAULT false NOT NULL;

-- Update existing rows to have default values
UPDATE buddy_profiles
SET
  country = 'TR',
  city = 'Istanbul',
  certification_org = 'PADI',
  certification_level = 'OPEN_WATER'
WHERE country IS NULL;

-- Add NOT NULL constraints after populating defaults
ALTER TABLE buddy_profiles
  ALTER COLUMN country SET NOT NULL,
  ALTER COLUMN city SET NOT NULL,
  ALTER COLUMN certification_org SET NOT NULL,
  ALTER COLUMN certification_level SET NOT NULL;

-- Drop old certification constraint
ALTER TABLE buddy_profiles
  DROP CONSTRAINT IF EXISTS valid_certification;

-- Add new constraints
ALTER TABLE buddy_profiles
  ADD CONSTRAINT valid_role CHECK (role IN ('DIVER', 'INSTRUCTOR')),
  ADD CONSTRAINT valid_certification_org CHECK (certification_org IN (
    'PADI', 'CMAS', 'SSI', 'NAUI', 'TDI', 'SDI', 'IANTD', 'GUE', 'BSAC', 'OTHER'
  )),
  ADD CONSTRAINT valid_certification_level CHECK (certification_level IN (
    'OPEN_WATER', 'ADVANCED', 'RESCUE', 'DIVEMASTER',
    'INSTRUCTOR', 'MASTER_INSTRUCTOR',
    'TECHNICAL', 'CAVE', 'TRIMIX', 'CCR', 'OTHER'
  )),
  ADD CONSTRAINT valid_bio_length CHECK (bio IS NULL OR length(bio) <= 500),
  ADD CONSTRAINT valid_country_code CHECK (length(country) >= 2 AND length(country) <= 3),
  ADD CONSTRAINT valid_city_name CHECK (length(city) > 0 AND length(city) <= 100);

-- Create indexes for new filtering capabilities
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_country ON buddy_profiles(country);
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_city ON buddy_profiles(city);
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_role ON buddy_profiles(role);
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_is_instructor ON buddy_profiles(is_instructor);
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_certification_org ON buddy_profiles(certification_org);
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_specialties ON buddy_profiles USING GIN(specialties);

-- Create composite index for common queries (country + city + role)
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_location_role
  ON buddy_profiles(country, city, role);

-- Add comments for documentation
COMMENT ON COLUMN buddy_profiles.country IS 'ISO country code (e.g., TR, US, GB)';
COMMENT ON COLUMN buddy_profiles.city IS 'City name for buddy matching';
COMMENT ON COLUMN buddy_profiles.region IS 'Optional region/state within country';
COMMENT ON COLUMN buddy_profiles.role IS 'User role: DIVER or INSTRUCTOR';
COMMENT ON COLUMN buddy_profiles.certification_org IS 'Certification organization (PADI, CMAS, SSI, etc.)';
COMMENT ON COLUMN buddy_profiles.certification_level IS 'Certification level independent of organization';
COMMENT ON COLUMN buddy_profiles.specialties IS 'Array of diving specialties';
COMMENT ON COLUMN buddy_profiles.bio IS 'Optional profile description (max 500 chars)';
COMMENT ON COLUMN buddy_profiles.is_instructor IS 'Quick filter for instructor search';
