/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ObtenerReporteGlobalUseCase } from '../../../application/useCases/ObtenerReporteGlobalUseCase';
import { useUIStore } from '../../store/useUIStore';

export const ReporteGlobalScreen = ({ navigation }: any) => {
  const { showAlert } = useUIStore();
  const [reporte, setReporte] = useState<any>({ ingresosTotales: 0, rankingSucursales: [], topProductos: [] });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Carga instantánea Offline al entrar
  useEffect(() => {
    cargarDatos(false);
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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0366d6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'<'} Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Imperio Global</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* BOTÓN DE SINCRONIZACIÓN MANUAL */}
        <TouchableOpacity 
          style={[styles.syncBtn, isSyncing && styles.syncBtnDisabled]} 
          onPress={() => cargarDatos(true)}
          disabled={isSyncing}
        >
          <Text style={styles.syncBtnText}>{isSyncing ? '⏳ Descargando de GitHub...' : '🔄 Actualizar con GitHub'}</Text>
        </TouchableOpacity>

        {/* MÉTRICA PRINCIPAL */}
        <View style={styles.mainMetricCard}>
          <Text style={styles.mainMetricTitle}>Facturación Total Global</Text>
          <Text style={styles.mainMetricValue}>${reporte.ingresosTotales.toFixed(2)}</Text>
        </View>

        {/* RANKING DE SUCURSALES */}
        <Text style={styles.sectionTitle}>🏆 Rendimiento por Sucursal</Text>
        {reporte.rankingSucursales.map((suc: any, index: number) => (
          <View key={index} style={styles.rankingCard}>
            <View style={styles.rankPosition}>
              <Text style={styles.rankNumber}>{index + 1}</Text>
            </View>
            <View style={styles.rankInfo}>
              <Text style={styles.rankName}>{suc.nombre}</Text>
              <Text style={styles.rankDetail}>{suc.cantidadVentas} operaciones</Text>
            </View>
            <Text style={styles.rankTotal}>${suc.total.toFixed(2)}</Text>
          </View>
        ))}

        {/* PRODUCTOS ESTRELLA */}
        <Text style={styles.sectionTitle}>⭐ Top 10 Productos Más Vendidos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topProdScroll}>
          {reporte.topProductos.map((prod: any, index: number) => (
            <View key={index} style={styles.prodCard}>
              <Text style={styles.prodPosition}>#{index + 1}</Text>
              <Text style={styles.prodName} numberOfLines={2}>{prod.nombre}</Text>
              <View style={styles.prodBottom}>
                <Text style={styles.prodQty}>{prod.cantidad} uds.</Text>
                <Text style={styles.prodTotal}>${prod.totalMonto.toFixed(2)}</Text>
              </View>
            </View>
          ))}
          {reporte.topProductos.length === 0 && (
            <Text style={styles.emptyText}>No hay ventas registradas.</Text>
          )}
        </ScrollView>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  backBtn: { padding: 5 },
  backBtnText: { color: '#0366d6', fontSize: 16, fontWeight: '600' },
  scrollContent: { padding: 15, paddingBottom: 50 },
  
  syncBtn: { backgroundColor: '#eef3f9', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#d0dfef' },
  syncBtnDisabled: { opacity: 0.5 },
  syncBtnText: { color: '#0366d6', fontWeight: 'bold', fontSize: 14 },

  mainMetricCard: { backgroundColor: '#28a745', padding: 25, borderRadius: 12, alignItems: 'center', marginBottom: 25, shadowColor: '#28a745', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  mainMetricTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
  mainMetricValue: { color: '#fff', fontSize: 38, fontWeight: 'bold' },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  
  rankingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  rankPosition: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f3f5', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  rankNumber: { fontSize: 14, fontWeight: 'bold', color: '#555' },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  rankDetail: { fontSize: 12, color: '#888', marginTop: 2 },
  rankTotal: { fontSize: 16, fontWeight: 'bold', color: '#28a745' },

  topProdScroll: { paddingBottom: 10 },
  prodCard: { width: 140, backgroundColor: '#fff', padding: 15, borderRadius: 10, marginRight: 15, borderWidth: 1, borderColor: '#eee' },
  prodPosition: { fontSize: 12, fontWeight: 'bold', color: '#0366d6', marginBottom: 5 },
  prodName: { fontSize: 13, fontWeight: '600', color: '#333', height: 35 },
  prodBottom: { marginTop: 10, borderTopWidth: 1, borderColor: '#f1f3f5', paddingTop: 10 },
  prodQty: { fontSize: 12, color: '#666' },
  prodTotal: { fontSize: 14, fontWeight: 'bold', color: '#28a745', marginTop: 2 },
  emptyText: { color: '#888', fontStyle: 'italic' }
});