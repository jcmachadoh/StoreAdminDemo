import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, ScrollView } from 'react-native';
import { useInventarioStore } from '../../store/useInventarioStore';

export const MaestroArticulosScreen = ({ navigation }: any) => {
  const { productos, categorias, cargarCachLocal } = useInventarioStore();
  
  // Estados para los filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>(''); // '' significa "Todas"

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      cargarCachLocal();
    });
    return unsubscribe;
  }, [navigation, cargarCachLocal]);

  // Lógica de filtrado en tiempo real (Instantáneo desde memoria)
  const productosFiltrados = productos.filter((p) => {
    const coincideNombre = p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const coincideCategoria = categoriaSeleccionada ? p.categoria_id === categoriaSeleccionada : true;
    return coincideNombre && coincideCategoria;
  });

  const renderProducto = ({ item }: any) => {
    const categoria = categorias.find(c => c.id === item.categoria_id);
    return (
      // AHORA LA TARJETA ES CLICABLE Y NAVEGA PASANDO EL PRODUCTO COMO PARÁMETRO
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('FormularioProductoScreen', { producto: item })}
        activeOpacity={0.7}
      >
        {item.imagen ? (
          <Image source={{ uri: item.imagen }} style={styles.imagen} />
        ) : (
          <View style={styles.imagenPlaceholder}><Text style={styles.placeholderText}>No Img</Text></View>
        )}
        <View style={styles.info}>
          <Text style={styles.nombre}>{item.nombre}</Text>
          <Text style={styles.sku}>SKU: {item.sku.substring(0, 13)}...</Text>
          <Text style={styles.categoriaBadge}>{categoria?.nombre || 'Sin Categoría'}</Text>
        </View>
        <Text style={styles.precio}>${item.precio.toFixed(2)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'<'} Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Catálogo Maestro</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* BUSCADOR */}
      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.searchInput} 
          placeholder="🔍 Buscar producto por nombre..." 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* FILTRO POR CATEGORÍAS */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterChip, categoriaSeleccionada === '' && styles.filterChipActive]}
            onPress={() => setCategoriaSeleccionada('')}
          >
            <Text style={[styles.filterText, categoriaSeleccionada === '' && styles.filterTextActive]}>Todas</Text>
          </TouchableOpacity>
          
          {categorias.map(cat => (
            <TouchableOpacity 
              key={cat.id} 
              style={[styles.filterChip, categoriaSeleccionada === cat.id && styles.filterChipActive]}
              onPress={() => setCategoriaSeleccionada(cat.id)}
            >
              <Text style={[styles.filterText, categoriaSeleccionada === cat.id && styles.filterTextActive]}>{cat.nombre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LISTA */}
      <FlatList
        data={productosFiltrados}
        keyExtractor={(item) => item.sku}
        renderItem={renderProducto}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron productos.</Text>}
      />

      {/* BOTÓN FLOTANTE */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('FormularioProductoScreen')}>
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
  searchContainer: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 10, backgroundColor: '#fff' },
  searchInput: { backgroundColor: '#f1f3f5', padding: 12, borderRadius: 8, fontSize: 16, color: '#333' },
  filterScroll: { paddingHorizontal: 15, paddingBottom: 15, backgroundColor: '#fff' },
  filterChip: { backgroundColor: '#f1f3f5', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#e1e4e8' },
  filterChipActive: { backgroundColor: '#0366d6', borderColor: '#0366d6' },
  filterText: { color: '#555', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  list: { padding: 15, paddingBottom: 80 },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  imagen: { width: 50, height: 50, borderRadius: 8 },
  imagenPlaceholder: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#e1e4e8', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 10, color: '#999' },
  info: { flex: 1, marginLeft: 15 },
  nombre: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  sku: { fontSize: 11, color: '#888', marginTop: 2 },
  categoriaBadge: { alignSelf: 'flex-start', backgroundColor: '#eef3f9', color: '#0366d6', fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4, overflow: 'hidden' },
  precio: { fontSize: 18, fontWeight: 'bold', color: '#28a745' },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#888', fontSize: 16 },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#0366d6', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#0366d6', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  fabIcon: { color: '#fff', fontSize: 32, fontWeight: '300', lineHeight: 34 }
});