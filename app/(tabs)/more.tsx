import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';
import SafetyDisclaimer from '../../components/SafetyDisclaimer';

export default function MoreScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings & More</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About ScuPlan</Text>
          <Text style={styles.sectionText}>
            ScuPlan Mobile is a dive planning and tracking companion app designed
            for recreational and technical scuba divers.
          </Text>
        </View>

        <SafetyDisclaimer variant="card" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Version</Text>
          <Text style={styles.sectionText}>1.0.0 (MVP)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          <Text style={styles.sectionText}>
            All dive plans and sessions are stored locally on your device. Buddy
            finder data is temporary and automatically deleted after 24 hours.
          </Text>
        </View>
      </ScrollView>
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
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  sectionText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
});
