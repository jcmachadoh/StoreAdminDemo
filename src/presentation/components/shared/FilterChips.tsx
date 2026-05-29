import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

interface Chip {
  id: string;
  label: string;
}

interface FilterChipsProps {
  chips: Chip[];
  selectedId: string;
  onSelect: (id: string) => void;
  allLabel?: string;
}

export const FilterChips = ({ chips, selectedId, onSelect, allLabel = 'Todas' }: FilterChipsProps) => {
  const { colors, radii } = useAppTheme();

  const renderChip = (id: string, label: string) => {
    const isActive = selectedId === id;
    return (
      <TouchableOpacity
        key={id}
        style={[
          styles.chip,
          {
            backgroundColor: isActive ? colors.primary : colors.surfaceInset,
            borderColor: isActive ? colors.primary : colors.border,
            borderRadius: radii.xl,
          },
        ]}
        onPress={() => onSelect(id)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: isActive }}
      >
        <Text
          style={[
            styles.chipText,
            { color: isActive ? '#ffffff' : colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {renderChip('', allLabel)}
      {chips.map(c => renderChip(c.id, c.label))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingVertical: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
});
