import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { GestionarSucursalesUseCase } from '../../../application/useCases/GestionarSucursalesUseCase';
import { FullScreenLoader } from '../../components/shared/FullScreenLoader';
import { useUIStore } from '../../store/useUIStore';

export const GestionarSucursalesScreen = ({ navigation }: any) => {
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // Para el Pull-to-Refresh
  const { showAlert } = useUIStore();

  const cargarSucursales = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    const useCase = new GestionarSucursalesUseCase();
    const resultado = await useCase.obtenerSucursales();
    
    if (resultado.exito) {
      setSucursales(resultado.data);
    } else {
      showAlert('error', 'Error de conexión', resultado.mensaje);
    }
    
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      cargarSucursales();
    });
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  const renderSucursal = ({ item }: any) => (
    // AHORA LA TARJETA ES CLICABLE Y LLEVA AL FORMULARIO DE EDICIÓN
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('FormularioSucursalScreen', { sucursal: item })}
    >
      <View style={styles.headerCard}>
        <Text style={styles.nombre}>{item.nombre}</Text>
        <View style={[styles.badge, item.activa ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.badgeText, item.activa ? styles.badgeTextActive : styles.badgeTextInactive]}>
            {item.activa ? 'Operativa' : 'Cerrada'}
          </Text>
        </View>
      </View>
      <Text style={styles.detalle}>📍 {item.direccion}</Text>
      <Text style={styles.detalle}>🆔 ID: {item.id}</Text>
    </TouchableOpacity>
  );

  if (isLoading && !isRefreshing) return <FullScreenLoader mensaje="Descargando mapa de sucursales..." />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'<'} Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sucursales</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={sucursales}
        keyExtractor={(item) => item.id}
        renderItem={renderSucursal}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay sucursales registradas.</Text>}
        // MAGIA DEL REFRESH MANUAL AQUÍ:
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => cargarSucursales(true)} colors={['#0366d6']} />
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('FormularioSucursalScreen')}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  backBtn: { padding: 5 },
  backBtnText: { color: '#0366d6', fontSize: 16, fontWeight: '600' },
  list: { padding: 15, paddingBottom: 80 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#e1e4e8' },
  headerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  nombre: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeActive: { backgroundColor: '#d4edda', borderColor: '#c3e6cb' },
  badgeInactive: { backgroundColor: '#f8d7da', borderColor: '#f5c6cb' },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  badgeTextActive: { color: '#155724' },
  badgeTextInactive: { color: '#721c24' },
  detalle: { fontSize: 14, color: '#666', marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#888', fontSize: 16 },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#0366d6', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#0366d6', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  fabIcon: { color: '#fff', fontSize: 32, fontWeight: '300', lineHeight: 34 }
});