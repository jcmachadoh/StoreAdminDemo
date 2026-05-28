import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, SectionList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { ObtenerEmpleadosUseCase } from '../../../application/useCases/ObtenerEmpleadosUseCase';
import { GestionarSucursalesUseCase } from '../../../application/useCases/GestionarSucursalesUseCase';
import { FullScreenLoader } from '../../components/shared/FullScreenLoader';
import { useUIStore } from '../../store/useUIStore';

export const ListaEmpleadosScreen = ({ navigation }: any) => {
  const [secciones, setSecciones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { showAlert } = useUIStore();

  const cargarDatos = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    const empleadosUseCase = new ObtenerEmpleadosUseCase();
    const sucursalesUseCase = new GestionarSucursalesUseCase();

    // Descargamos empleados y sucursales al mismo tiempo para cruzarlos
    const [resEmpleados, resSucursales] = await Promise.all([
      empleadosUseCase.ejecutar(),
      sucursalesUseCase.obtenerSucursales()
    ]);

    if (resEmpleados.exito && resSucursales.exito) {
      const empleados = resEmpleados.data;
      const sucursales = resSucursales.data;

      // Agrupamos los empleados por sucursal
      const datosAgrupados = sucursales.map(suc => ({
        title: suc.nombre,
        data: empleados.filter((emp: any) => emp.sucursal === suc.id)
      })).filter(grupo => grupo.data.length > 0); // Ocultamos sucursales vacías

      // Añadimos un grupo para empleados sin sucursal asignada (si los hay)
      const sinSucursal = empleados.filter((emp: any) => !sucursales.find(s => s.id === emp.sucursal));
      if (sinSucursal.length > 0) {
        datosAgrupados.push({ title: 'Sin Sucursal Asignada', data: sinSucursal });
      }

      setSecciones(datosAgrupados);
    } else {
      showAlert('error', 'Error', 'No se pudo cargar el personal.');
    }

    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => cargarDatos());
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  const renderEmpleado = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.nombre}>{item.nombre}</Text>
        <View style={[styles.badge, item.activo ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.badgeText, item.activo ? styles.badgeTextActive : styles.badgeTextInactive]}>
            {item.activo ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>
      <Text style={styles.detalle}>📧 {item.email}</Text>
      <Text style={styles.detalle}>🆔 ID: {item.id}</Text>
    </View>
  );

  const renderSectionHeader = ({ section: { title } }: any) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  if (isLoading && !isRefreshing) return <FullScreenLoader mensaje="Organizando la plantilla de empleados..." />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'<'} Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Empleados</Text>
        <View style={{ width: 60 }} />
      </View>

      <SectionList
        sections={secciones}
        keyExtractor={(item) => item.id}
        renderItem={renderEmpleado}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay empleados registrados en la empresa.</Text>}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => cargarDatos(true)} colors={['#0366d6']} />}
        stickySectionHeadersEnabled={true}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('FormularioEmpleadoScreen')}>
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
  list: { paddingHorizontal: 15, paddingBottom: 80 },
  sectionHeader: { backgroundColor: '#f4f6f8', paddingVertical: 10, marginTop: 10 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#0366d6', textTransform: 'uppercase' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#e1e4e8' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  nombre: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeActive: { backgroundColor: '#d4edda' },
  badgeInactive: { backgroundColor: '#fff3cd' },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  badgeTextActive: { color: '#155724' },
  badgeTextInactive: { color: '#856404' },
  detalle: { fontSize: 13, color: '#666', marginTop: 3 },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#888', fontSize: 16 },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#0366d6', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#0366d6', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  fabIcon: { color: '#fff', fontSize: 32, fontWeight: '300', lineHeight: 34 }
});