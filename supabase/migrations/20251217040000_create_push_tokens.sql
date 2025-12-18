/*
  # Create push tokens table for notifications

  1. New Table
    - `push_tokens`
      - Store user device tokens for push notifications
      - Track device information
      - Support multiple devices per user

  2. Features
    - One token per user per device
    - Automatic cleanup of old tokens
    - Platform tracking (iOS, Android, Web)
*/

-- Push Tokens Table
CREATE TABLE IF NOT EXISTS push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  token text NOT NULL,
  device_id text NOT NULL,
  platform text NOT NULL,
  device_name text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT valid_platform CHECK (platform IN ('ios', 'android', 'web')),
  UNIQUE(user_id, device_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_updated_at ON push_tokens(updated_at);

-- RLS Policies
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own push tokens
CREATE POLICY "Users can manage own push tokens"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_push_token_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER update_push_tokens_timestamp
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_push_token_timestamp();

-- Function to clean up old tokens (inactive for 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_push_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM push_tokens
  WHERE updated_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE push_tokens IS 'Push notification tokens for user devices';
COMMENT ON COLUMN push_tokens.token IS 'Expo push token';
COMMENT ON COLUMN push_tokens.device_id IS 'Unique device identifier';
COMMENT ON COLUMN push_tokens.platform IS 'Device platform (ios, android, web)';
