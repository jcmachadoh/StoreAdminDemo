import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../hooks/useAppTheme';

interface ScreenLayoutProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const ScreenLayout = ({ children, style }: ScreenLayoutProps) => {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }, style]}>
      {children}
    </SafeAreaView>
  );
};
