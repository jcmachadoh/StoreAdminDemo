import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export const Icon = ({ name, size = 24, color, style }: IconProps) => {
  const { colors } = useAppTheme();
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color ?? colors.text}
      style={style}
    />
  );
};
