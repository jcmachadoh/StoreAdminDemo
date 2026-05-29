import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useUIStore } from '../../store/useUIStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Icon } from './Icon';

export const GlobalToast = () => {
  const {
    alertVisible,
    alertType,
    alertTitle,
    alertMessage,
    hideAlert,
  } = useUIStore();
  const { colors, radii, shadows } = useAppTheme();
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (alertVisible) {
      Animated.spring(translateY, {
        toValue: 50,
        useNativeDriver: true,
        speed: 12,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [alertVisible, translateY]);

  if (!alertVisible) return null;

  const colorMap = {
    success: {
      bg: colors.successLight,
      border: colors.successLight,
      text: colors.successText,
      iconName: 'check-circle' as const,
    },
    error: {
      bg: colors.dangerLight,
      border: colors.dangerLight,
      text: colors.dangerText,
      iconName: 'close-circle' as const,
    },
    warning: {
      bg: colors.warningLight,
      border: colors.warningLight,
      text: colors.warningText,
      iconName: 'alert' as const,
    },
    info: {
      bg: colors.infoLight,
      border: colors.infoLight,
      text: colors.infoText,
      iconName: 'information' as const,
    },
  };

  const activeColor = colorMap[alertType] || colorMap.info;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={hideAlert}
        style={[
          styles.toastBox,
          {
            backgroundColor: activeColor.bg,
            borderColor: activeColor.border,
            borderRadius: radii.md,
            ...shadows.md,
          },
        ]}
        accessibilityRole="alert"
        accessibilityLabel={`${activeColor.iconName}. ${alertTitle}. ${alertMessage || ''}`}
      >
        <Icon name={activeColor.iconName} size={24} color={activeColor.text} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: activeColor.text }]}>
            {alertTitle}
          </Text>
          {alertMessage ? (
            <Text style={[styles.message, { color: activeColor.text }]}>
              {alertMessage}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
  },
  toastBox: {
    flexDirection: 'row',
    width: '90%',
    padding: 15,
    borderWidth: 1,
    alignItems: 'center',
  },
  icon: { marginRight: 15 },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  message: { fontSize: 14, opacity: 0.9 },
});
