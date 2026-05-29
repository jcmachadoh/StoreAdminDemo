import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

interface SearchBarProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar = ({ value, onChangeText, placeholder = 'Buscar...', ...rest }: SearchBarProps) => {
  const { colors, radii } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
      <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceInset, borderRadius: radii.sm }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          accessibilityLabel={placeholder}
          {...rest}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  inputWrapper: {
    paddingHorizontal: 12,
  },
  input: {
    fontSize: 15,
    paddingVertical: 10,
  },
});
