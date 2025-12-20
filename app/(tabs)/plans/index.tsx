import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, MapPin, Clock, Trash2 } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../../constants/theme';
import Button from '../../../components/Button';
import { useEffect, useState } from 'react';
import { DivePlan } from '../../../packages/core/types';
import { getAllDivePlans, deleteDivePlan } from '../../../services/divePlans';
import { formatDistance } from '../../../packages/core/calculators';

export default function PlansScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<DivePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const allPlans = await getAllDivePlans();
      setPlans(allPlans);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPlans();
  };

  const handleCreatePlan = () => {
    router.push('/plans/new' as any);
  };

  const handlePlanPress = (plan: DivePlan) => {
    router.push(`/plans/${plan.id}` as any);
  };

  const handleDeletePlan = async (plan: DivePlan) => {
    Alert.alert(
      'Delete Plan',
      `Are you sure you want to delete "${plan.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDivePlan(plan.id);
              loadPlans();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete plan');
            }
          },
        },
      ]
    );
  };

  const renderPlan = ({ item }: { item: DivePlan }) => (
    <TouchableOpacity
      style={styles.planCard}
      onPress={() => handlePlanPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.planHeader}>
        <Text style={styles.planName} numberOfLines={1}>
          {item.name}
        </Text>
        <TouchableOpacity
          onPress={() => handleDeletePlan(item)}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Trash2 size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.planDetails}>
        <View style={styles.planDetail}>
          <MapPin size={16} color={colors.text.secondary} />
          <Text style={styles.planDetailText}>
            Max Depth: {item.maxDepth}m
          </Text>
        </View>
        <View style={styles.planDetail}>
          <Clock size={16} color={colors.text.secondary} />
          <Text style={styles.planDetailText}>
            Runtime: {item.plannedRuntimeMin} min
          </Text>
        </View>
      </View>

      {item.location?.name && (
        <Text style={styles.planLocation} numberOfLines={1}>
          {item.location.name}
        </Text>
      )}

      <View style={styles.gasesContainer}>
        {item.gases.map((gas, index) => (
          <View key={index} style={styles.gasChip}>
            <Text style={styles.gasText}>{gas.name}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dive Plans</Text>
        <Button
          title="New Plan"
          onPress={handleCreatePlan}
          variant="primary"
          size="small"
        />
      </View>

      {plans.length === 0 ? (
        <View style={styles.emptyState}>
          <Plus size={64} color={colors.text.secondary} />
          <Text style={styles.emptyTitle}>No Dive Plans Yet</Text>
          <Text style={styles.emptyText}>
            Create your first dive plan to get started
          </Text>
          <Button
            title="Create Plan"
            onPress={handleCreatePlan}
            variant="primary"
            size="medium"
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <FlatList
          data={plans}
          renderItem={renderPlan}
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
  title: {
    ...typography.h2,
    color: colors.primary,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 70,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  planName: {
    ...typography.h3,
    flex: 1,
    marginRight: spacing.sm,
  },
  planDetails: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  planDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  planDetailText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  planLocation: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  gasesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  gasChip: {
    backgroundColor: colors.underwater.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.underwater.cyan,
  },
  gasText: {
    ...typography.caption,
    color: colors.underwater.darkBlue,
    fontWeight: '600',
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
    marginBottom: spacing.xl,
  },
  emptyButton: {
    minWidth: 200,
  },
});
