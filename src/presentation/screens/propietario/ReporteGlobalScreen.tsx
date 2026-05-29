import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ObtenerReporteGlobalUseCase } from '../../../application/useCases/ObtenerReporteGlobalUseCase';
import { useUIStore } from '../../store/useUIStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ScreenLayout, Header, Card, Button, Badge } from '../../components/shared';

export const ReporteGlobalScreen = ({ navigation }: any) => {
  const { showAlert } = useUIStore();
  const { colors, spacing } = useAppTheme();
  const [reporte, setReporte] = useState<any>({
    ingresosTotales: 0,
    rankingSucursales: [],
    topProductos: [],
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    cargarDatos(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatos = async (desdeNube: boolean) => {
    if (desdeNube) setIsSyncing(true);
    const useCase = new ObtenerReporteGlobalUseCase();
    const resultado = await useCase.ejecutar(desdeNube);
    if (resultado.exito) {
      setReporte(resultado.data);
      if (desdeNube) showAlert('success', 'Actualizado', 'Datos sincronizados con GitHub.');
    } else {
      showAlert('error', 'Error', resultado.mensaje);
    }
    setIsInitializing(false);
    setIsSyncing(false);
  };

  if (isInitializing) {
    return (
      <ScreenLayout style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Button title="Cargando..." onPress={() => {}} loading />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <Header title="Imperio Global" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}>
        <Button
          title={isSyncing ? 'Descargando...' : 'Actualizar con GitHub'}
          onPress={() => cargarDatos(true)}
          variant="outline"
          loading={isSyncing}
          disabled={isSyncing}
          style={{ marginBottom: spacing.xl }}
          accessibilityLabel="Sincronizar datos con GitHub"
        />

        <Card
          style={[
            styles.mainMetric,
            { backgroundColor: colors.success, borderColor: colors.success },
          ]}
          elevated={false}
        >
          <Text style={styles.mainMetricTitle}>Facturación Total Global</Text>
          <Text style={styles.mainMetricValue}>
            ${reporte.ingresosTotales.toFixed(2)}
          </Text>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.sm }]}>
          Rendimiento por Sucursal
        </Text>

        {reporte.rankingSucursales.map((suc: any, index: number) => (
          <Card
            key={index}
            style={[styles.rankingCard, { padding: spacing.lg }]}
          >
            <View style={[styles.rankPos, { backgroundColor: colors.surfaceInset }]}>
              <Text style={[styles.rankNum, { color: colors.textSecondary }]}>
                {index + 1}
              </Text>
            </View>
            <View style={styles.rankInfo}>
              <Text style={[styles.rankName, { color: colors.text }]}>{suc.nombre}</Text>
              <Text style={[styles.rankDetail, { color: colors.textTertiary }]}>
                {suc.cantidadVentas} operaciones
              </Text>
            </View>
            <Text style={[styles.rankTotal, { color: colors.success }]}>
              ${suc.total.toFixed(2)}
            </Text>
          </Card>
        ))}

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.xxl }]}>
          Top 10 Productos Más Vendidos
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {reporte.topProductos.length > 0 ? (
            reporte.topProductos.map((prod: any, index: number) => (
              <Card key={index} style={[styles.prodCard, { width: 140, marginRight: spacing.md }]}>
                <Badge label={`#${index + 1}`} variant="info" />
                <Text
                  style={[styles.prodName, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {prod.nombre}
                </Text>
                <View
                  style={[
                    styles.prodBottom,
                    { borderTopColor: colors.borderLight },
                  ]}
                >
                  <Text style={[styles.prodQty, { color: colors.textTertiary }]}>
                    {prod.cantidad} uds.
                  </Text>
                  <Text style={[styles.prodTotal, { color: colors.success }]}>
                    ${prod.totalMonto.toFixed(2)}
                  </Text>
                </View>
              </Card>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No hay ventas registradas.
            </Text>
          )}
        </ScrollView>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 50 },
  mainMetric: { padding: 28, alignItems: 'center', marginBottom: 20 },
  mainMetricTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  mainMetricValue: { color: '#fff', fontSize: 36, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  rankingCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rankPos: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rankNum: { fontSize: 14, fontWeight: '700' },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 15, fontWeight: '600' },
  rankDetail: { fontSize: 12, marginTop: 2 },
  rankTotal: { fontSize: 16, fontWeight: '700' },
  prodCard: { padding: 14 },
  prodName: { fontSize: 13, fontWeight: '600', marginTop: 8, height: 36 },
  prodBottom: { marginTop: 10, borderTopWidth: 1, paddingTop: 10 },
  prodQty: { fontSize: 11 },
  prodTotal: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  emptyText: { fontStyle: 'italic' },
});
