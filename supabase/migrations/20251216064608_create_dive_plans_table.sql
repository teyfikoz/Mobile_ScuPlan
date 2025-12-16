/*
  # Create dive_plans table
  
  1. New Tables
    - `dive_plans`
      - `id` (uuid, primary key)
      - `device_id` (text) - Anonymous device identifier
      - `schema_version` (integer, default 1)
      - `name` (text, required)
      - `notes` (text, optional)
      - `location_name` (text, optional)
      - `location_lat` (double precision, optional)
      - `location_lon` (double precision, optional)
      - `unit_system` (text, default 'metric')
      - `max_depth` (numeric, required) - in meters
      - `planned_runtime_min` (integer, required)
      - `gases` (jsonb, required) - array of gas mixes
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on `dive_plans` table
    - Policy: Device can read/write own plans (based on device_id)
  
  3. Indexes
    - Index on device_id for faster queries
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS dive_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  schema_version integer DEFAULT 1 NOT NULL,
  name text NOT NULL,
  notes text,
  location_name text,
  location_lat double precision,
  location_lon double precision,
  unit_system text DEFAULT 'metric' NOT NULL,
  max_depth numeric NOT NULL,
  planned_runtime_min integer NOT NULL,
  gases jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_unit_system CHECK (unit_system IN ('metric', 'imperial')),
  CONSTRAINT valid_max_depth CHECK (max_depth > 0),
  CONSTRAINT valid_runtime CHECK (planned_runtime_min > 0)
);

CREATE INDEX IF NOT EXISTS idx_dive_plans_device_id ON dive_plans(device_id);
CREATE INDEX IF NOT EXISTS idx_dive_plans_created_at ON dive_plans(created_at DESC);

ALTER TABLE dive_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Devices can read own dive plans"
  ON dive_plans
  FOR SELECT
  USING (device_id = current_setting('app.device_id', true));

CREATE POLICY "Devices can insert own dive plans"
  ON dive_plans
  FOR INSERT
  WITH CHECK (device_id = current_setting('app.device_id', true));

CREATE POLICY "Devices can update own dive plans"
  ON dive_plans
  FOR UPDATE
  USING (device_id = current_setting('app.device_id', true))
  WITH CHECK (device_id = current_setting('app.device_id', true));

CREATE POLICY "Devices can delete own dive plans"
  ON dive_plans
  FOR DELETE
  USING (device_id = current_setting('app.device_id', true));
