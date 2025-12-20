import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { colors } from '../../../constants/theme';
import { useRouter } from 'expo-router';
import { Plus, MapPin, Clock, Gauge } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { getAllDivePlans } from '../../../services/divePlans';
import { DivePlan } from '../../../packages/core/types';
import { format } from 'date-fns';

export default function PlansScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<DivePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

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
              <Pressable
                key={plan.id}
                style={({ pressed }) => [
                  styles.planCard,
                  pressed && styles.planCardPressed
                ]}
                onPress={() => {}}
              >
                <Text style={styles.planName}>{plan.name}</Text>
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
    padding: 16,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  planCardPressed: {
    opacity: 0.7,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
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
