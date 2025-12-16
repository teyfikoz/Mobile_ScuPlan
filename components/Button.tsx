import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[`size_${size}` as keyof typeof styles] as ViewStyle,
    disabled ? styles.disabled : null,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}` as keyof typeof styles] as TextStyle,
    styles[`textSize_${size}` as keyof typeof styles] as TextStyle,
    disabled ? styles.textDisabled : null,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'outline' ? colors.primary : colors.text.inverse
          }
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...shadows.sm,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  danger: {
    backgroundColor: colors.error,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  disabled: {
    backgroundColor: colors.divider,
    opacity: 0.6,
  },
  size_small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  size_medium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  size_large: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  text: {
    ...typography.button,
    color: colors.text.inverse,
  },
  text_primary: {
    color: colors.text.inverse,
  },
  text_secondary: {
    color: colors.text.inverse,
  },
  text_danger: {
    color: colors.text.inverse,
  },
  text_outline: {
    color: colors.primary,
  },
  textDisabled: {
    color: colors.text.secondary,
  },
  textSize_small: {
    fontSize: 14,
  },
  textSize_medium: {
    fontSize: 16,
  },
  textSize_large: {
    fontSize: 18,
  },
});
