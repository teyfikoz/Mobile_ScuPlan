import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';

export default function BuddyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buddy Finder</Text>
      <Text style={styles.placeholder}>Buddy finder coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  placeholder: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
