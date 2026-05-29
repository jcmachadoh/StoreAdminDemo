import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  mensaje?: string;
}

export const FullScreenLoader = ({ mensaje = 'Cargando...' }: Props) => {
  const { colors, radii, shadows } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: `${colors.background}D9` }]}>
      <View
        style={[
          styles.box,
          {
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            ...shadows.md,
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.text, { color: colors.text }]}>{mensaje}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  box: {
    padding: 25,
    alignItems: 'center',
    minWidth: 200,
  },
  text: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
