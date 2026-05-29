import React, { useEffect, useState } from 'react';
import { View, Text, SectionList, RefreshControl, StyleSheet } from 'react-native';
import { ObtenerEmpleadosUseCase } from '../../../application/useCases/ObtenerEmpleadosUseCase';
import { GestionarSucursalesUseCase } from '../../../application/useCases/GestionarSucursalesUseCase';
import { useUIStore } from '../../store/useUIStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  ScreenLayout,
  Header,
  Card,
  Badge,
  FAB,
  FullScreenLoader,
  Icon,
} from '../../components/shared';

export const ListaEmpleadosScreen = ({ navigation }: any) => {
  const [secciones, setSecciones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { showAlert } = useUIStore();
  const { colors, spacing } = useAppTheme();

  const cargarDatos = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    const empleadosUseCase = new ObtenerEmpleadosUseCase();
    const sucursalesUseCase = new GestionarSucursalesUseCase();
    const [resEmpleados, resSucursales] = await Promise.all([
      empleadosUseCase.ejecutar(),
      sucursalesUseCase.obtenerSucursales(),
    ]);

    if (resEmpleados.exito && resSucursales.exito) {
      const empleados = resEmpleados.data;
      const sucursales = resSucursales.data;

      const datosAgrupados = sucursales
        .map(suc => ({
          title: suc.nombre,
          data: empleados.filter((emp: any) => emp.sucursal === suc.id),
        }))
        .filter(grupo => grupo.data.length > 0);

      const sinSucursal = empleados.filter(
        (emp: any) => !sucursales.find(s => s.id === emp.sucursal),
      );
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
    <Card style={[styles.card, { padding: spacing.lg }]} elevated={false}>
      <View style={styles.cardHeader}>
        <Text style={[styles.nombre, { color: colors.text }]}>{item.nombre}</Text>
        <Badge
          label={item.activo ? 'Activo' : 'Inactivo'}
          variant={item.activo ? 'success' : 'warning'}
        />
      </View>
      <View style={styles.iconRow}>
        <Icon name="email-outline" size={14} color={colors.textSecondary} />
        <Text style={[styles.detalle, { color: colors.textSecondary }]}> {item.email}</Text>
      </View>
      <View style={styles.iconRow}>
        <Icon name="card-account-details-outline" size={14} color={colors.textTertiary} />
        <Text style={[styles.detalle, { color: colors.textTertiary }]}> ID: {item.id}</Text>
      </View>
    </Card>
  );

  const renderSectionHeader = ({ section: { title } }: any) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return <FullScreenLoader mensaje="Organizando la plantilla de empleados..." />;
  }

  return (
    <ScreenLayout>
      <Header title="Empleados" onBack={() => navigation.goBack()} />

      <SectionList
        sections={secciones}
        keyExtractor={item => item.id}
        renderItem={renderEmpleado}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={[styles.list, { paddingHorizontal: spacing.lg }]}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No hay empleados registrados.
          </Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => cargarDatos(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        stickySectionHeadersEnabled
      />

      <FAB
        onPress={() => navigation.navigate('FormularioEmpleadoScreen')}
        accessibilityLabel="Agregar nuevo empleado"
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  list: { paddingBottom: 80 },
  sectionHeader: { paddingVertical: 10, marginTop: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { marginBottom: 10, borderWidth: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nombre: { fontSize: 16, fontWeight: '600', flex: 1 },
  detalle: { fontSize: 13, marginTop: 3 },
  iconRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 16 },
});
