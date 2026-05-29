import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

import { useInventarioStore } from '../../store/useInventarioStore';
import { useCartStore } from '../../store/useCartStore';
import { useUIStore } from '../../store/useUIStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ProcesarVentaFisicaUseCase } from '../../../application/useCases/ProcesarVentaFisicaUseCase';
import { LocalStorageAdapter } from '../../../infrastructure/storage/LocalStorageAdapter';
import { FullScreenLoader, Header, Icon } from '../../components/shared';
import {
  PosProductCard,
  PosQuantityModal,
  PosCheckoutModal,
} from '../../components/pos/PosComponents';

const { width } = Dimensions.get('window');

export const PosScreen = ({ navigation }: any) => {
  const { productos, categorias, cargarCachLocal } = useInventarioStore();
  const { cart, total, agregarConCantidad, vaciarCarrito } = useCartStore();
  const { showAlert } = useUIStore();
  const { colors, spacing, radii } = useAppTheme();
  const localDb = new LocalStorageAdapter();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => cargarCachLocal());
    return unsubscribe;
  }, [navigation, cargarCachLocal]);

  const [tempSearch, setTempSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');
  const [rangoPrecio, setRangoPrecio] = useState([0, 1500]);

  const [modalVisible, setModalVisible] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
  const [cantidadModal, setCantidadModal] = useState('1');

  const [modalCobroVisible, setModalCobroVisible] = useState(false);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteCarnet, setClienteCarnet] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [tipoPago, setTipoPago] = useState('Efectivo');

  let productosProcesados = (productos || []).filter(p => p?.activo);
  if (searchQuery) {
    productosProcesados = productosProcesados.filter(
      p =>
        p?.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p?.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }
  if (categoriaSeleccionada) {
    productosProcesados = productosProcesados.filter(
      p => p.categoria_id === categoriaSeleccionada,
    );
  }
  productosProcesados = productosProcesados.filter(
    p => p.precio >= rangoPrecio[0] && p.precio <= rangoPrecio[1],
  );

  const abrirModalCantidad = (producto: any) => {
    setProductoSeleccionado(producto);
    setCantidadModal('1');
    setModalVisible(true);
  };

  const confirmarCantidad = () => {
    const qty = parseInt(cantidadModal);
    if (isNaN(qty) || qty <= 0) {
      showAlert('error', 'Cantidad Inválida', 'Ingresa una cantidad mayor a 0.');
      return;
    }
    agregarConCantidad(productoSeleccionado, qty);
    showAlert('success', 'Agregado al Ticket', `Se añadieron ${qty} unidades.`);
    setModalVisible(false);
  };

  const finalizarCobro = async () => {
    if (!clienteNombre) {
      showAlert('warning', 'Faltan Datos', 'Ingresa al menos el nombre del cliente.');
      return;
    }

    setModalCobroVisible(false);
    setIsLoading(true);

    const empleado = localDb.obtenerDatosEmpleadoLogueado();
    const procesador = new ProcesarVentaFisicaUseCase();
    const resultado = await procesador.ejecutar(
      cart,
      empleado?.sucursal || 'suc-centro',
      {
        nombre: clienteNombre,
        tipoPago,
        carnet: clienteCarnet,
        telefono: clienteTelefono,
      },
    );

    setIsLoading(false);

    if (resultado.exito) {
      showAlert('success', '¡Cobro Exitoso!', 'Venta guardada.');
      vaciarCarrito();
      setClienteNombre('');
      setClienteCarnet('');
      setClienteTelefono('');
      setTipoPago('Efectivo');
    } else {
      showAlert('error', 'Error en Caja', resultado.mensaje);
    }
  };

  if (isLoading) {
    return <FullScreenLoader mensaje="Completando transacción comercial..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Punto de Venta"
        onBack={() => navigation.goBack()}
        backLabel="Salir"
        backColor="danger"
      />

      <View
        style={[
          styles.filtersZone,
          { backgroundColor: colors.surface, borderBottomColor: colors.borderLight },
        ]}
      >
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchInputWrapper,
              { backgroundColor: colors.surfaceInset, borderRadius: radii.sm },
            ]}
          >
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar por nombre..."
              placeholderTextColor={colors.textMuted}
              value={tempSearch}
              onChangeText={setTempSearch}
              onSubmitEditing={() => setSearchQuery(tempSearch)}
              accessibilityLabel="Buscar productos"
            />
          </View>
          <TouchableOpacity
            style={[
              styles.searchBtn,
              { backgroundColor: colors.primaryLight, borderRadius: radii.sm },
            ]}
            onPress={() => setSearchQuery(tempSearch)}
            accessibilityRole="button"
            accessibilityLabel="Buscar"
          >
            <Icon name="magnify" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.sliderContainer}>
          <Text style={[styles.priceLabel, { color: colors.textTertiary }]}>
            Rango: ${rangoPrecio[0]} - ${rangoPrecio[1]}
          </Text>
          <MultiSlider
            values={[rangoPrecio[0], rangoPrecio[1]]}
            sliderLength={width - 60}
            onValuesChange={values => setRangoPrecio(values)}
            min={0}
            max={2000}
            step={10}
            allowOverlap={false}
            snapped
            selectedStyle={{ backgroundColor: colors.primary }}
            markerStyle={{
              backgroundColor: colors.primary,
              height: 20,
              width: 20,
              marginTop: 4,
            }}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.chip,
              {
                backgroundColor:
                  categoriaSeleccionada === ''
                    ? colors.primary
                    : colors.surfaceInset,
                borderColor:
                  categoriaSeleccionada === ''
                    ? colors.primary
                    : colors.border,
                borderRadius: radii.xl,
              },
            ]}
            onPress={() => setCategoriaSeleccionada('')}
            accessibilityRole="button"
            accessibilityLabel="Todas las categorías"
          >
            <Text
              style={{
                color:
                  categoriaSeleccionada === '' ? '#ffffff' : colors.textSecondary,
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              Todas
            </Text>
          </TouchableOpacity>
          {(categorias || []).map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    categoriaSeleccionada === cat.id
                      ? colors.primary
                      : colors.surfaceInset,
                  borderColor:
                    categoriaSeleccionada === cat.id
                      ? colors.primary
                      : colors.border,
                  borderRadius: radii.xl,
                },
              ]}
              onPress={() => setCategoriaSeleccionada(cat.id)}
              accessibilityRole="button"
              accessibilityLabel={`Categoría ${cat.nombre}`}
            >
              <Text
                style={{
                  color:
                    categoriaSeleccionada === cat.id
                      ? '#ffffff'
                      : colors.textSecondary,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {cat.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={productosProcesados}
        keyExtractor={item => item.sku}
        renderItem={({ item }) => (
          <PosProductCard
            item={item}
            categorias={categorias}
            cart={cart}
            onPress={abrirModalCantidad}
          />
        )}
        numColumns={2}
        columnWrapperStyle={styles.rowWrapper}
        contentContainerStyle={[styles.list, { padding: spacing.md }]}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No hay productos que coincidan.
          </Text>
        }
      />

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
        clienteNombre={clienteNombre}
        setClienteNombre={setClienteNombre}
        clienteCarnet={clienteCarnet}
        setClienteCarnet={setClienteCarnet}
        clienteTelefono={clienteTelefono}
        setClienteTelefono={setClienteTelefono}
        tipoPago={tipoPago}
        setTipoPago={setTipoPago}
      />

      {cart.length > 0 ? (
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.borderLight,
            },
          ]}
        >
          <View>
            <Text style={[styles.totalLabel, { color: colors.textTertiary }]}>
              Ticket en curso:
            </Text>
            <Text style={[styles.totalValue, { color: colors.success }]}>
              ${total.toFixed(2)}
            </Text>
            <Text style={[styles.itemsLabel, { color: colors.textMuted }]}>
              {cart.reduce((acc, item) => acc + item.cantidad, 0)} artículos
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.cobrarBtn,
              { backgroundColor: colors.success, borderRadius: radii.md },
            ]}
            onPress={() => setModalCobroVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Proceder al cobro"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.cobrarBtnText}>Cobrar </Text>
              <Icon name="arrow-right" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  filtersZone: { padding: 14, borderBottomWidth: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  searchInputWrapper: { flex: 1, paddingHorizontal: 12 },
  searchInput: { fontSize: 15, paddingVertical: 10 },
  searchBtn: { padding: 10, marginLeft: 8, width: 44, alignItems: 'center' },

  sliderContainer: { alignItems: 'center', marginBottom: 10 },
  priceLabel: { fontSize: 13, fontWeight: '700', alignSelf: 'flex-start', marginBottom: -4 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, borderWidth: 1 },
  list: { paddingBottom: 100 },
  rowWrapper: { justifyContent: 'space-between' },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 16 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 15,
  },
  totalLabel: { fontSize: 14, fontWeight: '600' },
  totalValue: { fontSize: 26, fontWeight: '700' },
  itemsLabel: { fontSize: 12, marginTop: 2 },
  cobrarBtn: { paddingHorizontal: 30, paddingVertical: 14 },
  cobrarBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
