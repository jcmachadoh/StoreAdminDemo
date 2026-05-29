import { useSettingsStore } from '../store/useSettingsStore';
import { lightTheme, darkTheme, ThemeColors } from '../theme/colors';
import { spacing, radii, typography, shadows, zIndex } from '../theme/tokens';
import { translations, Translations } from '../theme/translations';

export interface AppTheme {
  colors: ThemeColors;
  t: Translations;
  isDark: boolean;
  language: string;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  shadows: typeof shadows;
  zIndex: typeof zIndex;
}

export const useAppTheme = (): AppTheme => {
  const { theme, language } = useSettingsStore();

  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const t = translations[language];

  return {
    colors,
    t,
    isDark: theme === 'dark',
    language,
    spacing,
    radii,
    typography,
    shadows,
    zIndex,
  };
};
