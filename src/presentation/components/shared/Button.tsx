import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

type ButtonVariant = 'primary' | 'success' | 'danger' | 'ghost' | 'outline';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
}: ButtonProps) => {
  const { colors, radii } = useAppTheme();

  const bgColor = {
    primary: colors.primary,
    success: colors.success,
    danger: colors.danger,
    ghost: 'transparent',
    outline: 'transparent',
  }[variant];

  const textColor = {
    primary: '#ffffff',
    success: '#ffffff',
    danger: '#ffffff',
    ghost: colors.primary,
    outline: colors.primary,
  }[variant];

  const borderStyle = variant === 'outline'
    ? { borderWidth: 1.5, borderColor: colors.primary }
    : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        styles.base,
        {
          backgroundColor: bgColor,
          borderRadius: radii.md,
          opacity: disabled ? 0.5 : 1,
        },
        borderStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
});
