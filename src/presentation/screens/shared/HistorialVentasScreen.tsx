import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ObtenerHistorialVentasUseCase } from '../../../application/useCases/ObtenerHistorialVentasUseCase';
import { LocalStorageAdapter } from '../../../infrastructure/storage/LocalStorageAdapter';
import { useUIStore } from '../../store/useUIStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  ScreenLayout,
  Header,
  Button,
  FullScreenLoader,
  Icon,
} from '../../components/shared';

export const HistorialVentasScreen = ({ navigation }: any) => {
  const { showAlert } = useUIStore();
  const { colors, spacing, radii, shadows } = useAppTheme();
  const localDb = new LocalStorageAdapter();
  const empleado = localDb.obtenerDatosEmpleadoLogueado();

  const [ventas, setVentas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [ticketSeleccionado, setTicketSeleccionado] = useState<any>(null);

  const cargarHistorial = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    const sucursalId = empleado?.sucursal || 'suc-centro';
    const useCase = new ObtenerHistorialVentasUseCase();
    const resultado = await useCase.ejecutar(sucursalId);

    if (resultado.exito) {
      const ordenadas = (resultado.data || []).sort(
        (a: any, b: any) =>
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
      );
      setVentas(ordenadas);
    } else {
      showAlert('error', 'Error', resultado.mensaje);
    }

    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    cargarHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirDetalle = (ticket: any) => {
    setTicketSeleccionado(ticket);
    setModalVisible(true);
  };

  const renderTicket = ({ item }: any) => (
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
      activeOpacity={0.7}
      onPress={() => abrirDetalle(item)}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalle del ticket ${item.id}`}
    >
      <View style={[styles.cardHeader, { borderBottomColor: colors.borderLight }]}>
        <View style={styles.ticketIdRow}>
          <Icon
            name={item._isPending ? 'timer-sand' : 'check-circle'}
            size={16}
            color={item._isPending ? colors.warning : colors.success}
          />
          <Icon name="file-document" size={16} color={colors.text} style={{ marginHorizontal: 4 }} />
          <Text style={[styles.ticketId, { color: colors.text }]}>
            {item.id.replace('ticket-', '#')}
          </Text>
        </View>
        <Text style={[styles.totalText, { color: colors.success }]}>
          ${item.total.toFixed(2)}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Icon name="account" size={14} color={colors.textSecondary} />
        <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>
          {' '}Cliente: {item.cliente?.nombre}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Icon name="credit-card" size={14} color={colors.textSecondary} />
        <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>
          {' '}Pago: {item.cliente?.tipoPago}
        </Text>
      </View>
      <View
        style={[
          styles.cardFooter,
          { borderTopColor: colors.borderLight },
        ]}
      >
        <View style={styles.detailRow}>
          <Icon name="account" size={12} color={colors.primary} />
          <Text style={[styles.vendedorText, { color: colors.primary }]}>
            {' '}Cajero: {item.vendedor?.nombre}
          </Text>
        </View>
        <Text style={[styles.fechaText, { color: colors.textMuted }]}>
          {new Date(item.fecha).toLocaleDateString()}{' '}
          {item._isPending ? '(En cola)' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !isRefreshing) {
    return <FullScreenLoader mensaje="Abriendo archivos de contabilidad..." />;
  }

  return (
    <ScreenLayout>
      <Header title="Historial de Ventas" onBack={() => navigation.goBack()} />

      <FlatList
        data={ventas}
        keyExtractor={item => item.id}
        renderItem={renderTicket}
        contentContainerStyle={[styles.list, { padding: spacing.lg }]}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No hay transacciones registradas.
          </Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => cargarHistorial(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={[styles.modalContainer, { backgroundColor: `${colors.shadow}80` }]}>
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
              Detalle del Ticket
            </Text>
            <Text style={[styles.modalSub, { color: colors.textTertiary }]}>
              {ticketSeleccionado?.id}
            </Text>

            <ScrollView style={styles.modalScroll}>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: colors.primary, borderBottomColor: colors.borderLight },
                ]}
              >
                Datos del Cliente
              </Text>
              <Text style={[styles.modalItem, { color: colors.textSecondary }]}>
               • Nombre: {ticketSeleccionado?.cliente?.nombre}
              </Text>
              <Text style={[styles.modalItem, { color: colors.textSecondary }]}>
               • ID: {ticketSeleccionado?.cliente?.carnet}
              </Text>
              <Text style={[styles.modalItem, { color: colors.textSecondary }]}>
               • Teléfono: {ticketSeleccionado?.cliente?.telefono}
              </Text>
              <Text style={[styles.modalItem, { color: colors.textSecondary }]}>
               • Pago: {ticketSeleccionado?.cliente?.tipoPago}
              </Text>

              <Text
                style={[
                  styles.sectionLabel,
                  {
                    color: colors.primary,
                    borderBottomColor: colors.borderLight,
                    marginTop: spacing.lg,
                  },
                ]}
              >
                Artículos Facturados
              </Text>
              {(ticketSeleccionado?.items || []).map((prod: any, idx: number) => (
                <View key={idx} style={styles.productRow}>
                  <Text style={[styles.productName, { color: colors.text }]}>
                    {prod.nombre} (x{prod.cantidad})
                  </Text>
                  <Text style={[styles.productSubtotal, { color: colors.text }]}>
                    ${prod.subtotal.toFixed(2)}
                  </Text>
                </View>
              ))}

              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>
                  Monto Total:
                </Text>
                <Text style={[styles.totalValue, { color: colors.success }]}>
                  ${ticketSeleccionado?.total.toFixed(2)}
                </Text>
              </View>
            </ScrollView>

            <Button
              title="Cerrar Ventana"
              onPress={() => setModalVisible(false)}
              variant="primary"
              style={{ marginTop: spacing.lg }}
              accessibilityLabel="Cerrar detalle del ticket"
            />
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  list: { paddingBottom: 30 },
  card: { padding: 14, marginBottom: 12, borderWidth: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    paddingBottom: 6,
  },
  ticketIdRow: { flexDirection: 'row', alignItems: 'center' },
  ticketId: { fontSize: 15, fontWeight: '700' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  totalText: { fontSize: 18, fontWeight: '700' },
  cardDetail: { fontSize: 13, marginTop: 3 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  vendedorText: { fontSize: 11, fontWeight: '600' },
  fechaText: { fontSize: 11 },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 16 },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { width: '85%', height: '70%', padding: 20, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  modalSub: { fontSize: 12, textAlign: 'center', marginBottom: 14 },
  modalScroll: { flex: 1 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    paddingBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalItem: { fontSize: 14, marginBottom: 4 },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  productName: { fontSize: 14, flex: 1, marginRight: 10 },
  productSubtotal: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, marginVertical: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalValue: { fontSize: 22, fontWeight: '700' },
});
