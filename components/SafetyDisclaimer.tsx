import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { SAFETY_DISCLAIMER } from '../packages/core/constants';

type SafetyDisclaimerProps = {
  variant?: 'banner' | 'card' | 'inline';
  style?: object;
};

export default function SafetyDisclaimer({
  variant = 'banner',
  style,
}: SafetyDisclaimerProps) {
  const containerStyle = [
    styles.container,
    variant === 'banner' && styles.banner,
    variant === 'card' && styles.card,
    variant === 'inline' && styles.inline,
    style,
  ];

  return (
    <View style={containerStyle}>
      <AlertTriangle
        size={variant === 'inline' ? 16 : 20}
        color={colors.warning}
        style={styles.icon}
      />
      <Text
        style={[
          styles.text,
          variant === 'inline' && styles.textSmall,
        ]}
      >
        {SAFETY_DISCLAIMER}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  banner: {
    backgroundColor: '#FFF3E0',
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  card: {
    backgroundColor: '#FFF3E0',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  inline: {
    paddingVertical: spacing.sm,
  },
  icon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  text: {
    ...typography.bodySmall,
    color: colors.text.primary,
    flex: 1,
  },
  textSmall: {
    ...typography.caption,
  },
});
