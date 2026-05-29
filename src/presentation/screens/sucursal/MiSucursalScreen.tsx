import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { ObtenerMetricasSucursalUseCase } from '../../../application/useCases/ObtenerMetricasSucursalUseCase';
import { LocalStorageAdapter } from '../../../infrastructure/storage/LocalStorageAdapter';
import { useInventarioStore } from '../../store/useInventarioStore';
import { useUIStore } from '../../store/useUIStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  ScreenLayout,
  Header,
  Card,
  MetricCard,
  FullScreenLoader,
  Icon,
} from '../../components/shared';

export const MiSucursalScreen = ({ navigation }: any) => {
  const { productos, cargarCachLocal } = useInventarioStore();
  const { showAlert } = useUIStore();
  const { colors, spacing } = useAppTheme();
  const localDb = new LocalStorageAdapter();
  const empleado = localDb.obtenerDatosEmpleadoLogueado();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metricas, setMetricas] = useState<any>({
    empleadosCount: 0,
    ventasHoyCount: 0,
    ingresosHoy: 0,
    alertasStock: [],
  });

  const cargarPanel = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    cargarCachLocal();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  const renderAlertaStock = ({ item }: any) => {
    const prodMaestro = (productos || []).find(p => p.sku === item.sku);
    return (
      <Card
        style={[
          styles.alertaCard,
          {
            borderLeftColor: colors.danger,
            borderLeftWidth: 3,
            padding: spacing.lg,
          },
        ]}
      >
        <View style={styles.alertaInfo}>
          <Text style={[styles.alertaNombre, { color: colors.text }]} numberOfLines={1}>
            {prodMaestro?.nombre || item.sku}
          </Text>
          <Text style={[styles.alertaSku, { color: colors.textTertiary }]}>
            SKU: {item.sku.substring(0, 10)}...
          </Text>
        </View>
        <View style={styles.alertaNumeros}>
          <Text style={[styles.stockCritico, { color: colors.danger }]}>
            {item.cantidad} disp.
          </Text>
          <Text style={[styles.stockMinimo, { color: colors.warningText }]}>
            Mín: {item.minimo}
          </Text>
        </View>
      </Card>
    );
  };

  if (isLoading && !isRefreshing) {
    return <FullScreenLoader mensaje="Analizando métricas de la sucursal..." />;
  }

  return (
    <ScreenLayout>
      <Header title="Mi Sucursal" onBack={() => navigation.goBack()} />

      <FlatList
        data={metricas.alertasStock}
        keyExtractor={item => item.sku}
        renderItem={renderAlertaStock}
        contentContainerStyle={[styles.listContainer, { padding: spacing.lg }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => cargarPanel(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.dashboardContainer}>
            <View
              style={[
                styles.sucursalRow,
                { marginBottom: spacing.lg },
              ]}
            >
              <Icon name="map-marker" size={13} color={colors.textTertiary} />
              <Text
                style={[
                  styles.sucursalId,
                  { color: colors.textTertiary },
                ]}
              >
                {' '}{empleado?.sucursal?.toUpperCase()}
              </Text>
            </View>

            <View style={styles.metricsGrid}>
              <MetricCard
                title="Ingresos (Hoy)"
                value={`$${metricas.ingresosHoy.toFixed(2)}`}
                subtitle={`${metricas.ventasHoyCount} ventas realizadas`}
                accentColor={colors.success}
                style={{ width: '48%' }}
              />
              <MetricCard
                title="Plantilla"
                value={String(metricas.empleadosCount)}
                subtitle="Empleados registrados"
                accentColor={colors.primary}
                style={{ width: '48%' }}
              />
            </View>

            <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Alertas de Inventario
              </Text>
              <Text style={[styles.sectionSub, { color: colors.textTertiary }]}>
                Productos en stock crítico
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.success }]}>
            ¡Todo excelente! No hay productos con stock crítico.
          </Text>
        }
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  listContainer: { paddingBottom: 40 },
  dashboardContainer: {},
  sucursalRow: { flexDirection: 'row', alignItems: 'center' },
  sucursalId: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionSub: { fontSize: 13, marginTop: 2 },
  alertaCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertaInfo: { flex: 1, marginRight: 10 },
  alertaNombre: { fontSize: 15, fontWeight: '600' },
  alertaSku: { fontSize: 12, marginTop: 2 },
  alertaNumeros: { alignItems: 'flex-end' },
  stockCritico: { fontSize: 16, fontWeight: '700' },
  stockMinimo: { fontSize: 12, marginTop: 2 },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 15, fontWeight: '500' },
});
