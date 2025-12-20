import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { MessageCircle, Users, Bell } from 'lucide-react-native';
import { colors, spacing, typography } from '../../constants/theme';
import {
  getUserConversations,
  getReceivedContactRequests,
  subscribeToConversations,
  subscribeToContactRequests,
  Conversation,
  ContactRequest,
} from '../../services/messaging';
import { getCurrentUserProfile } from '../../services/auth';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    // Subscribe to conversation updates
    const convChannel = subscribeToConversations(currentUserId, () => {
      loadConversations();
    });

    // Subscribe to new contact requests
    const requestChannel = subscribeToContactRequests(currentUserId, (request) => {
      setContactRequests((prev) => [request, ...prev]);
    });

    return () => {
      convChannel.unsubscribe();
      requestChannel.unsubscribe();
    };
  }, [currentUserId]);

  const loadData = async () => {
    try {
      const profile = await getCurrentUserProfile();
      if (!profile) {
        setLoading(false);
        return;
      }

      setCurrentUserId(profile.id);
      await Promise.all([loadConversations(), loadContactRequests()]);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    if (!currentUserId) return;

    try {
      const convs = await getUserConversations(currentUserId);
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadContactRequests = async () => {
    if (!currentUserId) return;

    try {
      const requests = await getReceivedContactRequests(currentUserId);
      setContactRequests(requests.filter((r) => r.status === 'pending'));
    } catch (error) {
      console.error('Failed to load contact requests:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getOtherParticipant = (conv: Conversation) => {
    const other = conv.participants.find((p) => p.userId !== currentUserId);
    return other?.user;
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.type === 'group') {
      return conv.name || 'Group Chat';
    }

    const other = getOtherParticipant(conv);
    return other?.displayName || other?.fullName || 'Unknown User';
  };

  const getTotalUnreadCount = () => {
    const convUnread = conversations.reduce((sum, conv) => {
      const participant = conv.participants.find((p) => p.userId === currentUserId);
      return sum + (participant?.unreadCount || 0);
    }, 0);

    return convUnread + contactRequests.length;
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const participant = item.participants.find((p) => p.userId === currentUserId);
    const unreadCount = participant?.unreadCount || 0;
    const otherUser = getOtherParticipant(item);

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        <View style={styles.avatarContainer}>
          {item.type === 'group' ? (
            <Users size={24} color={colors.primary} />
          ) : (
            <MessageCircle size={24} color={colors.primary} />
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName} numberOfLines={1}>
              {getConversationName(item)}
            </Text>
            {item.lastMessageAt && (
              <Text style={styles.timestamp}>
                {formatDistanceToNow(item.lastMessageAt, { addSuffix: true })}
              </Text>
            )}
          </View>

          <View style={styles.conversationFooter}>
            <Text
              style={[
                styles.lastMessage,
                unreadCount > 0 && styles.lastMessageUnread,
              ]}
              numberOfLines={1}
            >
              {item.lastMessageText || 'No messages yet'}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </View>
    );
  }

  const totalUnread = getTotalUnreadCount();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Messages</Text>
          {totalUnread > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>

        {contactRequests.length > 0 && (
          <TouchableOpacity
            style={styles.requestsButton}
            onPress={() => router.push('/contact-requests')}
          >
            <Bell size={20} color={colors.primary} />
            <View style={styles.requestsBadge}>
              <Text style={styles.requestsBadgeText}>
                {contactRequests.length}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {contactRequests.length > 0 && (
        <TouchableOpacity
          style={styles.requestsBanner}
          onPress={() => router.push('/contact-requests')}
        >
          <Bell size={20} color={colors.primary} />
          <Text style={styles.requestsBannerText}>
            {contactRequests.length} pending contact request
            {contactRequests.length > 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MessageCircle size={64} color={colors.divider} />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>
              Find buddies and start chatting!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)/buddy')}
            >
              <Text style={styles.emptyButtonText}>Find Buddies</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
  },
  headerBadge: {
    backgroundColor: colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  headerBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  requestsButton: {
    position: 'relative',
    padding: spacing.sm,
  },
  requestsBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestsBadgeText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '700',
  },
  requestsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  requestsBannerText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 70,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.background,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conversationName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  timestamp: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  lastMessageUnread: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  unreadCount: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xxl * 2,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  emptyButtonText: {
    ...typography.button,
    color: colors.white,
  },
});
