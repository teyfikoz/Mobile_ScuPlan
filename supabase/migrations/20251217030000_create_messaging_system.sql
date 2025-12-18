/*
  # Create real-time messaging system

  1. New Tables
    - `conversations`
      - One-to-one or group conversations
      - Participant tracking
      - Last message metadata
      - Read/unread status

    - `messages`
      - Text messages
      - Image/media support
      - Read receipts
      - Reply threading
      - Reactions

    - `contact_requests_v2`
      - Enhanced contact request system
      - Accept/decline flow
      - Message on accept
      - Expiration handling

  2. Features
    - Real-time message delivery
    - Read receipts
    - Typing indicators
    - Message search
    - Media support
    - Group chats (future)
*/

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text DEFAULT 'direct' NOT NULL, -- 'direct' or 'group'
  name text, -- For group chats
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_message_at timestamptz,
  last_message_text text,
  last_message_sender_id uuid,

  CONSTRAINT valid_type CHECK (type IN ('direct', 'group'))
);

-- Conversation Participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now() NOT NULL,
  last_read_at timestamptz DEFAULT now() NOT NULL,
  unread_count integer DEFAULT 0 NOT NULL,
  is_admin boolean DEFAULT false,
  is_active boolean DEFAULT true,

  UNIQUE(conversation_id, user_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,

  -- Message content
  message_text text,
  message_type text DEFAULT 'text' NOT NULL, -- 'text', 'image', 'location', 'dive_log'
  media_url text,
  metadata jsonb, -- For location coords, dive log reference, etc.

  -- Reply threading
  reply_to_message_id uuid REFERENCES messages(id) ON DELETE SET NULL,

  -- Status
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'image', 'location', 'dive_log', 'contact')),
  CONSTRAINT has_content CHECK (
    message_text IS NOT NULL OR
    media_url IS NOT NULL OR
    metadata IS NOT NULL
  )
);

-- Message Read Receipts
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now() NOT NULL,

  UNIQUE(message_id, user_id)
);

-- Message Reactions
CREATE TABLE IF NOT EXISTS message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  reaction text NOT NULL, -- emoji or reaction type
  created_at timestamptz DEFAULT now() NOT NULL,

  UNIQUE(message_id, user_id, reaction)
);

-- Enhanced Contact Requests
CREATE TABLE IF NOT EXISTS contact_requests_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' NOT NULL,
  message text,

  -- Metadata
  context text, -- 'buddy_finder', 'nearby', 'search', etc.
  metadata jsonb,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '7 days') NOT NULL,
  responded_at timestamptz,

  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  CONSTRAINT different_users CHECK (from_user_id != to_user_id),
  UNIQUE(from_user_id, to_user_id)
);

-- Typing Indicators (ephemeral, can be stored in memory or short TTL)
CREATE TABLE IF NOT EXISTS typing_indicators (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now() NOT NULL,

  PRIMARY KEY (conversation_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_unread ON conversation_participants(user_id, unread_count) WHERE unread_count > 0;
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_to_user ON contact_requests_v2(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_from_user ON contact_requests_v2(from_user_id, status);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON typing_indicators(conversation_id);

-- Full text search on messages
CREATE INDEX IF NOT EXISTS idx_messages_text_search ON messages USING gin(to_tsvector('english', message_text));

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can see conversations they're part of
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
      AND conversation_participants.is_active = true
    )
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Conversation Participants
CREATE POLICY "Users can view conversation participants"
  ON conversation_participants FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join conversations"
  ON conversation_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own participant record"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Messages
CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
      AND conversation_participants.is_active = true
    )
  );

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
      AND conversation_participants.is_active = true
    )
  );

CREATE POLICY "Senders can update own messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Message Read Receipts
CREATE POLICY "Users can manage own read receipts"
  ON message_read_receipts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Message Reactions
CREATE POLICY "Users can manage own reactions"
  ON message_reactions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Participants can view reactions"
  ON message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages
      JOIN conversation_participants ON conversation_participants.conversation_id = messages.conversation_id
      WHERE messages.id = message_reactions.message_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Contact Requests
CREATE POLICY "Users can view relevant contact requests"
  ON contact_requests_v2 FOR SELECT
  USING (
    from_user_id = auth.uid() OR
    to_user_id = auth.uid()
  );

CREATE POLICY "Users can send contact requests"
  ON contact_requests_v2 FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Recipients can update requests"
  ON contact_requests_v2 FOR UPDATE
  USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());

-- Typing Indicators
CREATE POLICY "Participants can manage typing indicators"
  ON typing_indicators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = typing_indicators.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = typing_indicators.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Functions

-- Function to update conversation last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_at = NEW.created_at,
    last_message_text = SUBSTRING(NEW.message_text, 1, 100),
    last_message_sender_id = NEW.sender_id,
    updated_at = now()
  WHERE id = NEW.conversation_id;

  -- Increment unread count for all participants except sender
  UPDATE conversation_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
  AND user_id != NEW.sender_id
  AND is_active = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  -- Insert read receipts for unread messages
  INSERT INTO message_read_receipts (message_id, user_id)
  SELECT m.id, p_user_id
  FROM messages m
  WHERE m.conversation_id = p_conversation_id
  AND m.sender_id != p_user_id
  AND NOT EXISTS (
    SELECT 1 FROM message_read_receipts mrr
    WHERE mrr.message_id = m.id
    AND mrr.user_id = p_user_id
  );

  -- Reset unread count
  UPDATE conversation_participants
  SET
    unread_count = 0,
    last_read_at = now()
  WHERE conversation_id = p_conversation_id
  AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create direct conversation
CREATE OR REPLACE FUNCTION create_direct_conversation(
  p_user1_id uuid,
  p_user2_id uuid
)
RETURNS uuid AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  -- Check if conversation already exists
  SELECT c.id INTO v_conversation_id
  FROM conversations c
  WHERE c.type = 'direct'
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp1
    WHERE cp1.conversation_id = c.id
    AND cp1.user_id = p_user1_id
  )
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp2
    WHERE cp2.conversation_id = c.id
    AND cp2.user_id = p_user2_id
  );

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO conversations (type, created_by)
  VALUES ('direct', p_user1_id)
  RETURNING id INTO v_conversation_id;

  -- Add participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES
    (v_conversation_id, p_user1_id),
    (v_conversation_id, p_user2_id);

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Cleanup old typing indicators (can be run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE updated_at < now() - interval '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE conversations IS 'Chat conversations between users';
COMMENT ON TABLE messages IS 'Individual messages in conversations with media support';
COMMENT ON TABLE message_read_receipts IS 'Track when users read messages';
COMMENT ON TABLE contact_requests_v2 IS 'Enhanced contact request system with accept/decline';
COMMENT ON TABLE typing_indicators IS 'Real-time typing indicators (short TTL)';
