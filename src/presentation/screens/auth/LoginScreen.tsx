import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { LocalStorageAdapter } from '../../../infrastructure/storage/LocalStorageAdapter';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Button, Icon } from '../../components/shared';

export const LoginScreen = ({ navigation }: any) => {
  const {
    loginConHuella,
    loginConPassword,
    vincularHuella,
    isLoading,
    isBiometryAvailable,
    verificarHardwareBiometrico,
  } = useAuthStore();
  const { colors, radii, shadows } = useAppTheme();
  const localDb = new LocalStorageAdapter();

  const [huellaConfigurada, setHuellaConfigurada] = useState(false);
  const [usarPassword, setUsarPassword] = useState(true);
  const [pideToken, setPideToken] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tokenInput, setTokenInput] = useState('');

  useEffect(() => {
    verificarHardwareBiometrico();
    const empleadoLocal = localDb.obtenerDatosEmpleadoLogueado();
    const tieneHuella = !!localDb.obtenerHashSeguridad();
    setHuellaConfigurada(tieneHuella);
    if (!empleadoLocal) {
      setUsarPassword(true);
      setPideToken(true);
    } else {
      setUsarPassword(!tieneHuella);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (huellaConfigurada && !usarPassword && !pideToken) {
      loginConHuella();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usarPassword, huellaConfigurada, pideToken]);

  const handleLoginManual = async () => {
    if (!username || !password || (pideToken && !tokenInput)) {
      Alert.alert('Aviso', 'Completa todos los campos requeridos.');
      return;
    }
    const respuesta = await loginConPassword(
      username,
      password,
      pideToken ? tokenInput : undefined,
    );
    if (respuesta && !respuesta.exito) {
      if (respuesta.requiereToken) {
        setPideToken(true);
        Alert.alert(
          'Dispositivo Nuevo',
          'Como es la primera vez que usas este teléfono, necesitamos tu Token de GitHub.',
        );
      }
    } else if (respuesta?.exito && isBiometryAvailable) {
      const tieneHuellaGuardada = localDb.obtenerHashSeguridad();
      if (!tieneHuellaGuardada) {
        Alert.alert('Vincular Huella', '¿Deseas activar el inicio con huella dactilar?', [
          { text: 'Más tarde', style: 'cancel' },
          {
            text: 'Sí, activar',
            onPress: async () => {
              const vinculado = await vincularHuella(
                respuesta.empleadoId,
                respuesta.token,
              );
              if (vinculado) {
                setHuellaConfigurada(true);
                setUsarPassword(false);
                setPideToken(false);
              }
            },
          },
        ]);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Icon name="storefront" size={60} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Ecosistema POS</Text>

          {!usarPassword ? (
            <>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Inicia tu turno de forma segura
              </Text>
              <TouchableOpacity
                style={[
                  styles.biometricBtn,
                  {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    ...shadows.fab,
                  },
                ]}
                onPress={loginConHuella}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Iniciar sesión con huella dactilar"
              >
                {isLoading ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <Icon name="fingerprint" size={40} color="#fff" />
                )}
              </TouchableOpacity>
              <Text style={[styles.hint, { color: colors.primary }]}>
                Usar Huella Dactilar
              </Text>

              <TouchableOpacity
                style={styles.fallbackBtn}
                onPress={() => setUsarPassword(true)}
                accessibilityRole="button"
                accessibilityLabel="Ingresar con contraseña"
              >
                <Text style={[styles.fallbackText, { color: colors.primary }]}>
                  Ingresar con Contraseña
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.formContainer}>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {pideToken ? 'Vincular dispositivo existente' : 'Acceso al sistema'}
              </Text>

              {pideToken && (
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
                  placeholder="Token de GitHub"
                  placeholderTextColor={colors.textMuted}
                  value={tokenInput}
                  onChangeText={setTokenInput}
                  autoCapitalize="none"
                  secureTextEntry
                  editable={!isLoading}
                  accessibilityLabel="Token de GitHub"
                />
              )}

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
                placeholder="Usuario"
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
                placeholder="Contraseña"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                accessibilityLabel="Contraseña"
              />

              <Button
                title={pideToken ? 'Vincular y Entrar' : 'Entrar'}
                onPress={handleLoginManual}
                disabled={isLoading}
                loading={isLoading}
                accessibilityLabel="Iniciar sesión"
              />

              {huellaConfigurada && !pideToken && (
                <TouchableOpacity
                  style={styles.fallbackBtn}
                  onPress={() => setUsarPassword(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Volver a huella dactilar"
                >
                  <Text style={[styles.fallbackText, { color: colors.primary }]}>
                    Volver a Huella
                  </Text>
                </TouchableOpacity>
              )}

              {!pideToken && (
                <TouchableOpacity
                  style={styles.fallbackBtn}
                  onPress={() =>
                    Alert.alert(
                      'Aviso',
                      'Pide al administrador que resetee tu cuenta.',
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Olvidé mi contraseña"
                >
                  <Text style={[styles.fallbackText, { color: colors.danger }]}>
                    Olvidé mi contraseña
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.activationLink}
            onPress={() => navigation.navigate('ActivationScreen')}
            accessibilityRole="button"
            accessibilityLabel="Activar cuenta nueva"
          >
            <Text style={[styles.activationText, { color: colors.primary }]}>
              ¿Empleado nuevo? Activa tu cuenta aquí
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 26, fontWeight: '700', marginTop: 10, marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 30, textAlign: 'center' },
  biometricBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  hint: { fontSize: 16, fontWeight: '600', marginBottom: 30 },
  formContainer: { width: '100%', paddingHorizontal: 10 },
  input: {
    borderWidth: 1,
    padding: 15,
    marginBottom: 14,
    fontSize: 16,
  },
  fallbackBtn: { padding: 10, marginTop: 8, alignItems: 'center' },
  fallbackText: { fontSize: 16, fontWeight: '600' },
  activationLink: { marginTop: 40, padding: 15 },
  activationText: { fontSize: 16, fontWeight: '700', textDecorationLine: 'underline' },
});
