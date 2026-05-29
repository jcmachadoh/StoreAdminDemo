import { ViewStyle } from 'react-native';

// ─── Spacing Scale (4px base) ───
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

// ─── Border Radius ───
export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

// ─── Typography Scale ───
export const typography = {
  caption: { fontSize: 11, fontWeight: '500' as const },
  label: { fontSize: 13, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyBold: { fontSize: 15, fontWeight: '600' as const },
  subtitle: { fontSize: 17, fontWeight: '600' as const },
  title: { fontSize: 20, fontWeight: '700' as const },
  headline: { fontSize: 26, fontWeight: '700' as const },
  metric: { fontSize: 22, fontWeight: '700' as const },
  metricLarge: { fontSize: 34, fontWeight: '700' as const },
  small: { fontSize: 12, fontWeight: '400' as const },
  smallBold: { fontSize: 12, fontWeight: '700' as const },
} as const;

// ─── Shadows ───
export const shadows: Record<string, ViewStyle> = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  fab: {
    shadowColor: '#0366d6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
};

// ─── Z-Index ───
export const zIndex = {
  base: 0,
  sticky: 10,
  overlay: 100,
  modal: 1000,
  toast: 9999,
} as const;
