import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Clock, MapPin, Navigation, Plus } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { DiveSession } from '../../packages/core/types';
import { getAllDiveSessions } from '../../services/diveSessions';
import { formatDuration, formatDistance } from '../../packages/core/calculators';

export default function LogScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<DiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const allSessions = await getAllDiveSessions();
      const completedSessions = allSessions.filter((s) => s.status === 'completed');
      setSessions(completedSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  const renderSession = ({ item }: { item: DiveSession }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionDate}>
          {new Date(item.startedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
        <Text style={styles.sessionTime}>
          {new Date(item.startedAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {item.stats && (
        <View style={styles.sessionStats}>
          <View style={styles.sessionStat}>
            <Clock size={16} color={colors.text.secondary} />
            <Text style={styles.sessionStatText}>
              {formatDuration(item.stats.durationSec)}
            </Text>
          </View>

          {item.stats.maxDistanceFromEntryM > 0 && (
            <View style={styles.sessionStat}>
              <Navigation size={16} color={colors.text.secondary} />
              <Text style={styles.sessionStatText}>
                {formatDistance(item.stats.maxDistanceFromEntryM)}
              </Text>
            </View>
          )}

          <View style={styles.sessionStat}>
            <MapPin size={16} color={colors.text.secondary} />
            <Text style={styles.sessionStatText}>
              {item.pointsCount} points
            </Text>
          </View>
        </View>
      )}

      {item.notes && (
        <Text style={styles.sessionNotes} numberOfLines={2}>
          {item.notes}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading dive log...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dive Log</Text>
          <Text style={styles.subtitle}>{sessions.length} dives</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/dive-log-entry')}
        >
          <Plus size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Clock size={64} color={colors.text.secondary} />
          <Text style={styles.emptyTitle}>No Dive Sessions Yet</Text>
          <Text style={styles.emptyText}>
            Your completed dive sessions will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.primary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.md,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sessionDate: {
    ...typography.h3,
  },
  sessionTime: {
    ...typography.body,
    color: colors.text.secondary,
  },
  sessionStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  sessionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sessionStatText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  sessionNotes: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
