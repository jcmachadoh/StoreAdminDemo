/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useInventarioStore } from '../../store/useInventarioStore';
import { LocalStorageAdapter } from '../../../infrastructure/storage/LocalStorageAdapter';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FullScreenLoader, Icon } from '../../components/shared';
import { SincronizarCatalogoUseCase } from '../../../application/useCases/SincronizarCatalogoUseCase';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useVigilanteRed } from '../../hooks/useVigilanteRed';
import { SincronizarColasUseCase } from '../../../application/useCases/SincronizarColasUseCase';
import { useUIStore } from '../../store/useUIStore';

interface Rol {
  id: string;
  slug: string;
  nombre: string;
}

interface MenuItem {
  icon: string;
  title: string;
  screen?: string;
  onPress?: () => void;
}

export const DashboardScreen = ({ navigation }: any) => {
  const { logout } = useAuthStore();
  const { cargarCachLocal } = useInventarioStore();
  const { colors, radii, shadows } = useAppTheme();
  const localDb = new LocalStorageAdapter();
  const { syncMode } = useSettingsStore();
  const { showAlert } = useUIStore();

  const [empleado, setEmpleado] = useState<any>(null);
  const [rolesDelEmpleado, setRolesDelEmpleado] = useState<Rol[]>([]);
  const [rolActivoSlug, setRolActivoSlug] = useState<string>('');
  const [inicializando, setInicializando] = useState(true);

  // ¡ACTIVAMOS EL VIGILANTE INVISIBLE!
  useVigilanteRed();

  const cargarDashboard = async (forzarSincronizacion = false) => {
    setInicializando(true);
    const empData = localDb.obtenerDatosEmpleadoLogueado();
    setEmpleado(empData);

    let todosLosRoles = localDb.obtenerRoles();

    if (todosLosRoles.length === 0 || forzarSincronizacion) {
      const sincronizador = new SincronizarCatalogoUseCase();
      await sincronizador.ejecutar();
      cargarCachLocal();
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

  const ejecutarSincronizacionManual = async () => {
    // Alert.alert('Sincronizando', 'Subiendo datos a la nube...');
    showAlert('info', 'Sincronizando', 'Subiendo datos a la nube...');
    const syncEngine = new SincronizarColasUseCase();
    const result = await syncEngine.ejecutar();
    if (result.procesados > 0) {
      showAlert('success', '¡Éxito!', `Se sincronizaron ${result.procesados} elementos con GitHub.`);
    } else if (!result.exito) {
      // Si procesados es 0 pero exito es false, hubo un error real
      showAlert('error', 'Error', result.mensaje);
    } else {
      // Si procesados es 0 y exito es true, el sistema está limpio
      showAlert('success', 'Al Día', 'No hay datos pendientes por subir.');
    }
  };

  useEffect(() => {
    cargarDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (inicializando) {
    return <FullScreenLoader mensaje="Preparando tu entorno..." />;
  }

  if (rolesDelEmpleado.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {empleado?.nombre || 'Usuario'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.logoutBtn]}
            onPress={logout}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
          >
            {/* <Text style={[styles.logoutText, { color: colors.danger }]}>Salir</Text> */}
            <Icon name="logout" size={22} color={colors.danger} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={50} color={colors.warning} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Error de Sincronización</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Tu perfil cargó bien, pero la app no pudo descargar el catálogo de roles desde GitHub.
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => cargarDashboard(true)}
            accessibilityRole="button"
            accessibilityLabel="Reintentar descarga"
          >
            <Icon name="sync" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.retryBtnText}>Reintentar Descarga</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const menuItems: Record<string, MenuItem[]> = {
    propietario: [
      { icon: 'chart-bar', title: 'Reporte Global', screen: 'ReporteGlobalScreen' },
      { icon: 'office-building', title: 'Gestionar Sucursales', screen: 'GestionarSucursalesScreen' },
      { icon: 'account-group', title: 'Empleados', screen: 'ListaEmpleadosScreen' },
    ],
    jefe_sucursal: [
      { icon: 'chart-line', title: 'Mi Sucursal', screen: 'MiSucursalScreen' },
      {
        icon: 'web',
        title: 'Pedidos Online',
        onPress: () => Alert.alert('Pedidos', 'Pedidos Online...'),
      },
    ],
    empleado: [
      { icon: 'cash', title: 'Nueva Venta (POS)', screen: 'PosScreen' },
      { icon: 'script-text-outline', title: 'Mi Historial', screen: 'HistorialVentasScreen' },
    ],
    gestor_inventario: [
      { icon: 'package-variant-closed', title: 'Ajuste de Stock', screen: 'AjusteStockScreen' },
      { icon: 'tag', title: 'Maestro Artículos', screen: 'MaestroArticulosScreen' },
    ],
  };

  const rolActivo = rolesDelEmpleado.find(r => r.slug === rolActivoSlug);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {empleado?.nombre || 'Usuario'}
          </Text>
          <Text style={[styles.branchText, { color: colors.primary }]}>Sucursal: Centro</Text>
        </View>
        {syncMode === 'manual' && (
          <TouchableOpacity onPress={ejecutarSincronizacionManual} style={styles.settingsBtn}>
            <Icon name="sync" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => navigation.navigate('AjustesScreen')}
          style={styles.settingsBtn}
          accessibilityRole="button"
          accessibilityLabel="Ajustes"
        >
          <Icon name="cog" size={22} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.logoutBtn]}
          onPress={logout}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          {/* <Text style={[styles.logoutText, { color: colors.danger }]}>Salir</Text> */}
          <Icon name="logout" size={22} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {rolesDelEmpleado.length > 1 && (
        <View style={[styles.roleBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.roleTitle, { color: colors.textTertiary }]}>
            Módulo activo
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleScroll}>
            {rolesDelEmpleado.map(rol => {
              const isActive = rolActivoSlug === rol.slug;
              return (
                <TouchableOpacity
                  key={rol.id}
                  style={[
                    styles.roleTab,
                    {
                      backgroundColor: isActive ? colors.primary : colors.surfaceInset,
                      borderColor: isActive ? colors.primary : colors.border,
                      borderRadius: radii.xl,
                    },
                  ]}
                  onPress={() => setRolActivoSlug(rol.slug)}
                  accessibilityRole="button"
                  accessibilityLabel={`Activar módulo ${rol.nombre}`}
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={[
                      styles.roleTabText,
                      { color: isActive ? '#ffffff' : colors.textSecondary },
                    ]}
                  >
                    {rol.nombre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.menuContainer}>
        <Text style={[styles.moduleTitle, { color: colors.text }]}>
          Módulo: {rolActivo?.nombre}
        </Text>

        <View style={styles.grid}>
          {(menuItems[rolActivoSlug] || []).map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                  ...shadows.md,
                  borderRadius: radii.md,
                },
                item.screen === 'PosScreen' && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => {
                if (item.screen) navigation.navigate(item.screen);
                if (item.onPress) item.onPress();
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <Icon
                name={item.icon}
                size={32}
                color={item.screen === 'PosScreen' ? '#ffffff' : colors.primary}
                style={{ marginBottom: 12 }}
              />
              <Text
                style={[
                  styles.cardTitle,
                  { color: item.screen === 'PosScreen' ? '#ffffff' : colors.text },
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  branchText: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  settingsBtn: { marginRight: 12, padding: 4 },
  logoutBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  logoutText: { fontWeight: '700', fontSize: 14 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  errorTitle: { fontSize: 22, fontWeight: '700', marginTop: 15 },
  errorText: { fontSize: 15, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, marginTop: 30 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  roleBar: { paddingVertical: 10, borderBottomWidth: 1 },
  roleTitle: { fontSize: 11, fontWeight: '700', paddingHorizontal: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  roleScroll: { paddingHorizontal: 16 },
  roleTab: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderWidth: 1 },
  roleTabText: { fontWeight: '600', fontSize: 14 },
  menuContainer: { padding: 20, paddingBottom: 40 },
  moduleTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuCard: {
    width: '47%',
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
