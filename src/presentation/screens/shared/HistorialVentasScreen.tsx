import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ObtenerHistorialVentasUseCase } from '../../../application/useCases/ObtenerHistorialVentasUseCase';
import { LocalStorageAdapter } from '../../../infrastructure/storage/LocalStorageAdapter';
import { useUIStore } from '../../store/useUIStore';
import { FullScreenLoader } from '../../components/shared/FullScreenLoader';

export const HistorialVentasScreen = ({ navigation }: any) => {
  const { showAlert } = useUIStore();
  const localDb = new LocalStorageAdapter();
  const empleado = localDb.obtenerDatosEmpleadoLogueado();

  const [ventas, setVentas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estados para el Modal de Detalle
  const [modalVisible, setModalVisible] = useState(false);
  const [ticketSeleccionado, setTicketSeleccionado] = useState<any>(null);

  const cargarHistorial = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    const sucursalId = empleado?.sucursal || 'suc-centro';
    const useCase = new ObtenerHistorialVentasUseCase();
    const resultado = await useCase.ejecutar(sucursalId);

    if (resultado.exito) {
      // Ordenamos las ventas para que las más recientes salgan arriba
      const ordenadas = (resultado.data || []).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
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
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => abrirDetalle(item)}>
      <View style={styles.cardHeader}>
        {/* AQUI ESTA LA MAGIA VISUAL */}
        <Text style={styles.ticketId}>
          {item._isPending ? '⏳' : '✅'} 📄 {item.id.replace('ticket-', '#')}
        </Text>
        <Text style={styles.totalText}>${item.total.toFixed(2)}</Text>
      </View>
      <Text style={styles.cardDetail}>👤 Cliente: {item.cliente?.nombre}</Text>
      <Text style={styles.cardDetail}>💳 Pago: {item.cliente?.tipoPago}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.vendedorText}>👤 Cajero: {item.vendedor?.nombre}</Text>
        <Text style={styles.fechaText}>
          {new Date(item.fecha).toLocaleDateString()} {item._isPending ? '(En cola)' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !isRefreshing) return <FullScreenLoader mensaje="Abriendo archivos de contabilidad..." />;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'<'} Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Ventas</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* LISTADO */}
      <FlatList
        data={ventas}
        keyExtractor={(item) => item.id}
        renderItem={renderTicket}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay transacciones registradas en este período.</Text>}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => cargarHistorial(true)} colors={['#0366d6']} />}
      />

      {/* MODAL DETALLE DE FACTURA / TICKET */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Detalle del Ticket</Text>
            <Text style={styles.modalSubtitle}>{ticketSeleccionado?.id}</Text>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.sectionTitle}>Datos del Cliente</Text>
              <Text style={styles.modalItem}>• Nombre: {ticketSeleccionado?.cliente?.nombre}</Text>
              <Text style={styles.modalItem}>• ID/Carnet: {ticketSeleccionado?.cliente?.carnet}</Text>
              <Text style={styles.modalItem}>• Teléfono: {ticketSeleccionado?.cliente?.telefono}</Text>
              <Text style={styles.modalItem}>• Método de Pago: {ticketSeleccionado?.cliente?.tipoPago}</Text>

              <Text style={styles.sectionTitle}>Artículos Facturados</Text>
              {(ticketSeleccionado?.items || []).map((prod: any, idx: number) => (
                <View key={idx} style={styles.productRow}>
                  <Text style={styles.productName}>{prod.nombre} (x{prod.cantidad})</Text>
                  <Text style={styles.productSubtotal}>${prod.subtotal.toFixed(2)}</Text>
                </View>
              ))}

              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Monto Total:</Text>
                <Text style={styles.totalValue}>${ticketSeleccionado?.total.toFixed(2)}</Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>Cerrar Ventana</Text>
            </TouchableOpacity>
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
  list: { padding: 15 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#e1e4e8' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderColor: '#f1f3f5', paddingBottom: 5 },
  ticketId: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  totalText: { fontSize: 18, fontWeight: 'bold', color: '#28a745' },
  cardDetail: { fontSize: 13, color: '#666', marginTop: 3 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 5, borderTopWidth: 1, borderColor: '#f1f3f5' },
  vendedorText: { fontSize: 11, color: '#0366d6', fontWeight: '600' },
  fechaText: { fontSize: 11, color: '#999' },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#888', fontSize: 16 },
  
  // Modal
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', height: '70%', backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  modalSubtitle: { fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 15 },
  modalScroll: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0366d6', marginTop: 15, marginBottom: 8, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 3, textTransform: 'uppercase' },
  modalItem: { fontSize: 14, color: '#444', marginBottom: 4 },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  productName: { fontSize: 14, color: '#333', flex: 1, marginRight: 10 },
  productSubtotal: { fontSize: 14, fontWeight: '600', color: '#333' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  totalValue: { fontSize: 22, fontWeight: 'bold', color: '#28a745' },
  closeBtn: { backgroundColor: '#0366d6', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  closeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});