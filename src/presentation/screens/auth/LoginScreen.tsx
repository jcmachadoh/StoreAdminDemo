/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { LocalStorageAdapter } from '../../../infrastructure/storage/LocalStorageAdapter';

export const LoginScreen = ({ navigation }: any) => {
  const { loginConHuella, loginConPassword, vincularHuella, isLoading, isBiometryAvailable, verificarHardwareBiometrico } = useAuthStore();
  const localDb = new LocalStorageAdapter();

  // Estados
  const [huellaConfigurada, setHuellaConfigurada] = useState(false);
  const [usarPassword, setUsarPassword] = useState(true);
  const [pideToken, setPideToken] = useState(false); // Para el Escenario B (Teléfono nuevo)
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tokenInput, setTokenInput] = useState('');

  // 1. Al cargar la app, evaluamos qué hardware tiene y si es un teléfono nuevo
  useEffect(() => {
    verificarHardwareBiometrico();
    
    const empleadoLocal = localDb.obtenerDatosEmpleadoLogueado();
    const tieneHuella = !!localDb.obtenerHashSeguridad();
    
    setHuellaConfigurada(tieneHuella);
    
    // Si no hay empleado guardado, es un dispositivo nuevo (Escenario B)
    if (!empleadoLocal) {
      setUsarPassword(true);
      setPideToken(true);
    } else {
      setUsarPassword(!tieneHuella); // Si no hay huella, forzamos contraseña
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Disparador del escáner biométrico
  useEffect(() => {
    if (huellaConfigurada && !usarPassword && !pideToken) {
      loginConHuella();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usarPassword, huellaConfigurada, pideToken]);

  // Login Manual (Con o sin Token)
  const handleLoginManual = async () => {
    if (!username || !password || (pideToken && !tokenInput)) {
      Alert.alert('Aviso', 'Completa todos los campos requeridos.');
      return;
    }
    
    const respuesta = await loginConPassword(username, password, pideToken ? tokenInput : undefined);
    
    if (respuesta?.requiereToken) {
      setPideToken(true);
      Alert.alert('Dispositivo Nuevo', 'Como es la primera vez que usas este teléfono, necesitamos tu Token de GitHub para sincronizar tu cuenta.');
    } else if (respuesta?.exito && isBiometryAvailable) {
      const tieneHuellaGuardada = localDb.obtenerHashSeguridad();
      
      if (!tieneHuellaGuardada) {
        Alert.alert(
          'Vincular Huella',
          '¿Deseas activar el inicio de sesión con huella dactilar para la próxima vez?',
          [
            { text: 'Más tarde', style: 'cancel' },
            { 
              text: 'Sí, activar', 
              onPress: async () => {
                const vinculado = await vincularHuella(respuesta.empleadoId, respuesta.token);
                if (vinculado) {
                  setHuellaConfigurada(true);
                  setUsarPassword(false);
                  setPideToken(false);
                }
              }
            }
          ]
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.logo}>🏪</Text>
          <Text style={styles.title}>Ecosistema POS</Text>

          {!usarPassword ? (
            // --- VISTA BIOMÉTRICA (Para el uso diario) ---
            <>
              <Text style={styles.subtitle}>Inicia tu turno de forma segura</Text>
              <TouchableOpacity style={styles.biometricButton} onPress={loginConHuella} disabled={isLoading}>
                {isLoading ? <ActivityIndicator size="large" color="#fff" /> : <Text style={styles.biometricIcon}>👆</Text>}
              </TouchableOpacity>
              <Text style={styles.hint}>Usar Huella Dactilar</Text>
              
              <TouchableOpacity style={styles.fallbackButton} onPress={() => setUsarPassword(true)}>
                <Text style={styles.fallbackText}>Ingresar con Contraseña</Text>
              </TouchableOpacity>
            </>
          ) : (
            // --- VISTA FORMULARIO ---
            <View style={styles.formContainer}>
              <Text style={styles.subtitle}>
                {pideToken ? 'Vincular dispositivo existente' : 'Acceso al sistema'}
              </Text>

              {pideToken && (
                <TextInput 
                  style={styles.input} 
                  placeholder="Tu Token de GitHub (Requerido 1 vez)" 
                  placeholderTextColor="#999" 
                  value={tokenInput} 
                  onChangeText={setTokenInput} 
                  autoCapitalize="none" 
                  secureTextEntry 
                  editable={!isLoading} 
                />
              )}
              
              <TextInput style={styles.input} placeholder="Usuario" placeholderTextColor="#999" value={username} onChangeText={setUsername} autoCapitalize="none" />
              <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#999" value={password} onChangeText={setPassword} secureTextEntry />
              
              <TouchableOpacity style={styles.primaryButton} onPress={handleLoginManual} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{pideToken ? 'Vincular y Entrar' : 'Entrar'}</Text>}
              </TouchableOpacity>

              {/* Botón para volver a huella si ya estaba configurada */}
              {huellaConfigurada && !pideToken && (
                <TouchableOpacity style={styles.fallbackButton} onPress={() => setUsarPassword(false)}>
                  <Text style={styles.fallbackText}>Volver a Huella</Text>
                </TouchableOpacity>
              )}

              {/* Botón de recuperación */}
              {!pideToken && (
                <TouchableOpacity style={styles.fallbackButton} onPress={() => Alert.alert('Aviso', 'Pide al administrador que resetee tu cuenta para volver a activarla.')}>
                  <Text style={[styles.fallbackText, {color: '#d9534f'}]}>Olvidé mi contraseña</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* EL BOTÓN PERDIDO: Para empleados 100% nuevos */}
          <TouchableOpacity style={styles.activationLink} onPress={() => navigation.navigate('ActivationScreen')}>
            <Text style={styles.activationText}>¿Empleado nuevo? Activa tu cuenta aquí</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logo: { fontSize: 60, marginBottom: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30, textAlign: 'center' },
  biometricButton: { backgroundColor: '#0366d6', width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', shadowColor: '#0366d6', shadowOpacity: 0.4, shadowRadius: 15, elevation: 10, marginBottom: 15 },
  biometricIcon: { fontSize: 40 },
  hint: { fontSize: 16, color: '#0366d6', fontWeight: '600', marginBottom: 30 },
  formContainer: { width: '100%', paddingHorizontal: 10 },
  input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e1e4e8', borderRadius: 8, padding: 15, marginBottom: 15, fontSize: 16, color: '#333' },
  primaryButton: { backgroundColor: '#0366d6', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 5, marginBottom: 15 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  fallbackButton: { padding: 10, marginTop: 5, alignItems: 'center' },
  fallbackText: { color: '#666', fontSize: 16 },
  activationLink: { marginTop: 40, padding: 15 },
  activationText: { color: '#0366d6', fontSize: 16, fontWeight: 'bold', textDecorationLine: 'underline' },
});