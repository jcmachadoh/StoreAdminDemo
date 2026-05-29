import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivarCuentaUseCase } from '../../../application/useCases/ActivarCuentaUseCase';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Button } from '../../components/shared';

export const ActivationScreen = ({ navigation }: any) => {
  const { colors, spacing, radii, shadows } = useAppTheme();
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { vincularHuella, loginConHuella } = useAuthStore();

  const handleActivacion = async () => {
    if (!token || !username || !password) {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }

    setIsLoading(true);
    const activarUseCase = new ActivarCuentaUseCase();
    const resultado = await activarUseCase.ejecutar({
      tokenIntroducido: token,
      usernameElegido: username,
      passwordElegido: password,
    });
    setIsLoading(false);

    if (resultado.exito && resultado.empleadoId) {
      Alert.alert(
        '¡Cuenta Activada!',
        resultado.mensaje +
          '\n\n¿Deseas configurar tu huella dactilar para entrar más rápido la próxima vez?',
        [
          {
            text: 'Más tarde',
            style: 'cancel',
            onPress: () => navigation.replace('LoginScreen'),
          },
          {
            text: 'Configurar Huella',
            onPress: async () => {
              const vinculado = await vincularHuella(resultado.empleadoId!, token);
              if (vinculado) {
                await loginConHuella();
              } else {
                navigation.replace('LoginScreen');
              }
            },
          },
        ],
      );
    } else {
      Alert.alert('Activación Fallida', resultado.mensaje);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            ...shadows.lg,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Ecosistema POS</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Activación de Cuenta
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceInset,
              borderColor: colors.border,
              color: colors.text,
              borderRadius: radii.sm,
            },
          ]}
          placeholder="Pega aquí tu Token de GitHub"
          placeholderTextColor={colors.textMuted}
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          secureTextEntry
          accessibilityLabel="Token de GitHub"
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceInset,
              borderColor: colors.border,
              color: colors.text,
              borderRadius: radii.sm,
            },
          ]}
          placeholder="Crea un Nombre de Usuario"
          placeholderTextColor={colors.textMuted}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          accessibilityLabel="Nombre de usuario"
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceInset,
              borderColor: colors.border,
              color: colors.text,
              borderRadius: radii.sm,
            },
          ]}
          placeholder="Crea una Contraseña Segura"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="Contraseña"
        />

        <Button
          title="Activar mi cuenta"
          onPress={handleActivacion}
          disabled={isLoading}
          loading={isLoading}
          style={{ marginTop: spacing.sm }}
          accessibilityLabel="Activar cuenta"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  card: { padding: 24 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
  input: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
  },
});
