import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Icon } from './Icon';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  backColor?: 'primary' | 'danger';
  rightAction?: React.ReactNode;
}

export const Header = ({ title, onBack, backLabel = 'Volver', backColor = 'primary', rightAction }: HeaderProps) => {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          accessibilityLabel={backLabel}
          accessibilityRole="button"
        >
          <Icon name="arrow-left" size={16} color={backColor === 'danger' ? colors.danger : colors.primary} />
          <Text
            style={[
              styles.backText,
              { color: backColor === 'danger' ? colors.danger : colors.primary },
            ]}
          >
            {' '}{backLabel}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.backPlaceholder} />
      )}

      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>

      {rightAction ? (
        <View style={styles.rightAction}>{rightAction}</View>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, minWidth: 70, flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 16, fontWeight: '600' },
  backPlaceholder: { width: 70 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center', flex: 1 },
  rightAction: { minWidth: 70, alignItems: 'flex-end' },
});
