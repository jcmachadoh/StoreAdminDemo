import React from 'react';
import { Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Card } from './Card';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const MetricCard = ({ title, value, subtitle, accentColor, style }: MetricCardProps) => {
  const { colors } = useAppTheme();
  const accent = accentColor || colors.primary;

  return (
    <Card style={[styles.card, { borderTopColor: accent, borderTopWidth: 3 }, style]} elevated={false}>
      <Text style={[styles.title, { color: colors.textTertiary }]}>{title}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { padding: 16 },
  title: { fontSize: 12, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 11, marginTop: 6 },
});
