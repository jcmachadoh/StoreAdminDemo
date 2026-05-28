/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ObtenerMetricasSucursalUseCase } from '../../../application/useCases/ObtenerMetricasSucursalUseCase';
import { LocalStorageAdapter } from '../../../infrastructure/storage/LocalStorageAdapter';
import { useInventarioStore } from '../../store/useInventarioStore';
import { useUIStore } from '../../store/useUIStore';
import { FullScreenLoader } from '../../components/shared/FullScreenLoader';

export const MiSucursalScreen = ({ navigation }: any) => {
  const { productos, cargarCachLocal } = useInventarioStore();
  const { showAlert } = useUIStore();
  const localDb = new LocalStorageAdapter();
  const empleado = localDb.obtenerDatosEmpleadoLogueado();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metricas, setMetricas] = useState<any>({ empleadosCount: 0, ventasHoyCount: 0, ingresosHoy: 0, alertasStock: [] });

  const cargarPanel = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    cargarCachLocal(); // Para tener los nombres de los productos del catálogo maestro

    const sucursalId = empleado?.sucursal || 'suc-centro';
    const useCase = new ObtenerMetricasSucursalUseCase();
    const resultado = await useCase.ejecutar(sucursalId);

    if (resultado.exito) {
      setMetricas(resultado.data);
    } else {
      showAlert('error', 'Error', resultado.mensaje);
    }

    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => cargarPanel());
    return unsubscribe;
  }, [navigation]);

  // Tarjeta de alerta de stock
  const renderAlertaStock = ({ item }: any) => {
    // Buscamos el nombre del producto en el catálogo maestro
    const prodMaestro = (productos || []).find(p => p.sku === item.sku);
    
    return (
      <View style={styles.alertaCard}>
        <View style={styles.alertaInfo}>
          <Text style={styles.alertaNombre} numberOfLines={1}>{prodMaestro?.nombre || item.sku}</Text>
          <Text style={styles.alertaSku}>SKU: {item.sku.substring(0, 10)}...</Text>
        </View>
        <View style={styles.alertaNumeros}>
          <Text style={styles.stockCritico}>{item.cantidad} disp.</Text>
          <Text style={styles.stockMinimo}>Mínimo: {item.minimo}</Text>
        </View>
      </View>
    );
  };

  if (isLoading && !isRefreshing) return <FullScreenLoader mensaje="Analizando métricas de la sucursal..." />;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'<'} Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Sucursal</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={metricas.alertasStock}
        keyExtractor={(item) => item.sku}
        renderItem={renderAlertaStock}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => cargarPanel(true)} colors={['#0366d6']} />}
        ListHeaderComponent={
          <View style={styles.dashboardContainer}>
            <Text style={styles.sucursalId}>📍 {empleado?.sucursal?.toUpperCase()}</Text>
            
            {/* GRID DE MÉTRICAS */}
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { borderTopColor: '#28a745', borderTopWidth: 4 }]}>
                <Text style={styles.metricTitle}>Ingresos (Hoy)</Text>
                <Text style={styles.metricValue}>${metricas.ingresosHoy.toFixed(2)}</Text>
                <Text style={styles.metricSub}>{metricas.ventasHoyCount} ventas realizadas</Text>
              </View>
              
              <View style={[styles.metricCard, { borderTopColor: '#0366d6', borderTopWidth: 4 }]}>
                <Text style={styles.metricTitle}>Plantilla</Text>
                <Text style={styles.metricValue}>{metricas.empleadosCount}</Text>
                <Text style={styles.metricSub}>Empleados registrados</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚠️ Alertas de Inventario</Text>
              <Text style={styles.sectionSub}>Productos en stock crítico</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>¡Todo excelente! No hay productos con stock crítico en este momento.</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  backBtn: { padding: 5 },
  backBtnText: { color: '#0366d6', fontSize: 16, fontWeight: '600' },
  listContainer: { padding: 15, paddingBottom: 40 },
  
  dashboardContainer: { marginBottom: 15 },
  sucursalId: { fontSize: 13, fontWeight: 'bold', color: '#888', marginBottom: 15, letterSpacing: 1 },
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  metricCard: { width: '48%', backgroundColor: '#fff', padding: 15, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  metricTitle: { fontSize: 13, color: '#666', fontWeight: '600', marginBottom: 5 },
  metricValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  metricSub: { fontSize: 11, color: '#999', marginTop: 5 },
  
  sectionHeader: { marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  sectionSub: { fontSize: 13, color: '#666' },
  
  alertaCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fffdf5', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#ffeeba' },
  alertaInfo: { flex: 1, marginRight: 10 },
  alertaNombre: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  alertaSku: { fontSize: 12, color: '#888', marginTop: 2 },
  alertaNumeros: { alignItems: 'flex-end' },
  stockCritico: { fontSize: 16, fontWeight: 'bold', color: '#d9534f' },
  stockMinimo: { fontSize: 12, color: '#856404', marginTop: 2 },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#28a745', fontSize: 15, fontWeight: '500' }
});