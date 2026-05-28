import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useUIStore } from '../../store/useUIStore';
import { AltaEmpleadoUseCase } from '../../../application/useCases/AltaEmpleadoUseCase';
import { GestionarSucursalesUseCase } from '../../../application/useCases/GestionarSucursalesUseCase';
import { LocalStorageAdapter } from '../../../infrastructure/storage/LocalStorageAdapter';
import { FullScreenLoader } from '../../components/shared/FullScreenLoader';

export const FormularioEmpleadoScreen = ({ navigation }: any) => {
  const { showAlert } = useUIStore();
  const localDb = new LocalStorageAdapter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Catálogos para los selectores
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [rolesMaestros, setRolesMaestros] = useState<any[]>([]);

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');
  const [rolesSeleccionados, setRolesSeleccionados] = useState<string[]>([]);

  // Cargar dependencias al abrir la pantalla
  useEffect(() => {
    const inicializar = async () => {
      // 1. Cargar roles de la caché local instantánea
      setRolesMaestros(localDb.obtenerRoles());

      // 2. Descargar las sucursales operativas desde GitHub
      const sucursalesUseCase = new GestionarSucursalesUseCase();
      const resultado = await sucursalesUseCase.obtenerSucursales();
      if (resultado.exito) {
        setSucursales(resultado.data.filter((s: any) => s.activa)); // Solo mostramos las activas
      } else {
        showAlert('error', 'Error', 'No se pudieron cargar las sucursales.');
      }
      setIsLoading(false);
    };
    inicializar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manejador de selección múltiple para Roles
  const toggleRol = (rolId: string) => {
    if (rolesSeleccionados.includes(rolId)) {
      setRolesSeleccionados(rolesSeleccionados.filter(id => id !== rolId));
    } else {
      setRolesSeleccionados([...rolesSeleccionados, rolId]);
    }
  };

  const handleGuardar = async () => {
    if (!nombre || !email || !sucursalSeleccionada || rolesSeleccionados.length === 0) {
      showAlert('warning', 'Faltan datos', 'Debes completar todos los campos y seleccionar al menos un rol.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('error', 'Email inválido', 'Introduce un correo electrónico real.');
      return;
    }

    setIsSaving(true);
    const useCase = new AltaEmpleadoUseCase();
    const resultado = await useCase.ejecutar({
      nombre,
      email,
      sucursalId: sucursalSeleccionada,
      rolesIds: rolesSeleccionados
    });
    setIsSaving(false);

    if (resultado.exito) {
      showAlert('success', '¡Contratación Exitosa!', resultado.mensaje);
      navigation.goBack();
    } else {
      showAlert('error', 'Error en el alta', resultado.mensaje);
    }
  };

  if (isLoading) return <FullScreenLoader mensaje="Cargando estructura de la empresa..." />;
  if (isSaving) return <FullScreenLoader mensaje="Registrando nuevo empleado..." />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'<'} Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alta de Personal</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.headerDescription}>
          Crea el perfil del empleado. Deberás informarle que ingrese a la app con su Token para activar su cuenta.
        </Text>

        <Text style={styles.label}>Nombre Completo *</Text>
        <TextInput style={styles.input} placeholder="Ej: Ana López" value={nombre} onChangeText={setNombre} />

        <Text style={styles.label}>Correo Electrónico *</Text>
        <TextInput style={styles.input} placeholder="ana@tienda.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

        {/* SELECTOR DE SUCURSAL (Selección Única) */}
        <Text style={styles.label}>Asignar a Sucursal *</Text>
        <View style={styles.chipsContainer}>
          {sucursales.map(suc => (
            <TouchableOpacity 
              key={suc.id} 
              style={[styles.chip, sucursalSeleccionada === suc.id && styles.chipActive]}
              onPress={() => setSucursalSeleccionada(suc.id)}
            >
              <Text style={[styles.chipText, sucursalSeleccionada === suc.id && styles.chipTextActive]}>{suc.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SELECTOR DE ROLES (Selección Múltiple) */}
        <Text style={styles.label}>Permisos del Sistema (Roles) *</Text>
        <View style={styles.chipsContainer}>
          {rolesMaestros.map(rol => (
            <TouchableOpacity 
              key={rol.id} 
              style={[styles.chip, rolesSeleccionados.includes(rol.id) && styles.chipActive]}
              onPress={() => toggleRol(rol.id)}
            >
              <Text style={[styles.chipText, rolesSeleccionados.includes(rol.id) && styles.chipTextActive]}>{rol.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleGuardar}>
          <Text style={styles.saveBtnText}>Registrar Empleado</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  backBtn: { padding: 5 },
  backBtnText: { color: '#d9534f', fontSize: 16, fontWeight: '600' },
  formContainer: { padding: 20, paddingBottom: 40 },
  headerDescription: { fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 20, backgroundColor: '#fff3cd', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ffeeba' },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e1e4e8', borderRadius: 8, padding: 15, fontSize: 16, color: '#333' },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { backgroundColor: '#f1f3f5', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, marginRight: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e1e4e8' },
  chipActive: { backgroundColor: '#eef3f9', borderColor: '#0366d6' },
  chipText: { color: '#666', fontWeight: '500' },
  chipTextActive: { color: '#0366d6', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#0366d6', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});