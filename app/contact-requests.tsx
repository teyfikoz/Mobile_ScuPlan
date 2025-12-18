import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, UserPlus, Check, X, Clock } from 'lucide-react-native';
import { colors, spacing, typography } from '../constants/theme';
import {
  getReceivedContactRequests,
  getSentContactRequests,
  acceptContactRequest,
  declineContactRequest,
  ContactRequest,
} from '../services/messaging';
import { getCurrentUserProfile } from '../services/auth';
import { formatDistanceToNow } from 'date-fns';

export default function ContactRequestsScreen() {
  const router = useRouter();
  const [receivedRequests, setReceivedRequests] = useState<ContactRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ContactRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const profile = await getCurrentUserProfile();
      if (!profile) {
        setLoading(false);
        return;
      }

      setCurrentUserId(profile.id);
      await loadRequests(profile.id);
    } catch (error) {
      console.error('Failed to load contact requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async (userId?: string) => {
    const id = userId || currentUserId;
    if (!id) return;

    try {
      const [received, sent] = await Promise.all([
        getReceivedContactRequests(id),
        getSentContactRequests(id),
      ]);

      setReceivedRequests(received);
      setSentRequests(sent);
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleAccept = async (requestId: string) => {
    setProcessingId(requestId);

    try {
      const { conversationId } = await acceptContactRequest(requestId, currentUserId);

      Alert.alert(
        'Request Accepted',
        'You can now message this user!',
        [
          {
            text: 'Start Chatting',
            onPress: () => router.push(`/chat/${conversationId}`),
          },
          {
            text: 'Later',
            style: 'cancel',
          },
        ]
      );

      await loadRequests();
    } catch (error) {
      console.error('Failed to accept request:', error);
      Alert.alert('Error', 'Failed to accept contact request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this contact request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(requestId);

            try {
              await declineContactRequest(requestId, currentUserId);
              await loadRequests();
            } catch (error) {
              console.error('Failed to decline request:', error);
              Alert.alert('Error', 'Failed to decline contact request');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const renderReceivedRequest = ({ item }: { item: ContactRequest }) => {
    const isProcessing = processingId === item.id;

    return (
      <View style={styles.requestItem}>
        <View style={styles.requestHeader}>
          <View style={styles.avatarContainer}>
            <UserPlus size={24} color={colors.primary} />
          </View>

          <View style={styles.requestInfo}>
            <Text style={styles.requestName}>
              {item.fromUser?.displayName || item.fromUser?.fullName || 'Unknown User'}
            </Text>
            <Text style={styles.requestTime}>
              {formatDistanceToNow(item.createdAt, { addSuffix: true })}
            </Text>
          </View>
        </View>

        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}

        {item.context && (
          <View style={styles.contextBadge}>
            <Text style={styles.contextText}>
              {item.context === 'buddy_finder' && 'From Buddy Finder'}
              {item.context === 'nearby' && 'Nearby Diver'}
              {!['buddy_finder', 'nearby'].includes(item.context) && item.context}
            </Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAccept(item.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Check size={20} color={colors.white} />
                <Text style={styles.acceptButtonText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleDecline(item.id)}
            disabled={isProcessing}
          >
            <X size={20} color={colors.error} />
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSentRequest = ({ item }: { item: ContactRequest }) => {
    const getStatusColor = () => {
      switch (item.status) {
        case 'accepted':
          return colors.success;
        case 'declined':
          return colors.error;
        case 'expired':
          return colors.text.secondary;
        default:
          return colors.warning;
      }
    };

    const getStatusText = () => {
      switch (item.status) {
        case 'accepted':
          return 'Accepted';
        case 'declined':
          return 'Declined';
        case 'expired':
          return 'Expired';
        default:
          return 'Pending';
      }
    };

    return (
      <View style={styles.requestItem}>
        <View style={styles.requestHeader}>
          <View style={styles.avatarContainer}>
            <UserPlus size={24} color={colors.primary} />
          </View>

          <View style={styles.requestInfo}>
            <Text style={styles.requestName}>
              {item.toUser?.displayName || item.toUser?.fullName || 'Unknown User'}
            </Text>
            <Text style={styles.requestTime}>
              {formatDistanceToNow(item.createdAt, { addSuffix: true })}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>

        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}

        {item.status === 'pending' && (
          <View style={styles.expiresInfo}>
            <Clock size={14} color={colors.text.secondary} />
            <Text style={styles.expiresText}>
              Expires {formatDistanceToNow(item.expiresAt, { addSuffix: true })}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      </View>
    );
  }

  const currentRequests = activeTab === 'received' ? receivedRequests : sentRequests;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>

        <Text style={styles.title}>Contact Requests</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.activeTab]}
          onPress={() => setActiveTab('received')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'received' && styles.activeTabText,
            ]}
          >
            Received ({receivedRequests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => setActiveTab('sent')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'sent' && styles.activeTabText,
            ]}
          >
            Sent ({sentRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={currentRequests}
        renderItem={activeTab === 'received' ? renderReceivedRequest : renderSentRequest}
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
            <UserPlus size={64} color={colors.divider} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'received'
                ? 'No received requests'
                : 'No sent requests'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'received'
                ? 'Contact requests from other divers will appear here'
                : 'Your sent contact requests will appear here'}
            </Text>
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
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
    padding: spacing.md,
  },
  requestItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  requestTime: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
  },
  statusText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  messageContainer: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  messageText: {
    ...typography.body,
    color: colors.text.primary,
  },
  contextBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  contextText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: colors.primary,
  },
  acceptButtonText: {
    ...typography.button,
    color: colors.white,
  },
  declineButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.error,
  },
  declineButtonText: {
    ...typography.button,
    color: colors.error,
  },
  expiresInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  expiresText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxl * 2,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
