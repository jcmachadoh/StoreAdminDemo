/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AjustarStockUseCase } from '../../../application/useCases/AjustarStockUseCase';
import { LocalStorageAdapter } from '../../../infrastructure/storage/LocalStorageAdapter';
import { useInventarioStore } from '../../store/useInventarioStore';
import { useUIStore } from '../../store/useUIStore';

export const AjusteStockScreen = ({ navigation }: any) => {
  const { productos, cargarCachLocal } = useInventarioStore();
  const { showAlert } = useUIStore();
  const localDb = new LocalStorageAdapter();
  const empleado = localDb.obtenerDatosEmpleadoLogueado();
  const sucursalId = empleado?.sucursal || 'suc-centro';

  // Estados
  const [stockLocal, setStockLocal] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [productoSelect, setProductoSelect] = useState<any>(null);
  const [nuevaCantidad, setNuevaCantidad] = useState('');
  const [motivo, setMotivo] = useState('Conteo físico de inventario');

  useEffect(() => {
    cargarCachLocal(); // Trae el catálogo de nombres de productos
    cargarStockDeMemoria();
  }, [cargarCachLocal]);

  const cargarStockDeMemoria = () => {
    // Extraemos el array limpio para pintarlo en pantalla
    const stockRaw: any = localDb.obtenerStockSucursal(sucursalId) || [];
    setStockLocal(Array.isArray(stockRaw) ? stockRaw : (stockRaw.stock || []));
  };

  // Filtro de búsqueda
  let productosActivos = (productos || []).filter(p => p.activo);
  if (searchQuery) {
    productosActivos = productosActivos.filter(p => 
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const abrirModalAjuste = (producto: any) => {
    const stockExistente = stockLocal.find(s => s.sku === producto.sku);
    setProductoSelect(producto);
    setNuevaCantidad(stockExistente ? stockExistente.cantidad.toString() : '0');
    setModalVisible(true);
  };

  const confirmarAjuste = async () => {
    const qty = parseInt(nuevaCantidad);
    if (isNaN(qty) || qty < 0) {
      showAlert('warning', 'Cantidad inválida', 'Debes ingresar un número válido (0 o mayor).');
      return;
    }
    if (!motivo.trim()) {
      showAlert('warning', 'Falta el motivo', 'Explica por qué estás ajustando este inventario.');
      return;
    }

    setModalVisible(false);

    const useCase = new AjustarStockUseCase();
    const resultado = await useCase.ejecutar({
      sucursalId,
      sku: productoSelect.sku,
      nuevaCantidad: qty,
      motivo
    });

    if (resultado.exito) {
      showAlert('success', 'Stock Ajustado', 'El inventario se ha actualizado en el sistema.');
      cargarStockDeMemoria(); // Recargamos la lista visual inmediatamente (Efecto Offline-First)
    } else {
      showAlert('error', 'Error', resultado.mensaje);
    }
  };

  const renderProducto = ({ item }: any) => {
    const stockExistente = stockLocal.find(s => s.sku === item.sku);
    const cantidadActual = stockExistente ? stockExistente.cantidad : 0;

    return (
      <TouchableOpacity style={styles.card} onPress={() => abrirModalAjuste(item)}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.nombre}</Text>
          <Text style={styles.cardSku}>SKU: {item.sku}</Text>
        </View>
        <View style={styles.stockBadge}>
          <Text style={styles.stockNumber}>{cantidadActual}</Text>
          <Text style={styles.stockLabel}>uds</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'<'} Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajuste de Inventario</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.searchBar}>
        <TextInput 
          style={styles.searchInput} 
          placeholder="🔍 Buscar por nombre o SKU..." 
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={productosActivos}
        keyExtractor={(item) => item.sku}
        renderItem={renderProducto}
        contentContainerStyle={styles.list}
      />

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajustar Cantidad Física</Text>
            <Text style={styles.modalSubtitle}>{productoSelect?.nombre}</Text>
            
            <Text style={styles.formLabel}>Cantidad Real en Almacén:</Text>
            <TextInput 
              style={styles.formInputNumber} 
              keyboardType="numeric" 
              value={nuevaCantidad} 
              onChangeText={setNuevaCantidad}
            />

            <Text style={styles.formLabel}>Motivo del Ajuste:</Text>
            <TextInput 
              style={styles.formInput} 
              placeholder="Ej: Merma, Conteo físico, Llegada de mercancía..." 
              placeholderTextColor="#888"
              value={motivo} 
              onChangeText={setMotivo}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmarAjuste}>
                <Text style={styles.modalConfirmText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  backBtn: { padding: 5 },
  backBtnText: { color: '#0366d6', fontSize: 16, fontWeight: '600' },
  searchBar: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  searchInput: { backgroundColor: '#f1f3f5', padding: 12, borderRadius: 8, fontSize: 15, color: '#333' },
  list: { padding: 15, paddingBottom: 50 },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#eee' },
  cardInfo: { flex: 1, marginRight: 10 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  cardSku: { fontSize: 12, color: '#888', marginTop: 3 },
  stockBadge: { backgroundColor: '#eef3f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center', minWidth: 60 },
  stockNumber: { fontSize: 18, fontWeight: 'bold', color: '#0366d6' },
  stockLabel: { fontSize: 10, color: '#666', marginTop: 2, textTransform: 'uppercase' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#fff', padding: 25, borderRadius: 15, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, marginTop: 5 },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 10 },
  formInputNumber: { backgroundColor: '#f1f3f5', padding: 15, borderRadius: 8, fontSize: 24, textAlign: 'center', fontWeight: 'bold', color: '#0366d6' },
  formInput: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e1e4e8', borderRadius: 8, padding: 12, fontSize: 14, color: '#333' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  modalCancelBtn: { flex: 1, padding: 12, alignItems: 'center', marginRight: 5, borderRadius: 8, backgroundColor: '#f8d7da' },
  modalCancelText: { color: '#d9534f', fontWeight: 'bold' },
  modalConfirmBtn: { flex: 1, padding: 12, alignItems: 'center', marginLeft: 5, borderRadius: 8, backgroundColor: '#28a745' },
  modalConfirmText: { color: '#fff', fontWeight: 'bold' }
});