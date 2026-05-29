import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

const variantStyles = (colors: any, variant: BadgeVariant) => {
  const map = {
    success: { bg: colors.successLight, text: colors.successText, border: colors.successLight },
    danger: { bg: colors.dangerLight, text: colors.dangerText, border: colors.dangerLight },
    warning: { bg: colors.warningLight, text: colors.warningText, border: colors.warningLight },
    info: { bg: colors.primaryLight, text: colors.primary, border: colors.primaryLight },
    neutral: { bg: colors.surfaceInset, text: colors.textTertiary, border: colors.borderLight },
  };
  return map[variant];
};

export const Badge = ({ label, variant = 'neutral', style }: BadgeProps) => {
  const { colors, radii } = useAppTheme();
  const v = variantStyles(colors, variant);

  return (
    <View style={[styles.badge, { backgroundColor: v.bg, borderColor: v.border, borderRadius: radii.sm }, style]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '700' },
});
