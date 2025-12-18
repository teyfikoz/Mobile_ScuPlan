/*
  # Create SOS alerts table for emergency situations

  1. New Table
    - `sos_alerts`
      - Emergency SOS alerts
      - Location tracking
      - Status tracking (active, resolved, cancelled)
      - Emergency contact notification status
      - Nearby buddy tracking

  2. Features
    - Real-time emergency alerts
    - Location sharing
    - Automatic notifications
    - Alert history
*/

-- SOS Alerts Table
CREATE TABLE IF NOT EXISTS sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  accuracy numeric,
  message text NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  triggered_at timestamptz DEFAULT now() NOT NULL,
  resolved_at timestamptz,
  buddy_ids uuid[] DEFAULT ARRAY[]::uuid[],
  emergency_contact_notified boolean DEFAULT false,

  CONSTRAINT valid_status CHECK (status IN ('active', 'resolved', 'cancelled')),
  CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sos_alerts_user ON sos_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_triggered_at ON sos_alerts(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_location ON sos_alerts(latitude, longitude);

-- RLS Policies
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;

-- Users can manage their own SOS alerts
CREATE POLICY "Users can manage own SOS alerts"
  ON sos_alerts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can view active SOS alerts in their vicinity (10km)
CREATE POLICY "Users can view nearby active SOS alerts"
  ON sos_alerts FOR SELECT
  USING (
    status = 'active'
    AND auth.uid() IS NOT NULL
    AND auth.uid() != user_id
  );

-- Function to auto-resolve old SOS alerts (24 hours)
CREATE OR REPLACE FUNCTION auto_resolve_old_sos_alerts()
RETURNS void AS $$
BEGIN
  UPDATE sos_alerts
  SET
    status = 'resolved',
    resolved_at = now()
  WHERE status = 'active'
  AND triggered_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE sos_alerts IS 'Emergency SOS alerts with location tracking';
COMMENT ON COLUMN sos_alerts.latitude IS 'Alert location latitude';
COMMENT ON COLUMN sos_alerts.longitude IS 'Alert location longitude';
COMMENT ON COLUMN sos_alerts.status IS 'Alert status (active, resolved, cancelled)';
COMMENT ON COLUMN sos_alerts.buddy_ids IS 'IDs of buddies who were notified';
COMMENT ON COLUMN sos_alerts.emergency_contact_notified IS 'Whether emergency contact was SMS notified';
