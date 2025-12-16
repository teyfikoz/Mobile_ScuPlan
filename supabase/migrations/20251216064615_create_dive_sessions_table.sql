/*
  # Create dive_sessions and track_points tables
  
  1. New Tables
    - `dive_sessions`
      - `id` (uuid, primary key)
      - `device_id` (text, required)
      - `schema_version` (integer, default 1)
      - `plan_id` (uuid, optional) - FK to dive_plans
      - `status` (text, required) - 'active' or 'completed'
      - `entry_lat` (double precision, optional)
      - `entry_lon` (double precision, optional)
      - `entry_ts` (timestamptz, optional)
      - `entry_accuracy_m` (numeric, optional)
      - `exit_lat` (double precision, optional)
      - `exit_lon` (double precision, optional)
      - `exit_ts` (timestamptz, optional)
      - `exit_accuracy_m` (numeric, optional)
      - `points_count` (integer, default 0)
      - `started_at` (timestamptz, default now())
      - `ended_at` (timestamptz, optional)
      - `duration_sec` (integer, optional)
      - `max_distance_from_entry_m` (numeric, optional)
      - `total_track_distance_m` (numeric, optional)
      - `notes` (text, optional)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    
    - `track_points`
      - `id` (uuid, primary key)
      - `session_id` (uuid, FK to dive_sessions)
      - `lat` (double precision, required)
      - `lon` (double precision, required)
      - `ts` (timestamptz, required)
      - `accuracy_m` (numeric, optional)
      - `sequence` (integer, required)
  
  2. Security
    - Enable RLS on both tables
    - Devices can only access their own sessions and points
  
  3. Indexes
    - Session by device_id and status
    - Track points by session_id and sequence
*/

CREATE TABLE IF NOT EXISTS dive_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  schema_version integer DEFAULT 1 NOT NULL,
  plan_id uuid REFERENCES dive_plans(id) ON DELETE SET NULL,
  status text DEFAULT 'active' NOT NULL,
  entry_lat double precision,
  entry_lon double precision,
  entry_ts timestamptz,
  entry_accuracy_m numeric,
  exit_lat double precision,
  exit_lon double precision,
  exit_ts timestamptz,
  exit_accuracy_m numeric,
  points_count integer DEFAULT 0 NOT NULL,
  started_at timestamptz DEFAULT now() NOT NULL,
  ended_at timestamptz,
  duration_sec integer,
  max_distance_from_entry_m numeric,
  total_track_distance_m numeric,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_status CHECK (status IN ('active', 'completed')),
  CONSTRAINT valid_points_count CHECK (points_count >= 0)
);

CREATE TABLE IF NOT EXISTS track_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES dive_sessions(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lon double precision NOT NULL,
  ts timestamptz NOT NULL,
  accuracy_m numeric,
  sequence integer NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dive_sessions_device_id ON dive_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_dive_sessions_status ON dive_sessions(status);
CREATE INDEX IF NOT EXISTS idx_dive_sessions_started_at ON dive_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_track_points_session_id ON track_points(session_id);
CREATE INDEX IF NOT EXISTS idx_track_points_sequence ON track_points(session_id, sequence);

ALTER TABLE dive_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Devices can read own dive sessions"
  ON dive_sessions
  FOR SELECT
  USING (device_id = current_setting('app.device_id', true));

CREATE POLICY "Devices can insert own dive sessions"
  ON dive_sessions
  FOR INSERT
  WITH CHECK (device_id = current_setting('app.device_id', true));

CREATE POLICY "Devices can update own dive sessions"
  ON dive_sessions
  FOR UPDATE
  USING (device_id = current_setting('app.device_id', true))
  WITH CHECK (device_id = current_setting('app.device_id', true));

CREATE POLICY "Devices can delete own dive sessions"
  ON dive_sessions
  FOR DELETE
  USING (device_id = current_setting('app.device_id', true));

CREATE POLICY "Devices can read own track points"
  ON track_points
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dive_sessions
      WHERE dive_sessions.id = track_points.session_id
      AND dive_sessions.device_id = current_setting('app.device_id', true)
    )
  );

CREATE POLICY "Devices can insert own track points"
  ON track_points
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dive_sessions
      WHERE dive_sessions.id = track_points.session_id
      AND dive_sessions.device_id = current_setting('app.device_id', true)
    )
  );

CREATE POLICY "Devices can delete own track points"
  ON track_points
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dive_sessions
      WHERE dive_sessions.id = track_points.session_id
      AND dive_sessions.device_id = current_setting('app.device_id', true)
    )
  );
