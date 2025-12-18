import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types
export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
  lastMessageAt?: number;
  lastMessageText?: string;
  lastMessageSenderId?: string;
  participants: ConversationParticipant[];
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  joinedAt: number;
  lastReadAt: number;
  unreadCount: number;
  isAdmin: boolean;
  isActive: boolean;
  user?: {
    id: string;
    displayName?: string;
    fullName?: string;
    avatarUrl?: string;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  messageText?: string;
  messageType: 'text' | 'image' | 'location' | 'dive_log' | 'contact';
  mediaUrl?: string;
  metadata?: any;
  replyToMessageId?: string;
  isDeleted: boolean;
  deletedAt?: number;
  createdAt: number;
  updatedAt: number;
  readReceipts?: MessageReadReceipt[];
  reactions?: MessageReaction[];
  sender?: {
    id: string;
    displayName?: string;
    fullName?: string;
    avatarUrl?: string;
  };
}

export interface MessageReadReceipt {
  id: string;
  messageId: string;
  userId: string;
  readAt: number;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  reaction: string;
  createdAt: number;
}

export interface ContactRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  context?: string;
  metadata?: any;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  respondedAt?: number;
  fromUser?: {
    id: string;
    displayName?: string;
    fullName?: string;
    avatarUrl?: string;
  };
  toUser?: {
    id: string;
    displayName?: string;
    fullName?: string;
    avatarUrl?: string;
  };
}

// Create or get direct conversation
export async function createDirectConversation(
  user1Id: string,
  user2Id: string
): Promise<string> {
  const { data, error } = await supabase.rpc('create_direct_conversation', {
    p_user1_id: user1Id,
    p_user2_id: user2Id,
  });

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return data;
}

// Get user's conversations
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select(`
      *,
      conversation:conversations(
        id,
        type,
        name,
        created_by,
        created_at,
        updated_at,
        last_message_at,
        last_message_text,
        last_message_sender_id
      ),
      user_profile:user_profiles(
        id,
        display_name,
        full_name,
        avatar_url
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('conversation.last_message_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch conversations: ${error.message}`);
  }

  if (!data) return [];

  // Group by conversation
  const conversationMap = new Map<string, any>();

  for (const participant of data) {
    const conv = participant.conversation;
    if (!conv) continue;

    if (!conversationMap.has(conv.id)) {
      conversationMap.set(conv.id, {
        id: conv.id,
        type: conv.type,
        name: conv.name,
        createdBy: conv.created_by,
        createdAt: new Date(conv.created_at).getTime(),
        updatedAt: new Date(conv.updated_at).getTime(),
        lastMessageAt: conv.last_message_at ? new Date(conv.last_message_at).getTime() : undefined,
        lastMessageText: conv.last_message_text,
        lastMessageSenderId: conv.last_message_sender_id,
        participants: [],
      });
    }

    conversationMap.get(conv.id).participants.push({
      id: participant.id,
      conversationId: participant.conversation_id,
      userId: participant.user_id,
      joinedAt: new Date(participant.joined_at).getTime(),
      lastReadAt: new Date(participant.last_read_at).getTime(),
      unreadCount: participant.unread_count,
      isAdmin: participant.is_admin,
      isActive: participant.is_active,
      user: participant.user_profile,
    });
  }

  return Array.from(conversationMap.values());
}

// Get conversation by ID
export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      participants:conversation_participants(
        *,
        user_profile:user_profiles(
          id,
          display_name,
          full_name,
          avatar_url
        )
      )
    `)
    .eq('id', conversationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch conversation: ${error.message}`);
  }

  if (!data) return null;

  return {
    id: data.id,
    type: data.type,
    name: data.name,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
    lastMessageAt: data.last_message_at ? new Date(data.last_message_at).getTime() : undefined,
    lastMessageText: data.last_message_text,
    lastMessageSenderId: data.last_message_sender_id,
    participants: (data.participants || []).map((p: any) => ({
      id: p.id,
      conversationId: p.conversation_id,
      userId: p.user_id,
      joinedAt: new Date(p.joined_at).getTime(),
      lastReadAt: new Date(p.last_read_at).getTime(),
      unreadCount: p.unread_count,
      isAdmin: p.is_admin,
      isActive: p.is_active,
      user: p.user_profile,
    })),
  };
}

// Get messages in conversation
export async function getMessages(
  conversationId: string,
  limit: number = 50,
  beforeMessageId?: string
): Promise<Message[]> {
  let query = supabase
    .from('messages')
    .select(`
      *,
      sender:user_profiles!sender_id(
        id,
        display_name,
        full_name,
        avatar_url
      ),
      read_receipts:message_read_receipts(*),
      reactions:message_reactions(*)
    `)
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (beforeMessageId) {
    // Get messages before a specific message (pagination)
    const { data: beforeMsg } = await supabase
      .from('messages')
      .select('created_at')
      .eq('id', beforeMessageId)
      .single();

    if (beforeMsg) {
      query = query.lt('created_at', beforeMsg.created_at);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  return (data || []).map(mapDbToMessage).reverse();
}

// Send message
export async function sendMessage(data: {
  conversationId: string;
  senderId: string;
  messageText?: string;
  messageType?: 'text' | 'image' | 'location' | 'dive_log' | 'contact';
  mediaUrl?: string;
  metadata?: any;
  replyToMessageId?: string;
}): Promise<Message> {
  const message = {
    conversation_id: data.conversationId,
    sender_id: data.senderId,
    message_text: data.messageText,
    message_type: data.messageType || 'text',
    media_url: data.mediaUrl,
    metadata: data.metadata,
    reply_to_message_id: data.replyToMessageId,
  };

  const { data: result, error } = await supabase
    .from('messages')
    .insert(message)
    .select(`
      *,
      sender:user_profiles!sender_id(
        id,
        display_name,
        full_name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }

  return mapDbToMessage(result);
}

// Mark messages as read
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.rpc('mark_messages_read', {
    p_conversation_id: conversationId,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to mark messages as read: ${error.message}`);
  }
}

// Delete message (soft delete)
export async function deleteMessage(messageId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('sender_id', userId);

  if (error) {
    throw new Error(`Failed to delete message: ${error.message}`);
  }
}

// Add reaction to message
export async function addReaction(
  messageId: string,
  userId: string,
  reaction: string
): Promise<void> {
  const { error } = await supabase
    .from('message_reactions')
    .upsert({
      message_id: messageId,
      user_id: userId,
      reaction,
    });

  if (error) {
    throw new Error(`Failed to add reaction: ${error.message}`);
  }
}

// Remove reaction from message
export async function removeReaction(
  messageId: string,
  userId: string,
  reaction: string
): Promise<void> {
  const { error } = await supabase
    .from('message_reactions')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('reaction', reaction);

  if (error) {
    throw new Error(`Failed to remove reaction: ${error.message}`);
  }
}

// Update typing indicator
export async function updateTypingIndicator(
  conversationId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  if (isTyping) {
    const { error } = await supabase
      .from('typing_indicators')
      .upsert({
        conversation_id: conversationId,
        user_id: userId,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to update typing indicator:', error);
    }
  } else {
    const { error } = await supabase
      .from('typing_indicators')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to remove typing indicator:', error);
    }
  }
}

// Get typing users
export async function getTypingUsers(conversationId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('typing_indicators')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .gt('updated_at', new Date(Date.now() - 10000).toISOString()); // 10 seconds

  if (error) {
    console.error('Failed to get typing users:', error);
    return [];
  }

  return (data || []).map((row) => row.user_id);
}

// Contact Requests

// Send contact request
export async function sendContactRequest(data: {
  fromUserId: string;
  toUserId: string;
  message?: string;
  context?: string;
  metadata?: any;
}): Promise<ContactRequest> {
  const request = {
    from_user_id: data.fromUserId,
    to_user_id: data.toUserId,
    message: data.message,
    context: data.context,
    metadata: data.metadata,
    status: 'pending',
  };

  const { data: result, error } = await supabase
    .from('contact_requests_v2')
    .insert(request)
    .select(`
      *,
      from_user:user_profiles!from_user_id(
        id,
        display_name,
        full_name,
        avatar_url
      ),
      to_user:user_profiles!to_user_id(
        id,
        display_name,
        full_name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    throw new Error(`Failed to send contact request: ${error.message}`);
  }

  return mapDbToContactRequest(result);
}

// Accept contact request
export async function acceptContactRequest(
  requestId: string,
  userId: string
): Promise<{ conversationId: string }> {
  // Update request status
  const { data: request, error: updateError } = await supabase
    .from('contact_requests_v2')
    .update({
      status: 'accepted',
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('to_user_id', userId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to accept contact request: ${updateError.message}`);
  }

  // Create conversation
  const conversationId = await createDirectConversation(
    request.from_user_id,
    request.to_user_id
  );

  return { conversationId };
}

// Decline contact request
export async function declineContactRequest(
  requestId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('contact_requests_v2')
    .update({
      status: 'declined',
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('to_user_id', userId);

  if (error) {
    throw new Error(`Failed to decline contact request: ${error.message}`);
  }
}

// Get received contact requests
export async function getReceivedContactRequests(userId: string): Promise<ContactRequest[]> {
  const { data, error } = await supabase
    .from('contact_requests_v2')
    .select(`
      *,
      from_user:user_profiles!from_user_id(
        id,
        display_name,
        full_name,
        avatar_url
      )
    `)
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch contact requests: ${error.message}`);
  }

  return (data || []).map(mapDbToContactRequest);
}

// Get sent contact requests
export async function getSentContactRequests(userId: string): Promise<ContactRequest[]> {
  const { data, error } = await supabase
    .from('contact_requests_v2')
    .select(`
      *,
      to_user:user_profiles!to_user_id(
        id,
        display_name,
        full_name,
        avatar_url
      )
    `)
    .eq('from_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch sent contact requests: ${error.message}`);
  }

  return (data || []).map(mapDbToContactRequest);
}

// Real-time subscriptions

// Subscribe to conversation messages
export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: Message) => void,
  onUpdate: (message: Message) => void,
  onDelete: (messageId: string) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        // Fetch full message with relations
        const { data } = await supabase
          .from('messages')
          .select(`
            *,
            sender:user_profiles!sender_id(
              id,
              display_name,
              full_name,
              avatar_url
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          onMessage(mapDbToMessage(data));
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        if (payload.new.is_deleted) {
          onDelete(payload.new.id);
        } else {
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:user_profiles!sender_id(
                id,
                display_name,
                full_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            onUpdate(mapDbToMessage(data));
          }
        }
      }
    )
    .subscribe();

  return channel;
}

// Subscribe to typing indicators
export function subscribeToTypingIndicators(
  conversationId: string,
  onTypingUpdate: (userIds: string[]) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`typing:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async () => {
        const userIds = await getTypingUsers(conversationId);
        onTypingUpdate(userIds);
      }
    )
    .subscribe();

  return channel;
}

// Subscribe to contact requests
export function subscribeToContactRequests(
  userId: string,
  onRequest: (request: ContactRequest) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`contact_requests:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'contact_requests_v2',
        filter: `to_user_id=eq.${userId}`,
      },
      async (payload) => {
        const { data } = await supabase
          .from('contact_requests_v2')
          .select(`
            *,
            from_user:user_profiles!from_user_id(
              id,
              display_name,
              full_name,
              avatar_url
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          onRequest(mapDbToContactRequest(data));
        }
      }
    )
    .subscribe();

  return channel;
}

// Subscribe to conversation list updates
export function subscribeToConversations(
  userId: string,
  onUpdate: () => void
): RealtimeChannel {
  const channel = supabase
    .channel(`conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversation_participants',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        onUpdate();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return channel;
}

// Helper functions

function mapDbToMessage(data: any): Message {
  return {
    id: data.id,
    conversationId: data.conversation_id,
    senderId: data.sender_id,
    messageText: data.message_text,
    messageType: data.message_type,
    mediaUrl: data.media_url,
    metadata: data.metadata,
    replyToMessageId: data.reply_to_message_id,
    isDeleted: data.is_deleted,
    deletedAt: data.deleted_at ? new Date(data.deleted_at).getTime() : undefined,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
    sender: data.sender,
    readReceipts: data.read_receipts?.map((r: any) => ({
      id: r.id,
      messageId: r.message_id,
      userId: r.user_id,
      readAt: new Date(r.read_at).getTime(),
    })),
    reactions: data.reactions?.map((r: any) => ({
      id: r.id,
      messageId: r.message_id,
      userId: r.user_id,
      reaction: r.reaction,
      createdAt: new Date(r.created_at).getTime(),
    })),
  };
}

function mapDbToContactRequest(data: any): ContactRequest {
  return {
    id: data.id,
    fromUserId: data.from_user_id,
    toUserId: data.to_user_id,
    status: data.status,
    message: data.message,
    context: data.context,
    metadata: data.metadata,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
    expiresAt: new Date(data.expires_at).getTime(),
    respondedAt: data.responded_at ? new Date(data.responded_at).getTime() : undefined,
    fromUser: data.from_user,
    toUser: data.to_user,
  };
}
