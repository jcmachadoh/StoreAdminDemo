import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
} from 'react-native';
import { AjustarStockUseCase } from '../../../application/useCases/AjustarStockUseCase';
import { LocalStorageAdapter } from '../../../infrastructure/storage/LocalStorageAdapter';
import { useInventarioStore } from '../../store/useInventarioStore';
import { useUIStore } from '../../store/useUIStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ScreenLayout, Header, SearchBar, Button } from '../../components/shared';

export const AjusteStockScreen = ({ navigation }: any) => {
  const { productos, cargarCachLocal } = useInventarioStore();
  const { showAlert } = useUIStore();
  const { colors, spacing, radii, shadows } = useAppTheme();
  const localDb = new LocalStorageAdapter();
  const empleado = localDb.obtenerDatosEmpleadoLogueado();
  const sucursalId = empleado?.sucursal || 'suc-centro';

  const [stockLocal, setStockLocal] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [productoSelect, setProductoSelect] = useState<any>(null);
  const [nuevaCantidad, setNuevaCantidad] = useState('');
  const [motivo, setMotivo] = useState('Conteo físico de inventario');

  useEffect(() => {
    cargarCachLocal();
    cargarStockDeMemoria();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargarCachLocal]);

  const cargarStockDeMemoria = () => {
    const stockRaw: any = localDb.obtenerStockSucursal(sucursalId) || [];
    setStockLocal(Array.isArray(stockRaw) ? stockRaw : stockRaw.stock || []);
  };

  let productosActivos = (productos || []).filter(p => p.activo);
  if (searchQuery) {
    productosActivos = productosActivos.filter(
      p =>
        p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }

  const abrirModalAjuste = (producto: any) => {
    const stockExistente = stockLocal.find(s => s.sku === producto.sku);
    setProductoSelect(producto);
    setNuevaCantidad(
      stockExistente ? stockExistente.cantidad.toString() : '0',
    );
    setModalVisible(true);
  };

  const confirmarAjuste = async () => {
    const qty = parseInt(nuevaCantidad);
    if (isNaN(qty) || qty < 0) {
      showAlert(
        'warning',
        'Cantidad inválida',
        'Debes ingresar un número válido (0 o mayor).',
      );
      return;
    }
    if (!motivo.trim()) {
      showAlert('warning', 'Falta el motivo', 'Explica por qué estás ajustando.');
      return;
    }

    setModalVisible(false);
    const useCase = new AjustarStockUseCase();
    const resultado = await useCase.ejecutar({
      sucursalId,
      sku: productoSelect.sku,
      nuevaCantidad: qty,
      motivo,
    });

    if (resultado.exito) {
      showAlert('success', 'Stock Ajustado', 'Inventario actualizado.');
      cargarStockDeMemoria();
    } else {
      showAlert('error', 'Error', resultado.mensaje);
    }
  };

  const renderProducto = ({ item }: any) => {
    const stockExistente = stockLocal.find(s => s.sku === item.sku);
    const cantidadActual = stockExistente ? stockExistente.cantidad : 0;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
            borderRadius: radii.md,
            ...shadows.sm,
          },
        ]}
        onPress={() => abrirModalAjuste(item)}
        accessibilityRole="button"
        accessibilityLabel={`Ajustar stock de ${item.nombre}`}
      >
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {item.nombre}
          </Text>
          <Text style={[styles.cardSku, { color: colors.textTertiary }]}>
            SKU: {item.sku}
          </Text>
        </View>
        <View
          style={[
            styles.stockBadge,
            { backgroundColor: colors.primaryLight, borderRadius: radii.sm },
          ]}
        >
          <Text style={[styles.stockNumber, { color: colors.primary }]}>
            {cantidadActual}
          </Text>
          <Text style={[styles.stockLabel, { color: colors.textTertiary }]}>
            uds
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenLayout>
      <Header title="Ajuste de Inventario" onBack={() => navigation.goBack()} />

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar por nombre o SKU..."
      />

      <FlatList
        data={productosActivos}
        keyExtractor={item => item.sku}
        renderItem={renderProducto}
        contentContainerStyle={[styles.list, { padding: spacing.lg }]}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: `${colors.shadow}80` },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Ajustar Cantidad
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textTertiary }]}>
              {productoSelect?.nombre}
            </Text>

            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
              Cantidad Real:
            </Text>
            <TextInput
              style={[
                styles.formInputNumber,
                {
                  backgroundColor: colors.surfaceInset,
                  color: colors.primary,
                  borderRadius: radii.sm,
                },
              ]}
              keyboardType="numeric"
              value={nuevaCantidad}
              onChangeText={setNuevaCantidad}
              accessibilityLabel="Cantidad real en almacén"
            />

            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
              Motivo:
            </Text>
            <TextInput
              style={[
                styles.formInput,
                {
                  backgroundColor: colors.surfaceInset,
                  borderColor: colors.border,
                  color: colors.text,
                  borderRadius: radii.sm,
                },
              ]}
              placeholder="Ej: Merma, Conteo físico..."
              placeholderTextColor={colors.textMuted}
              value={motivo}
              onChangeText={setMotivo}
              accessibilityLabel="Motivo del ajuste"
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                variant="danger"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: 6 }}
                accessibilityLabel="Cancelar ajuste"
              />
              <Button
                title="Guardar"
                variant="success"
                onPress={confirmarAjuste}
                style={{ flex: 1, marginLeft: 6 }}
                accessibilityLabel="Confirmar ajuste de stock"
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  list: { paddingBottom: 50 },
  card: {
    flexDirection: 'row',
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  cardInfo: { flex: 1, marginRight: 10 },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  cardSku: { fontSize: 12, marginTop: 3 },
  stockBadge: { paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', minWidth: 60 },
  stockNumber: { fontSize: 18, fontWeight: '700' },
  stockLabel: { fontSize: 10, marginTop: 2, textTransform: 'uppercase' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { width: '90%', padding: 24, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  modalSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20, marginTop: 4 },
  formLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 10 },
  formInputNumber: { padding: 14, fontSize: 24, textAlign: 'center', fontWeight: '700' },
  formInput: { borderWidth: 1, padding: 12, fontSize: 14 },
  modalActions: { flexDirection: 'row', marginTop: 24 },
});
