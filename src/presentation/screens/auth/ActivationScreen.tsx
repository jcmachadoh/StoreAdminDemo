import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { ActivarCuentaUseCase } from '../../../application/useCases/ActivarCuentaUseCase';
import { useAuthStore } from '../../store/useAuthStore';

export const ActivationScreen = ({ navigation }: any) => {
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
        resultado.mensaje + '\n\n¿Deseas configurar tu huella dactilar para entrar más rápido la próxima vez?',
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
                // Si vinculó la huella con éxito, lo logueamos directamente
                await loginConHuella();
              } else {
                navigation.replace('LoginScreen');
              }
            },
          },
        ]
      );
    } else {
      Alert.alert('Activación Fallida', resultado.mensaje);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Ecosistema POS</Text>
        <Text style={styles.subtitle}>Activación de Cuenta</Text>

        <TextInput
          style={styles.input}
          placeholder="Pega aquí tu Token de GitHub"
          placeholderTextColor="#999"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Crea un Nombre de Usuario"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Crea una Contraseña Segura"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleActivacion} 
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Activar mi cuenta</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', padding: 25, borderRadius: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 25 },
  input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e1e4e8', borderRadius: 8, padding: 15, marginBottom: 15, fontSize: 16, color: '#333' },
  button: { backgroundColor: '#0366d6', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { backgroundColor: '#94bce8' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});