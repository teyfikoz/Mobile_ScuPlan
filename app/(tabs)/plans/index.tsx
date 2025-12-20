import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Share, Alert } from 'react-native';
import { colors } from '../../../constants/theme';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, MapPin, Clock, Gauge, Share2 } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { getAllDivePlans, exportPlanToJSON, createDeepLink } from '../../../services/divePlans';
import { DivePlan } from '../../../packages/core/types';
import { format } from 'date-fns';

export default function PlansScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<DivePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [])
  );

  const loadPlans = async () => {
    try {
      const fetchedPlans = await getAllDivePlans();
      setPlans(fetchedPlans);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const sharePlan = async (plan: DivePlan) => {
    try {
      const deepLink = createDeepLink(plan);
      const planJSON = exportPlanToJSON(plan);

      const message = `Check out my dive plan: ${plan.name}\n\n` +
        `Max Depth: ${plan.maxDepth}m\n` +
        `Runtime: ${plan.plannedRuntimeMin} min\n` +
        `Location: ${plan.location?.name || 'Not specified'}\n\n` +
        `Link: ${deepLink}\n\n` +
        `JSON:\n${planJSON}`;

      await Share.share({
        message,
        title: `Dive Plan: ${plan.name}`,
      });
    } catch (error) {
      console.error('Failed to share plan:', error);
      Alert.alert('Error', 'Failed to share plan');
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
          <Text style={styles.title}>Dive Plans</Text>
          <Text style={styles.subtitle}>{plans.length} plan(s)</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed
          ]}
          onPress={() => router.push('/plans/new')}
        >
          <Plus size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        {plans.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No dive plans yet</Text>
            <Text style={styles.emptyText}>
              Create your first dive plan to get started
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.emptyButton,
                pressed && styles.emptyButtonPressed
              ]}
              onPress={() => router.push('/plans/new')}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Create Plan</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.plansList}>
            {plans.map((plan) => (
              <View key={plan.id} style={styles.planCard}>
                <Pressable
                  style={({ pressed }) => [
                    styles.planCardContent,
                    pressed && styles.planCardPressed
                  ]}
                  onPress={() => {}}
                >
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Pressable
                      style={({ pressed }) => [
                        styles.shareButton,
                        pressed && styles.shareButtonPressed
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        sharePlan(plan);
                      }}
                    >
                      <Share2 size={20} color={colors.primary} />
                    </Pressable>
                  </View>
                  {plan.location?.name && (
                    <View style={styles.planDetail}>
                      <MapPin size={16} color={colors.text.secondary} />
                      <Text style={styles.planDetailText}>{plan.location.name}</Text>
                    </View>
                  )}
                  <View style={styles.planStats}>
                    <View style={styles.planDetail}>
                      <Gauge size={16} color={colors.text.secondary} />
                      <Text style={styles.planDetailText}>
                        {plan.maxDepth}m max depth
                      </Text>
                    </View>
                    <View style={styles.planDetail}>
                      <Clock size={16} color={colors.text.secondary} />
                      <Text style={styles.planDetailText}>
                        {plan.plannedRuntimeMin} min
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.planDate}>
                    Created {format(new Date(plan.createdAt), 'MMM d, yyyy')}
                  </Text>
                </Pressable>
              </View>
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
  plansList: {
    padding: 16,
    gap: 12,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 12,
  },
  planCardContent: {
    padding: 16,
  },
  planCardPressed: {
    opacity: 0.7,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: 12,
  },
  shareButton: {
    padding: 4,
  },
  shareButtonPressed: {
    opacity: 0.5,
  },
  planDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  planDetailText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  planStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  planDate: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 8,
  },
});
