import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

import { useInventarioStore } from '../../store/useInventarioStore';
import { useCartStore } from '../../store/useCartStore';
import { useUIStore } from '../../store/useUIStore';
import { ProcesarVentaFisicaUseCase } from '../../../application/useCases/ProcesarVentaFisicaUseCase';
import { LocalStorageAdapter } from '../../../infrastructure/storage/LocalStorageAdapter';
import { FullScreenLoader } from '../../components/shared/FullScreenLoader';

// Importamos los componentes modulares
import { PosProductCard, PosQuantityModal, PosCheckoutModal } from '../../components/pos/PosComponents';

const { width } = Dimensions.get('window');

export const PosScreen = ({ navigation }: any) => {
  const { productos, categorias, cargarCachLocal } = useInventarioStore(); 
  const { cart, total, agregarConCantidad, vaciarCarrito } = useCartStore();
  const { showAlert } = useUIStore(); // Nuestro gestor global de alertas
  const localDb = new LocalStorageAdapter();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => cargarCachLocal());
    return unsubscribe;
  }, [navigation, cargarCachLocal]);

  // Filtros
  const [tempSearch, setTempSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>(''); 
  const [rangoPrecio, setRangoPrecio] = useState([0, 1500]);

  // Modales
  const [modalVisible, setModalVisible] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
  const [cantidadModal, setCantidadModal] = useState('1');

  const [modalCobroVisible, setModalCobroVisible] = useState(false);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteCarnet, setClienteCarnet] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [tipoPago, setTipoPago] = useState('Efectivo');

  // Filtrado Lógico
  let productosProcesados = (productos || []).filter(p => p?.activo);
  if (searchQuery) {
    productosProcesados = productosProcesados.filter(p => 
      p?.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) || p?.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  if (categoriaSeleccionada) {
    productosProcesados = productosProcesados.filter(p => p.categoria_id === categoriaSeleccionada);
  }
  productosProcesados = productosProcesados.filter(p => p.precio >= rangoPrecio[0] && p.precio <= rangoPrecio[1]);

  // Acciones
  const abrirModalCantidad = (producto: any) => {
    setProductoSeleccionado(producto);
    setCantidadModal('1');
    setModalVisible(true);
  };

  const confirmarCantidad = () => {
    const qty = parseInt(cantidadModal);
    if (isNaN(qty) || qty <= 0) {
      // CORRECCIÓN: Uso de Alerta Global en vez de nativa
      showAlert('error', 'Cantidad Inválida', 'Por favor ingresa una cantidad mayor a 0.');
      return;
    }
    agregarConCantidad(productoSeleccionado, qty);
    showAlert('success', 'Agregado al Ticket', `Se añadieron ${qty} unidades.`);
    setModalVisible(false);
  };

  const finalizarCobro = async () => {
    if (!clienteNombre) {
      // CORRECCIÓN: Uso de Alerta Global
      showAlert('warning', 'Faltan Datos', 'Por favor ingresa al menos el nombre del cliente.');
      return;
    }

    setModalCobroVisible(false);
    setIsLoading(true);
    
    const empleado = localDb.obtenerDatosEmpleadoLogueado();
    const procesador = new ProcesarVentaFisicaUseCase();
    const resultado = await procesador.ejecutar(cart, empleado?.sucursal || 'suc-centro', {
      nombre: clienteNombre,
      tipoPago,
      carnet: clienteCarnet,
      telefono: clienteTelefono
    });

    setIsLoading(false);

    if (resultado.exito) {
      showAlert('success', '¡Cobro Exitoso!', 'Venta guardada. El inventario se actualizará en background.');
      vaciarCarrito();
      setClienteNombre(''); setClienteCarnet(''); setClienteTelefono(''); setTipoPago('Efectivo');
    } else {
      showAlert('error', 'Error en Caja', resultado.mensaje);
    }
  };

  if (isLoading) return <FullScreenLoader mensaje="Completando transacción comercial..." />;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'<'} Salir</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Punto de Venta</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* FILTROS */}
      <View style={styles.filtersZone}>
        <View style={styles.searchRow}>
          <TextInput 
            style={styles.searchInput} 
            placeholder="Buscar por nombre..." 
            placeholderTextColor="#888" 
            value={tempSearch}
            onChangeText={setTempSearch}
            onSubmitEditing={() => setSearchQuery(tempSearch)}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={() => setSearchQuery(tempSearch)}>
            <Text style={styles.searchBtnIcon}>🔍</Text> 
          </TouchableOpacity>
        </View>

        <View style={styles.sliderContainer}>
          <Text style={styles.priceLabel}>Rango: ${rangoPrecio[0]} - ${rangoPrecio[1]}</Text>
          <MultiSlider
            values={[rangoPrecio[0], rangoPrecio[1]]}
            sliderLength={width - 60}
            onValuesChange={(values) => setRangoPrecio(values)}
            min={0} max={2000} step={10} allowOverlap={false} snapped
            selectedStyle={{ backgroundColor: '#0366d6' }}
            markerStyle={{ backgroundColor: '#0366d6', height: 20, width: 20, marginTop: 4 }}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          <TouchableOpacity style={[styles.filterChip, categoriaSeleccionada === '' ? styles.filterChipActive : null]} onPress={() => setCategoriaSeleccionada('')}>
            <Text style={[styles.filterText, categoriaSeleccionada === '' ? styles.filterTextActive : null]}>Todas</Text>
          </TouchableOpacity>
          {(categorias || []).map(cat => (
            <TouchableOpacity key={cat.id} style={[styles.filterChip, categoriaSeleccionada === cat.id ? styles.filterChipActive : null]} onPress={() => setCategoriaSeleccionada(cat.id)}>
              <Text style={[styles.filterText, categoriaSeleccionada === cat.id ? styles.filterTextActive : null]}>{cat.nombre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* COMPONENTE: GRID DE PRODUCTOS */}
      <FlatList
        data={productosProcesados}
        keyExtractor={(item) => item.sku}
        renderItem={({ item }) => (
          <PosProductCard item={item} categorias={categorias} cart={cart} onPress={abrirModalCantidad} />
        )}
        numColumns={2}
        columnWrapperStyle={styles.rowWrapper}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay productos que coincidan.</Text>}
      />

      {/* COMPONENTES: MODALES */}
      <PosQuantityModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onConfirm={confirmarCantidad} 
        producto={productoSeleccionado} 
        cantidad={cantidadModal} 
        setCantidad={setCantidadModal} 
      />

      <PosCheckoutModal 
        visible={modalCobroVisible} 
        onClose={() => setModalCobroVisible(false)} 
        onConfirm={finalizarCobro} 
        total={total}
        clienteNombre={clienteNombre} setClienteNombre={setClienteNombre}
        clienteCarnet={clienteCarnet} setClienteCarnet={setClienteCarnet}
        clienteTelefono={clienteTelefono} setClienteTelefono={setClienteTelefono}
        tipoPago={tipoPago} setTipoPago={setTipoPago}
      />

      {/* BARRA DE COBRO INFERIOR */}
      {cart.length > 0 ? (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.totalLabel}>Ticket en curso:</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            <Text style={styles.itemsLabel}>{cart.reduce((acc, item) => acc + item.cantidad, 0)} artículos</Text>
          </View>
          <TouchableOpacity style={styles.cobrarBtn} onPress={() => setModalCobroVisible(true)}>
            <Text style={styles.cobrarBtnText}>Cobrar ➔</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

// Los estilos de PosScreen ahora son mínimos porque delegamos el 70% a los componentes
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  backBtn: { padding: 5 },
  backBtnText: { color: '#d9534f', fontSize: 16, fontWeight: '600' },
  filtersZone: { backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderColor: '#e1e4e8' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  searchInput: { flex: 1, backgroundColor: '#f1f3f5', padding: 12, borderRadius: 8, fontSize: 15, color: '#333' },
  searchBtn: { backgroundColor: '#eef3f9', padding: 12, borderRadius: 8, marginLeft: 10, width: 50, alignItems: 'center' },
  searchBtnIcon: { fontSize: 18 },
  sliderContainer: { alignItems: 'center', marginBottom: 10 },
  priceLabel: { fontSize: 13, color: '#666', fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: -5 },
  catScroll: { flexGrow: 0 },
  filterChip: { backgroundColor: '#f1f3f5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15, marginRight: 8, borderWidth: 1, borderColor: '#e1e4e8' },
  filterChipActive: { backgroundColor: '#0366d6', borderColor: '#0366d6' },
  filterText: { color: '#555', fontWeight: '500', fontSize: 13 },
  filterTextActive: { color: '#fff' },
  list: { padding: 10, paddingBottom: 100 },
  rowWrapper: { justifyContent: 'space-between' },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#888', fontSize: 16 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderColor: '#e1e4e8', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 15 },
  totalLabel: { fontSize: 14, color: '#666', fontWeight: '600' },
  totalValue: { fontSize: 26, fontWeight: 'bold', color: '#28a745' },
  itemsLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  cobrarBtn: { backgroundColor: '#28a745', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 10 },
  cobrarBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});