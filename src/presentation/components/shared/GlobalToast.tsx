import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useUIStore } from '../../store/useUIStore';

export const GlobalToast = () => {
  const { alertVisible, alertType, alertTitle, alertMessage, hideAlert } = useUIStore();
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (alertVisible) {
      Animated.spring(translateY, { toValue: 50, useNativeDriver: true, speed: 12 }).start();
    } else {
      Animated.timing(translateY, { toValue: -150, duration: 300, useNativeDriver: true }).start();
    }
  }, [alertVisible, translateY]);

  if (!alertVisible) return null;

  // Colores dinámicos según el tipo
  const colors = {
    success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724', icon: '✅' },
    error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24', icon: '❌' },
    warning: { bg: '#fff3cd', border: '#ffeeba', text: '#856404', icon: '⚠️' },
    info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460', icon: 'ℹ️' },
  };

  const activeColor = colors[alertType];

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <TouchableOpacity 
        activeOpacity={0.8} 
        onPress={hideAlert}
        style={[styles.toastBox, { backgroundColor: activeColor.bg, borderColor: activeColor.border }]}
      >
        <Text style={styles.icon}>{activeColor.icon}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: activeColor.text }]}>{alertTitle}</Text>
          {alertMessage ? <Text style={[styles.message, { color: activeColor.text }]}>{alertMessage}</Text> : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', zIndex: 99999, elevation: 99999 },
  toastBox: { flexDirection: 'row', width: '90%', padding: 15, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, alignItems: 'center' },
  icon: { fontSize: 24, marginRight: 15 },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  message: { fontSize: 14, opacity: 0.9 },
});