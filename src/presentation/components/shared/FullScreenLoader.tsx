import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface Props {
  mensaje?: string;
}

export const FullScreenLoader = ({ mensaje = 'Cargando...' }: Props) => {
  return (
    <View style={styles.container}>
      <View style={styles.box}>
        {/* Las flechas dando vueltas estándar nativas */}
        <ActivityIndicator size="large" color="#0366d6" />
        <Text style={styles.text}>{mensaje}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill, // Ocupa toda la pantalla por encima de todo
    backgroundColor: 'rgba(244, 246, 248, 0.85)', // Fondo semi-transparente
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // Nos aseguramos de que esté por encima
  },
  box: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    minWidth: 200,
  },
  text: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  }
});