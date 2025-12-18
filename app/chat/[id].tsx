import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Image, MapPin, Smile } from 'lucide-react-native';
import { colors, spacing, typography } from '../../constants/theme';
import {
  getConversation,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  subscribeToMessages,
  subscribeToTypingIndicators,
  updateTypingIndicator,
  addReaction,
  Message,
  Conversation,
} from '../../services/messaging';
import { getCurrentUserProfile } from '../../services/auth';
import { formatDistanceToNow } from 'date-fns';

export default function ChatScreen() {
  const router = useRouter();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    // Subscribe to new messages
    const messageChannel = subscribeToMessages(
      conversationId,
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
        scrollToBottom();

        // Mark as read if not from current user
        if (newMessage.senderId !== currentUserId) {
          markMessagesAsRead(conversationId, currentUserId);
        }
      },
      (updatedMessage) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
        );
      },
      (messageId) => {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    );

    // Subscribe to typing indicators
    const typingChannel = subscribeToTypingIndicators(
      conversationId,
      (userIds) => {
        setTypingUserIds(userIds.filter((id) => id !== currentUserId));
      }
    );

    // Mark messages as read on mount
    markMessagesAsRead(conversationId, currentUserId);

    return () => {
      messageChannel.unsubscribe();
      typingChannel.unsubscribe();

      // Clear typing indicator on unmount
      updateTypingIndicator(conversationId, currentUserId, false);
    };
  }, [conversationId, currentUserId]);

  const loadData = async () => {
    try {
      const profile = await getCurrentUserProfile();
      if (!profile) {
        setLoading(false);
        return;
      }

      setCurrentUserId(profile.id);

      if (!conversationId) return;

      const [conv, msgs] = await Promise.all([
        getConversation(conversationId),
        getMessages(conversationId, 50),
      ]);

      if (!conv) {
        Alert.alert('Error', 'Conversation not found');
        router.back();
        return;
      }

      setConversation(conv);
      setMessages(msgs);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to load conversation:', error);
      Alert.alert('Error', 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationId || sending) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);

    // Clear typing indicator
    updateTypingIndicator(conversationId, currentUserId, false);

    try {
      await sendMessage({
        conversationId,
        senderId: currentUserId,
        messageText: textToSend,
        messageType: 'text',
      });

      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
      setMessageText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handleTextChange = (text: string) => {
    setMessageText(text);

    if (!conversationId) return;

    // Update typing indicator
    if (text.length > 0) {
      updateTypingIndicator(conversationId, currentUserId, true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingIndicator(conversationId, currentUserId, false);
      }, 3000);
    } else {
      updateTypingIndicator(conversationId, currentUserId, false);
    }
  };

  const getOtherParticipant = () => {
    if (!conversation) return null;
    const other = conversation.participants.find(
      (p) => p.userId !== currentUserId
    );
    return other?.user;
  };

  const getConversationName = () => {
    if (!conversation) return '';

    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }

    const other = getOtherParticipant();
    return other?.displayName || other?.fullName || 'Unknown User';
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderId === currentUserId;
    const showAvatar =
      index === 0 || messages[index - 1].senderId !== item.senderId;
    const showTimestamp =
      index === messages.length - 1 ||
      messages[index + 1].senderId !== item.senderId ||
      (messages[index + 1].createdAt - item.createdAt > 60000); // 1 minute

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isOwnMessage && showAvatar && (
          <View style={styles.avatarPlaceholder} />
        )}

        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
            !showAvatar && !isOwnMessage && styles.messageBubbleNoAvatar,
          ]}
        >
          {item.messageType === 'text' && (
            <Text
              style={[
                styles.messageText,
                isOwnMessage
                  ? styles.ownMessageText
                  : styles.otherMessageText,
              ]}
            >
              {item.messageText}
            </Text>
          )}

          {item.messageType === 'image' && (
            <View>
              <Image size={20} color={isOwnMessage ? colors.white : colors.text.primary} />
              <Text style={styles.mediaLabel}>Image</Text>
            </View>
          )}

          {item.messageType === 'location' && (
            <View>
              <MapPin size={20} color={isOwnMessage ? colors.white : colors.text.primary} />
              <Text style={styles.mediaLabel}>Location</Text>
            </View>
          )}

          {showTimestamp && (
            <Text
              style={[
                styles.messageTimestamp,
                isOwnMessage
                  ? styles.ownMessageTimestamp
                  : styles.otherMessageTimestamp,
              ]}
            >
              {formatDistanceToNow(item.createdAt, { addSuffix: true })}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{getConversationName()}</Text>
          {typingUserIds.length > 0 && (
            <Text style={styles.typingIndicator}>typing...</Text>
          )}
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={scrollToBottom}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Start the conversation!
            </Text>
          </View>
        }
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.iconButton}>
          <Image size={24} color={colors.text.secondary} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          placeholderTextColor={colors.text.secondary}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!messageText.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Send size={20} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  typingIndicator: {
    ...typography.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  messagesList: {
    padding: spacing.md,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.divider,
    marginRight: spacing.xs,
  },
  messageBubble: {
    padding: spacing.md,
    borderRadius: 16,
    maxWidth: '100%',
  },
  ownMessageBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageBubbleNoAvatar: {
    marginLeft: 40,
  },
  messageText: {
    ...typography.body,
  },
  ownMessageText: {
    color: colors.white,
  },
  otherMessageText: {
    color: colors.text.primary,
  },
  messageTimestamp: {
    ...typography.caption,
    marginTop: spacing.xs,
    fontSize: 11,
  },
  ownMessageTimestamp: {
    color: colors.white,
    opacity: 0.8,
  },
  otherMessageTimestamp: {
    color: colors.text.secondary,
  },
  mediaLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  iconButton: {
    padding: spacing.sm,
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  sendButtonDisabled: {
    backgroundColor: colors.divider,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxl * 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
