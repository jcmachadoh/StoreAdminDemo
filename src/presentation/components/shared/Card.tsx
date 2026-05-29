import React from 'react';
import { View, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  onPress?: () => void;
}

export const Card = ({ children, style, elevated = true }: CardProps) => {
  const { colors, radii, shadows } = useAppTheme();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderRadius: radii.md,
          borderColor: colors.borderLight,
          ...(elevated ? shadows.md : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});
