import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useUIStore } from '../../store/useUIStore';
import { GuardarSucursalUseCase } from '../../../application/useCases/GuardarSucursalUseCase';
import { FullScreenLoader } from '../../components/shared/FullScreenLoader';

export const FormularioSucursalScreen = ({ route, navigation }: any) => {
  const { showAlert } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);

  // Detectamos si venimos en MODO EDICIÓN
  const sucursalAEditar = route.params?.sucursal;
  const esEdicion = !!sucursalAEditar;

  // Estados inicializados con datos previos si existen
  const [nombre, setNombre] = useState(sucursalAEditar?.nombre || '');
  const [direccion, setDireccion] = useState(sucursalAEditar?.direccion || '');
  const [lat, setLat] = useState(sucursalAEditar?.coordenadas?.lat?.toString() || '');
  const [lng, setLng] = useState(sucursalAEditar?.coordenadas?.lng?.toString() || '');

  const handleGuardar = async () => {
    if (!nombre || !direccion) {
      showAlert('warning', 'Datos incompletos', 'El nombre y la dirección son obligatorios.');
      return;
    }

    setIsLoading(true);
    const useCase = new GuardarSucursalUseCase();
    
    const payload = {
      id: sucursalAEditar?.id, // Solo se usa en edición
      nombre,
      direccion,
      coordenadas: {
        lat: parseFloat(lat) || 0,
        lng: parseFloat(lng) || 0,
      }
    };

    const resultado = await useCase.ejecutar(payload, esEdicion);
    setIsLoading(false);

    if (resultado.exito) {
      showAlert('success', esEdicion ? 'Actualizado' : '¡Inauguración!', resultado.mensaje);
      navigation.goBack();
    } else {
      showAlert('error', 'Error Operativo', resultado.mensaje);
    }
  };

  if (isLoading) return <FullScreenLoader mensaje={esEdicion ? "Guardando cambios en la nube..." : "Construyendo nueva sucursal..."} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'<'} Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{esEdicion ? 'Editar Sucursal' : 'Inaugurar Sucursal'}</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        {!esEdicion && (
          <Text style={styles.headerDescription}>
            Al crear una sucursal, el sistema automáticamente le generará un identificador único y una base de datos de inventario independiente.
          </Text>
        )}

        <Text style={styles.label}>Nombre de la Tienda *</Text>
        <TextInput style={styles.input} placeholder="Ej: Sucursal Habana Vieja" value={nombre} onChangeText={setNombre} />

        <Text style={styles.label}>Dirección Física *</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Calle, Número, Municipio..." multiline numberOfLines={2} value={direccion} onChangeText={setDireccion} />

        <Text style={styles.sectionTitle}>Ubicación GPS (Opcional)</Text>
        <View style={styles.row}>
          <View style={styles.halfCol}>
            <Text style={styles.label}>Latitud</Text>
            <TextInput style={styles.input} placeholder="23.1135" keyboardType="numeric" value={lat} onChangeText={setLat} />
          </View>
          <View style={styles.halfCol}>
            <Text style={styles.label}>Longitud</Text>
            <TextInput style={styles.input} placeholder="-82.3665" keyboardType="numeric" value={lng} onChangeText={setLng} />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleGuardar}>
          <Text style={styles.saveBtnText}>{esEdicion ? 'Actualizar Datos' : 'Crear Sucursal'}</Text>
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
  formContainer: { padding: 20 },
  headerDescription: { fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 20, backgroundColor: '#eef3f9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d0dfef' },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e1e4e8', borderRadius: 8, padding: 15, fontSize: 16, color: '#333' },
  textArea: { height: 70, textAlignVertical: 'top' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 25, marginBottom: 5, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfCol: { width: '48%' },
  saveBtn: { backgroundColor: '#0366d6', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 40 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});