import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { GestionarSucursalesUseCase } from '../../../application/useCases/GestionarSucursalesUseCase';
import { useUIStore } from '../../store/useUIStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  ScreenLayout,
  Header,
  Badge,
  FAB,
  FullScreenLoader,
  Icon,
} from '../../components/shared';

export const GestionarSucursalesScreen = ({ navigation }: any) => {
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { showAlert } = useUIStore();
  const { colors, spacing, radii, shadows } = useAppTheme();

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
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
          borderRadius: radii.md,
          ...shadows.sm,
        },
      ]}
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate('FormularioSucursalScreen', { sucursal: item })
      }
      accessibilityRole="button"
      accessibilityLabel={`Editar sucursal ${item.nombre}`}
    >
      <View style={styles.headerCard}>
        <Text style={[styles.nombre, { color: colors.text }]}>{item.nombre}</Text>
        <Badge
          label={item.activa ? 'Operativa' : 'Cerrada'}
          variant={item.activa ? 'success' : 'danger'}
        />
      </View>
      <View style={styles.iconRow}>
        <Icon name="map-marker" size={14} color={colors.textSecondary} />
        <Text style={[styles.detalle, { color: colors.textSecondary }]}> {item.direccion}</Text>
      </View>
      <View style={styles.iconRow}>
        <Icon name="card-account-details-outline" size={14} color={colors.textTertiary} />
        <Text style={[styles.detalle, { color: colors.textTertiary }]}> ID: {item.id}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !isRefreshing) {
    return <FullScreenLoader mensaje="Descargando mapa de sucursales..." />;
  }

  return (
    <ScreenLayout>
      <Header title="Sucursales" onBack={() => navigation.goBack()} />

      <FlatList
        data={sucursales}
        keyExtractor={item => item.id}
        renderItem={renderSucursal}
        contentContainerStyle={[styles.list, { padding: spacing.lg }]}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No hay sucursales registradas.
          </Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => cargarSucursales(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      <FAB
        onPress={() => navigation.navigate('FormularioSucursalScreen')}
        accessibilityLabel="Agregar nueva sucursal"
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  list: { paddingBottom: 80 },
  card: { padding: 16, marginBottom: 14, borderWidth: 1 },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  nombre: { fontSize: 18, fontWeight: '700', flex: 1, marginRight: 8 },
  detalle: { fontSize: 14 },
  iconRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 16 },
});
