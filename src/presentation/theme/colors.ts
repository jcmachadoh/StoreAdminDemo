export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceInset: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;

  // Brand
  primary: string;
  primaryLight: string;

  // Semantic
  success: string;
  successLight: string;
  successText: string;
  danger: string;
  dangerLight: string;
  dangerText: string;
  warning: string;
  warningLight: string;
  warningText: string;
  info: string;
  infoLight: string;
  infoText: string;

  // Borders
  border: string;
  borderLight: string;

  // Navigation
  tabActive: string;
  tabInactive: string;

  // Shadows
  shadow: string;
}

export const lightTheme: ThemeColors = {
  background: '#f4f6f8',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  surfaceInset: '#f1f3f5',

  text: '#1a1a2e',
  textSecondary: '#495057',
  textTertiary: '#6c757d',
  textMuted: '#adb5bd',

  primary: '#0366d6',
  primaryLight: '#e8f0fe',

  success: '#28a745',
  successLight: '#d4edda',
  successText: '#155724',
  danger: '#d9534f',
  dangerLight: '#f8d7da',
  dangerText: '#721c24',
  warning: '#ffc107',
  warningLight: '#fff3cd',
  warningText: '#856404',
  info: '#0366d6',
  infoLight: '#d1ecf1',
  infoText: '#0c5460',

  border: '#e1e4e8',
  borderLight: '#f1f3f5',

  tabActive: '#0366d6',
  tabInactive: '#f1f3f5',

  shadow: '#000000',
};

export const darkTheme: ThemeColors = {
  background: '#0d1117',
  surface: '#161b22',
  surfaceElevated: '#1c2128',
  surfaceInset: '#21262d',

  text: '#f0f6fc',
  textSecondary: '#c9d1d9',
  textTertiary: '#8b949e',
  textMuted: '#6e7681',

  primary: '#58a6ff',
  primaryLight: '#1f3a5f',

  success: '#3fb950',
  successLight: '#1b3a24',
  successText: '#7ee787',
  danger: '#f85149',
  dangerLight: '#3d1c1c',
  dangerText: '#ffa198',
  warning: '#d29922',
  warningLight: '#2d2410',
  warningText: '#e3b341',
  info: '#58a6ff',
  infoLight: '#0c2d6b',
  infoText: '#79c0ff',

  border: '#30363d',
  borderLight: '#21262d',

  tabActive: '#58a6ff',
  tabInactive: '#21262d',

  shadow: '#000000',
};
