import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Icon } from './Icon';

interface FABProps {
  onPress: () => void;
  icon?: string;
  accessibilityLabel?: string;
}

export const FAB = ({ onPress, icon = 'plus', accessibilityLabel }: FABProps) => {
  const { colors, shadows } = useAppTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.fab,
        {
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          ...shadows.fab,
        },
      ]}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || 'Agregar'}
    >
      <Icon name={icon} size={28} color="#fff" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
