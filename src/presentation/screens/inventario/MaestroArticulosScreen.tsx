/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useInventarioStore } from '../../store/useInventarioStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ScreenLayout, Header, Badge, FAB, SearchBar } from '../../components/shared';
import { StyleSheet } from 'react-native';

export const MaestroArticulosScreen = ({ navigation }: any) => {
  const { productos, categorias, cargarCachLocal } = useInventarioStore();
  const { colors, spacing, radii, shadows } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      cargarCachLocal();
    });
    return unsubscribe;
  }, [navigation, cargarCachLocal]);

  const productosFiltrados = productos.filter(p => {
    const coincideNombre = p.nombre
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const coincideCategoria = categoriaSeleccionada
      ? p.categoria_id === categoriaSeleccionada
      : true;
    return coincideNombre && coincideCategoria;
  });

  const renderProducto = ({ item }: any) => {
    const categoria = categorias.find(c => c.id === item.categoria_id);
    return (
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
        onPress={() =>
          navigation.navigate('FormularioProductoScreen', { producto: item })
        }
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Editar ${item.nombre}`}
      >
        {item.imagen ? (
          <Image source={{ uri: item.imagen }} style={styles.imagen} />
        ) : (
          <View
            style={[
              styles.imagenPlaceholder,
              { backgroundColor: colors.surfaceInset },
            ]}
          >
            <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
              No Img
            </Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.nombre, { color: colors.text }]}>{item.nombre}</Text>
          <Text style={[styles.sku, { color: colors.textTertiary }]}>
            SKU: {item.sku ? item.sku.substring(0, 10) : 'SIN-SKU'}...
          </Text>
          <Badge
            label={categoria?.nombre || 'Sin Categoría'}
            variant="info"
            style={{ marginTop: 4 }}
          />
        </View>
        <Text style={[styles.precio, { color: colors.success }]}>
          ${item.precio.toFixed(2)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenLayout>
      <Header title="Catálogo Maestro" onBack={() => navigation.goBack()} />

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar producto por nombre..."
      />

      <View style={[styles.filterRow, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          style={[
            styles.chip,
            {
              backgroundColor:
                categoriaSeleccionada === ''
                  ? colors.primary
                  : colors.surfaceInset,
              borderColor:
                categoriaSeleccionada === ''
                  ? colors.primary
                  : colors.border,
              borderRadius: radii.xl,
            },
          ]}
          onPress={() => setCategoriaSeleccionada('')}
          accessibilityRole="button"
          accessibilityLabel="Todas las categorías"
        >
          <Text
            style={{
              color:
                categoriaSeleccionada === '' ? '#ffffff' : colors.textSecondary,
              fontWeight: '600',
              fontSize: 13,
            }}
          >
            Todas
          </Text>
        </TouchableOpacity>
        {categorias.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.chip,
              {
                backgroundColor:
                  categoriaSeleccionada === cat.id
                    ? colors.primary
                    : colors.surfaceInset,
                borderColor:
                  categoriaSeleccionada === cat.id
                    ? colors.primary
                    : colors.border,
                borderRadius: radii.xl,
              },
            ]}
            onPress={() => setCategoriaSeleccionada(cat.id)}
            accessibilityRole="button"
            accessibilityLabel={`Categoría ${cat.nombre}`}
          >
            <Text
              style={{
                color:
                  categoriaSeleccionada === cat.id
                    ? '#ffffff'
                    : colors.textSecondary,
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              {cat.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={productosFiltrados}
        keyExtractor={(item, index) => item.sku ? item.sku.toString() : `prod-sin-sku-${index}`}
        renderItem={renderProducto}
        contentContainerStyle={[styles.list, { padding: spacing.lg }]}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No se encontraron productos.
          </Text>
        }
      />

      <FAB
        onPress={() => navigation.navigate('FormularioProductoScreen')}
        accessibilityLabel="Agregar nuevo producto"
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  chip: { paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, borderWidth: 1 },
  list: { paddingBottom: 80 },
  card: {
    flexDirection: 'row',
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  imagen: { width: 50, height: 50, borderRadius: 8 },
  imagenPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 10 },
  info: { flex: 1, marginLeft: 14 },
  nombre: { fontSize: 16, fontWeight: '600' },
  sku: { fontSize: 11, marginTop: 2 },
  precio: { fontSize: 18, fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 16 },
});
