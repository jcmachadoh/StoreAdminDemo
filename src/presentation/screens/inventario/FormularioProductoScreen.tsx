import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useInventarioStore } from '../../store/useInventarioStore';
import { GuardarProductoUseCase } from '../../../application/useCases/GuardarProductoUseCase';
import { LocalStorageAdapter } from '../../../infrastructure/storage/LocalStorageAdapter';
import { FullScreenLoader } from '../../components/shared/FullScreenLoader';
import { useUIStore } from '../../store/useUIStore';

export const FormularioProductoScreen = ({ route, navigation }: any) => {
  const { categorias, cargarCachLocal } = useInventarioStore();
  const { showAlert } = useUIStore(); // <-- NUESTRO NUEVO SISTEMA DE ALERTAS
  const localDb = new LocalStorageAdapter();
  
  const [isLoading, setIsLoading] = useState(false);

  // Detectar Modo
  const productoAEditar = route.params?.producto;
  const esEdicion = !!productoAEditar;
  const empleado = localDb.obtenerDatosEmpleadoLogueado();
  const sucursalId = empleado?.sucursal || 'suc-centro';

  // Estados Base
  const [nombre, setNombre] = useState(productoAEditar?.nombre || '');
  const [descripcion, setDescripcion] = useState(productoAEditar?.descripcion || '');
  const [precio, setPrecio] = useState(productoAEditar?.precio?.toString() || '');
  const [categoriaId, setCategoriaId] = useState(productoAEditar?.categoria_id || '');
  const [imagenUrl, setImagenUrl] = useState(productoAEditar?.imagen || '');

  // Estados de Stock (Solo para creación)
  const [stockInicial, setStockInicial] = useState('0');
  const [stockMinimo, setStockMinimo] = useState('5');

  const handleGuardar = async () => {
    if (!nombre || !precio || !categoriaId) {
      showAlert('warning', 'Campos incompletos', 'El nombre, precio y categoría son obligatorios.');
      return;
    }

    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum < 0) {
      showAlert('error', 'Valor inválido', 'El precio debe ser un número válido.');
      return;
    }

    setIsLoading(true);
    const useCase = new GuardarProductoUseCase();
    
    const payload = {
      sku: productoAEditar?.sku, 
      nombre, descripcion, precio: precioNum, categoria_id: categoriaId, imagen: imagenUrl
    };

    const resultado = await useCase.ejecutar(
      payload, 
      esEdicion, 
      sucursalId, 
      parseInt(stockInicial) || 0, 
      parseInt(stockMinimo) || 5
    );
    
    setIsLoading(false);

    if (resultado.exito) {
      showAlert('success', '¡Éxito!', resultado.mensaje);
      cargarCachLocal();
      navigation.goBack();
    } else {
      showAlert('error', 'Ocurrió un error', resultado.mensaje);
    }
  };

  if (isLoading) return <FullScreenLoader mensaje={esEdicion ? "Actualizando producto..." : "Creando producto y asignando stock..."} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'<'} Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{esEdicion ? 'Editar Producto' : 'Nuevo Producto'}</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        
        <Text style={styles.label}>Nombre del Producto *</Text>
        <TextInput style={styles.input} placeholder="Ej: Funda de Silicona" value={nombre} onChangeText={setNombre} />

        <Text style={styles.label}>Precio de Venta ($) *</Text>
        <TextInput style={styles.input} placeholder="0.00" keyboardType="numeric" value={precio} onChangeText={setPrecio} />

        <Text style={styles.label}>Categoría *</Text>
        <View style={styles.categoriasContainer}>
          {categorias.map(cat => (
            <TouchableOpacity key={cat.id} style={[styles.catChip, categoriaId === cat.id && styles.catChipActive]} onPress={() => setCategoriaId(cat.id)}>
              <Text style={[styles.catText, categoriaId === cat.id && styles.catTextActive]}>{cat.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- SECCIÓN DE STOCK (SOLO VISIBLE AL CREAR) --- */}
        {!esEdicion && (
          <View style={styles.stockSection}>
            <Text style={styles.sectionTitle}>📦 Inventario Inicial ({sucursalId})</Text>
            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Cantidad Física</Text>
                <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={stockInicial} onChangeText={setStockInicial} />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Alerta Mínima</Text>
                <TextInput style={styles.input} placeholder="5" keyboardType="numeric" value={stockMinimo} onChangeText={setStockMinimo} />
              </View>
            </View>
          </View>
        )}

        <Text style={styles.label}>Descripción</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Detalles del producto..." multiline numberOfLines={3} value={descripcion} onChangeText={setDescripcion} />

        <Text style={styles.label}>URL de la Imagen (Opcional)</Text>
        <TextInput style={styles.input} placeholder="https://..." value={imagenUrl} onChangeText={setImagenUrl} autoCapitalize="none" />

        <TouchableOpacity style={styles.saveBtn} onPress={handleGuardar}>
          <Text style={styles.saveBtnText}>{esEdicion ? 'Actualizar Producto' : 'Guardar y Asignar Stock'}</Text>
        </TouchableOpacity>
        
      </ScrollView>
    </SafeAreaView>
  );
};

// Se mantienen los estilos anteriores, agregando estos para el stock:
const styles = StyleSheet.create({
  // ... (Pega aquí los estilos anteriores que ya tenías) ...
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  backBtn: { padding: 5 },
  backBtnText: { color: '#d9534f', fontSize: 16, fontWeight: '600' },
  formContainer: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e1e4e8', borderRadius: 8, padding: 15, fontSize: 16, color: '#333' },
  textArea: { height: 100, textAlignVertical: 'top' },
  categoriasContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  catChip: { backgroundColor: '#f1f3f5', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, marginRight: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e1e4e8' },
  catChipActive: { backgroundColor: '#eef3f9', borderColor: '#0366d6' },
  catText: { color: '#666', fontWeight: '500' },
  catTextActive: { color: '#0366d6', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#0366d6', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  // NUEVOS ESTILOS:
  stockSection: { backgroundColor: '#fffdf5', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ffeeba', marginTop: 20, marginBottom: 5 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#856404', marginBottom: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfCol: { width: '48%' },
});