/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ScreenLayout, Header, Icon } from '../../components/shared';

const OptionRow = ({
  label,
  isSelected,
  onPress,
  colors,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  colors: any;
}) => (
  <TouchableOpacity
    style={[styles.row, { borderBottomColor: colors.borderLight }]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ selected: isSelected }}
  >
    <Text style={[styles.rowText, { color: colors.text }]}>{label}</Text>
    {isSelected && (
      <View style={[styles.checkCircle, { backgroundColor: colors.success }]}>
        <Icon name="check" size={14} color="#fff" />
      </View>
    )}
  </TouchableOpacity>
);

export const AjustesScreen = ({ navigation }: any) => {
  const { cambiarTema, cambiarIdioma, cambiarSyncMode, cambiarSyncDelay, syncMode, syncDelay } = useSettingsStore();
  const { colors, t, isDark, language, spacing } = useAppTheme();

  return (
    <ScreenLayout>
      <Header title={t.settingsTitle} onBack={() => navigation.goBack()} backLabel={t.back} />
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>

        {/* --- SINCRONIZACIÓN --- */}
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
          {t.sync.toUpperCase()}
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 14,
            },
          ]}
        >
          <View style={styles.syncRow}>
            {(['manual', 'auto'] as const).map(mode => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.syncChip,
                  {
                    backgroundColor: syncMode === mode ? colors.primary : colors.surfaceInset,
                    borderColor: syncMode === mode ? colors.primary : colors.border,
                    borderRadius: 8,
                  },
                ]}
                onPress={() => cambiarSyncMode(mode)}
                accessibilityRole="button"
                accessibilityLabel={mode === 'manual' ? t.syncManual : t.syncAuto}
              >
                <Text
                  style={{
                    color: syncMode === mode ? '#fff' : colors.textSecondary,
                    fontWeight: '700',
                    fontSize: 14,
                  }}
                >
                  {mode === 'manual' ? t.syncManual : t.syncAuto}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {syncMode === 'auto' && (
            <View style={[styles.delayContainer, { borderTopColor: colors.borderLight }]}>
              <Text style={{ color: colors.textSecondary, marginBottom: 8, fontSize: 14 }}>
                {t.syncDelayLabel}
              </Text>
              <TextInput
                style={[
                  styles.delayInput,
                  {
                    backgroundColor: colors.surfaceInset,
                    color: colors.text,
                    borderColor: colors.border,
                    borderRadius: 8,
                  },
                ]}
                keyboardType="numeric"
                value={syncDelay.toString()}
                onChangeText={text => {
                  const val = parseInt(text, 10);
                  if (!isNaN(val)) cambiarSyncDelay(val);
                  else if (text === '') cambiarSyncDelay(0);
                }}
                accessibilityLabel={t.syncDelayLabel}
              />
            </View>
          )}
        </View>

        {/* --- IDIOMA --- */}
        <Text style={[styles.sectionTitle, { color: colors.textTertiary, marginTop: spacing.xxl }]}>
          {t.language.toUpperCase()}
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 14,
            },
          ]}
        >
          <OptionRow
            label={`🇪🇸  ${t.spanish}`}
            isSelected={language === 'es'}
            onPress={() => cambiarIdioma('es')}
            colors={colors}
          />
          <OptionRow
            label={`🇺🇸  ${t.english}`}
            isSelected={language === 'en'}
            onPress={() => cambiarIdioma('en')}
            colors={colors}
          />
        </View>

        {/* --- TEMA --- */}
        <Text style={[styles.sectionTitle, { color: colors.textTertiary, marginTop: spacing.xxl }]}>
          {t.theme.toUpperCase()}
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 14,
            },
          ]}
        >
          <OptionRow
            label={`☀️  ${t.lightMode}`}
            isSelected={!isDark}
            onPress={() => cambiarTema('light')}
            colors={colors}
          />
          <OptionRow
            label={`🌙  ${t.darkMode}`}
            isSelected={isDark}
            onPress={() => cambiarTema('dark')}
            colors={colors}
          />
        </View>

      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  sectionTitle: { fontSize: 12, fontWeight: '700', marginBottom: 10, marginLeft: 4, letterSpacing: 0.5 },
  card: { borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  rowText: { fontSize: 16, fontWeight: '500' },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncRow: { flexDirection: 'row', padding: 14, gap: 10 },
  syncChip: { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1 },
  delayContainer: { marginTop: 0, paddingHorizontal: 14, paddingBottom: 16, borderTopWidth: 1 },
  delayInput: { borderWidth: 1, padding: 10, fontSize: 16, textAlign: 'center', fontWeight: '700' },
});
