/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useInventarioStore } from '../../store/useInventarioStore';
import { LocalStorageAdapter } from '../../../infrastructure/storage/LocalStorageAdapter';
import { FullScreenLoader } from '../../components/shared/FullScreenLoader';
import { SincronizarCatalogoUseCase } from '../../../application/useCases/SincronizarCatalogoUseCase';

export const DashboardScreen = ({ navigation }: any) => {
  const { logout } = useAuthStore();
  const { cargarCachLocal } = useInventarioStore();
  const localDb = new LocalStorageAdapter();

  const [empleado, setEmpleado] = useState<any>(null);
  const [rolesDelEmpleado, setRolesDelEmpleado] = useState<any[]>([]);
  const [rolActivoSlug, setRolActivoSlug] = useState<string>('');
  const [inicializando, setInicializando] = useState(true);

  // Separamos la lógica de carga para poder llamarla manualmente si falla
  const cargarDashboard = async (forzarSincronizacion = false) => {
    setInicializando(true);
    const empData = localDb.obtenerDatosEmpleadoLogueado();
    setEmpleado(empData);

    let todosLosRoles = localDb.obtenerRoles();

    if (todosLosRoles.length === 0 || forzarSincronizacion) {
      console.log('Descargando catálogo maestro desde GitHub...');

      // --- ESTE ES EL CAMBIO CLAVE ---
      const sincronizador = new SincronizarCatalogoUseCase();
      await sincronizador.ejecutar();

      cargarCachLocal(); // Refrescamos la memoria Zustand al instante
      todosLosRoles = localDb.obtenerRoles();
    }

    if (empData && todosLosRoles.length > 0) {
      const filtrados = todosLosRoles.filter((r: any) => empData.roles.includes(r.id));
      setRolesDelEmpleado(filtrados);

      if (filtrados.length > 0) {
        setRolActivoSlug(filtrados[0].slug);
      } else {
        Alert.alert('Aviso', 'Se descargaron los roles, pero ninguno coincide con tu usuario.');
      }
    }

    setInicializando(false);
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  if (inicializando) {
    return <FullScreenLoader mensaje="Preparando tu entorno..." />;
  }

  // --- VISTA DE EMERGENCIA (Si falló la descarga de roles) ---
  if (rolesDelEmpleado.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{empleado?.nombre || 'Usuario'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={{ fontSize: 50 }}>⚠️</Text>
          <Text style={styles.errorTitle}>Error de Sincronización</Text>
          <Text style={styles.errorText}>
            Tu perfil cargó bien, pero la app no pudo descargar el catálogo de roles ("roles.json") desde GitHub.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => cargarDashboard(true)}>
            <Text style={styles.retryButtonText}>🔄 Reintentar Descarga</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER PRINCIPAL */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {/* <Text style={styles.welcomeText}>¡Hola, guapo! 👋</Text> */}
          <Text style={styles.userName}>{empleado?.nombre || 'Usuario'}</Text>
          <Text style={styles.branchText}>Sucursal: Centro</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* MULTI-ROL BAR SELECTOR */}
      {rolesDelEmpleado.length > 1 && (
        <View style={styles.roleBarContainer}>
          <Text style={styles.roleBarTitle}>Alternar módulo activo:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleScroll}>
            {rolesDelEmpleado.map((rol) => (
              <TouchableOpacity
                key={rol.id}
                style={[styles.roleTab, rolActivoSlug === rol.slug && styles.roleTabActive]}
                onPress={() => setRolActivoSlug(rol.slug)}
              >
                <Text style={[styles.roleTabText, rolActivoSlug === rol.slug && styles.roleTabTextActive]}>
                  {rol.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* CONTENIDO DEL MÓDULO DINÁMICO */}
      <ScrollView contentContainerStyle={styles.menuContainer}>
        <Text style={styles.moduleTitle}>
          Módulo de Control: {rolesDelEmpleado.find(r => r.slug === rolActivoSlug)?.nombre}
        </Text>

        {rolActivoSlug === 'propietario' && (
          <View style={styles.grid}>
            <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('ReporteGlobalScreen')}>
              <Text style={styles.cardIcon}>📊</Text>
              <Text style={styles.cardTitle}>Reporte Global</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('GestionarSucursalesScreen')}>
              <Text style={styles.cardIcon}>🏢</Text>
              <Text style={styles.cardTitle}>Gestionar Sucursales</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('ListaEmpleadosScreen')}>
              <Text style={styles.cardIcon}>👥</Text>
              <Text style={styles.cardTitle}>Empleados</Text>
            </TouchableOpacity>
          </View>
        )}

        {rolActivoSlug === 'jefe_sucursal' && (
          <View style={styles.grid}>
            <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('MiSucursalScreen')}>
              <Text style={styles.cardIcon}>📈</Text>
              <Text style={styles.cardTitle}>Mi Sucursal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuCard} onPress={() => Alert.alert('Pedidos', 'Pedidos Online...')}>
              <Text style={styles.cardIcon}>🌐</Text>
              <Text style={styles.cardTitle}>Pedidos Online</Text>
            </TouchableOpacity>
          </View>
        )}

        {rolActivoSlug === 'empleado' && (
          <View style={styles.grid}>
            <TouchableOpacity style={[styles.menuCard, styles.accentCard]} onPress={() => navigation.navigate('PosScreen')}>
              <Text style={styles.cardIcon}>💰</Text>
              <Text style={[styles.cardTitle, styles.accentCardTitle]}>Nueva Venta (POS)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('HistorialVentasScreen')}>
              <Text style={styles.cardIcon}>📜</Text>
              <Text style={styles.cardTitle}>Mi Historial</Text>
            </TouchableOpacity>
          </View>
        )}

        {rolActivoSlug === 'gestor_inventario' && (
          <View style={styles.grid}>
            <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('AjusteStockScreen')}>
              <Text style={styles.cardIcon}>📦</Text>
              <Text style={styles.cardTitle}>Ajuste de Stock</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('MaestroArticulosScreen')}>
              <Text style={styles.cardIcon}>🏷️</Text>
              <Text style={styles.cardTitle}>Maestro Artículos</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e1e4e8' },
  userInfo: { flex: 1 },
  welcomeText: { fontSize: 14, color: '#666' },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginTop: 2 },
  branchText: { fontSize: 12, color: '#0366d6', fontWeight: '600', marginTop: 2 },
  logoutButton: { padding: 10, backgroundColor: '#ffeef0', borderRadius: 8 },
  logoutText: { color: '#d9534f', fontWeight: 'bold', fontSize: 14 },
  roleBarContainer: { backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
  roleBarTitle: { fontSize: 12, fontWeight: '700', color: '#888', paddingHorizontal: 20, marginBottom: 8, textTransform: 'uppercase' },
  roleScroll: { paddingHorizontal: 15 },
  roleTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f3f5', marginRight: 10, borderWidth: 1, borderColor: '#e1e4e8' },
  roleTabActive: { backgroundColor: '#0366d6', borderColor: '#0366d6' },
  roleTabText: { color: '#495057', fontWeight: '600', fontSize: 14 },
  roleTabTextActive: { color: '#fff' },
  menuContainer: { padding: 20 },
  moduleTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuCard: { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#e1e4e8' },
  accentCard: { backgroundColor: '#0366d6', borderColor: '#0366d6' },
  cardIcon: { fontSize: 32, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  accentCardTitle: { color: '#fff' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  errorTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 15 },
  errorText: { fontSize: 15, color: '#666', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  retryButton: { backgroundColor: '#0366d6', padding: 15, borderRadius: 8, marginTop: 30, width: '100%', alignItems: 'center' },
  retryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});