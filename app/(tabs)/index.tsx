import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors } from '../../constants/theme';
import { useRouter } from 'expo-router';
import { Plus, Users, BookOpen, MapPin } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();

  const quickActions = [
    {
      title: 'Create Dive Plan',
      icon: Plus,
      color: colors.primary,
      onPress: () => router.push('/plans/new')
    },
    {
      title: 'Find Buddy',
      icon: Users,
      color: '#10B981',
      onPress: () => router.push('/buddy')
    },
    {
      title: 'Log Dive',
      icon: BookOpen,
      color: '#F59E0B',
      onPress: () => router.push('/log')
    },
    {
      title: 'Dive Sites',
      icon: MapPin,
      color: '#8B5CF6',
      onPress: () => {}
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ScuPlan</Text>
        <Text style={styles.subtitle}>Your diving companion</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.actionCard,
                  { backgroundColor: action.color },
                  pressed && styles.actionCardPressed
                ]}
                onPress={action.onPress}
              >
                <Icon size={32} color="#FFFFFF" />
                <Text style={styles.actionText}>{action.title}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Getting Started</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Welcome to ScuPlan!</Text>
          <Text style={styles.infoText}>
            Plan your dives, find dive buddies, connect with instructors, and keep track of your diving history.
          </Text>
          <Text style={[styles.infoText, { marginTop: 12 }]}>
            • Create detailed dive plans with gas mixes{'\n'}
            • Find nearby dive buddies and instructors{'\n'}
            • Log and track all your dives{'\n'}
            • Share plans with your dive team
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  actionCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
