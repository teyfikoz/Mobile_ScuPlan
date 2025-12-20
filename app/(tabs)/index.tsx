import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Play, MapPin, Users as UsersIcon } from 'lucide-react-native';
import { colors, spacing, typography } from '../../constants/theme';
import SafetyDisclaimer from '../../components/SafetyDisclaimer';
import Button from '../../components/Button';
import { useEffect, useState } from 'react';
import { getActiveSessionId } from '../../lib/storage';

export default function HomeScreen() {
  const router = useRouter();
  const [hasActiveSession, setHasActiveSession] = useState(false);

  useEffect(() => {
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    const sessionId = await getActiveSessionId();
    setHasActiveSession(!!sessionId);
  };

  const handleStartDive = () => {
    router.push('/session');
  };

  const handleQuickPlan = () => {
    router.push('/plans/new');
  };

  const handleFindBuddy = () => {
    router.push('/buddy');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>ScuPlan</Text>
          <Text style={styles.subtitle}>Dive Planning & Safety</Text>
        </View>

        <SafetyDisclaimer variant="card" style={styles.disclaimer} />

        {hasActiveSession ? (
          <View style={styles.activeSessionCard}>
            <Text style={styles.activeSessionTitle}>Active Session</Text>
            <Text style={styles.activeSessionText}>
              You have a dive session in progress
            </Text>
            <Button
              title="Resume Session"
              onPress={handleStartDive}
              variant="primary"
              size="large"
              style={styles.resumeButton}
            />
          </View>
        ) : (
          <View style={styles.quickActions}>
            <Button
              title="Start Dive"
              onPress={handleStartDive}
              variant="primary"
              size="large"
              style={styles.startButton}
            />

            <View style={styles.actionRow}>
              <Button
                title="Quick Plan"
                onPress={handleQuickPlan}
                variant="secondary"
                size="medium"
                style={styles.actionButton}
              />
              <Button
                title="Find Buddy"
                onPress={handleFindBuddy}
                variant="outline"
                size="medium"
                style={styles.actionButton}
              />
            </View>
          </View>
        )}

        <View style={styles.features}>
          <FeatureCard
            icon={<Play size={32} color={colors.primary} />}
            title="Session Tracking"
            description="Track entry/exit points, GPS route, and dive duration"
          />
          <FeatureCard
            icon={<MapPin size={32} color={colors.primary} />}
            title="Navigation"
            description="Find your way back with compass bearing and distance"
          />
          <FeatureCard
            icon={<UsersIcon size={32} color={colors.primary} />}
            title="Buddy Finder"
            description="Connect with nearby divers before your dive"
          />
        </View>
      </ScrollView>
    </View>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIcon}>{icon}</View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  disclaimer: {
    marginBottom: spacing.xl,
  },
  quickActions: {
    marginBottom: spacing.xl,
  },
  startButton: {
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  activeSessionCard: {
    backgroundColor: colors.underwater.surface,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.underwater.cyan,
    marginBottom: spacing.xl,
  },
  activeSessionTitle: {
    ...typography.h3,
    color: colors.underwater.darkBlue,
    marginBottom: spacing.sm,
  },
  activeSessionText: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  resumeButton: {
    marginTop: spacing.sm,
  },
  features: {
    gap: spacing.md,
  },
  featureCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
  },
  featureIcon: {
    marginBottom: spacing.md,
  },
  featureTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  featureDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
