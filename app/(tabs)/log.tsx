import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/theme';
import { Plus, MapPin, Gauge, Clock, Droplet } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getUserDiveHistory, getDiveStatistics } from '../../services/diveHistory';
import { DiveHistoryEntry } from '../../packages/core/types';
import { format } from 'date-fns';

const MOCK_USER_ID = 'demo-user';

export default function LogScreen() {
  const router = useRouter();
  const [dives, setDives] = useState<DiveHistoryEntry[]>([]);
  const [stats, setStats] = useState({
    totalDives: 0,
    totalTimeMinutes: 0,
    maxDepthMeters: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDives();
  }, []);

  const loadDives = async () => {
    try {
      const fetchedDives = await getUserDiveHistory(MOCK_USER_ID);
      const fetchedStats = await getDiveStatistics(MOCK_USER_ID);
      setDives(fetchedDives);
      setStats(fetchedStats);
    } catch (error) {
      console.error('Failed to load dives:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dive Log</Text>
          <Text style={styles.subtitle}>{stats.totalDives} dive(s)</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed
          ]}
          onPress={() => router.push('/dive-log-entry')}
        >
          <Plus size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {stats.totalDives > 0 && (
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalDives}</Text>
            <Text style={styles.statLabel}>Total Dives</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(stats.totalTimeMinutes / 60)}h</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.maxDepthMeters}m</Text>
            <Text style={styles.statLabel}>Max Depth</Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.content}>
        {dives.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No dives logged yet</Text>
            <Text style={styles.emptyText}>
              Start logging your dives to track your underwater adventures
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.emptyButton,
                pressed && styles.emptyButtonPressed
              ]}
              onPress={() => router.push('/dive-log-entry')}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Log First Dive</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.divesList}>
            {dives.map((dive) => (
              <Pressable
                key={dive.id}
                style={({ pressed }) => [
                  styles.diveCard,
                  pressed && styles.diveCardPressed
                ]}
                onPress={() => {}}
              >
                <View style={styles.diveHeader}>
                  <View>
                    <Text style={styles.diveNumber}>Dive #{dive.diveNumber}</Text>
                    {dive.diveSiteName && (
                      <Text style={styles.diveSite}>{dive.diveSiteName}</Text>
                    )}
                  </View>
                  <Text style={styles.diveDate}>
                    {format(new Date(dive.diveDate), 'MMM d, yyyy')}
                  </Text>
                </View>

                {dive.diveSiteCity && dive.diveSiteCountry && (
                  <View style={styles.diveDetail}>
                    <MapPin size={16} color={colors.text.secondary} />
                    <Text style={styles.diveDetailText}>
                      {dive.diveSiteCity}, {dive.diveSiteCountry}
                    </Text>
                  </View>
                )}

                <View style={styles.diveStats}>
                  <View style={styles.diveDetail}>
                    <Gauge size={16} color={colors.text.secondary} />
                    <Text style={styles.diveDetailText}>
                      {dive.maxDepthMeters}m
                    </Text>
                  </View>
                  <View style={styles.diveDetail}>
                    <Clock size={16} color={colors.text.secondary} />
                    <Text style={styles.diveDetailText}>
                      {dive.durationMinutes} min
                    </Text>
                  </View>
                  {dive.waterTemperatureCelsius && (
                    <View style={styles.diveDetail}>
                      <Droplet size={16} color={colors.text.secondary} />
                      <Text style={styles.diveDetailText}>
                        {dive.waterTemperatureCelsius}°C
                      </Text>
                    </View>
                  )}
                </View>

                {dive.notes && (
                  <Text style={styles.diveNotes} numberOfLines={2}>
                    {dive.notes}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  statsSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonPressed: {
    opacity: 0.8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divesList: {
    padding: 16,
    gap: 12,
  },
  diveCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  diveCardPressed: {
    opacity: 0.7,
  },
  diveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  diveNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  diveSite: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 2,
  },
  diveDate: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  diveDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  diveDetailText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  diveStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  diveNotes: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
