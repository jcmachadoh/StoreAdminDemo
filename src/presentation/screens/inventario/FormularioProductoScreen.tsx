import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useInventarioStore } from '../../store/useInventarioStore';
import { GuardarProductoUseCase } from '../../../application/useCases/GuardarProductoUseCase';
import { LocalStorageAdapter } from '../../../infrastructure/storage/LocalStorageAdapter';
import { useUIStore } from '../../store/useUIStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  ScreenLayout,
  Header,
  Button,
  FullScreenLoader,
  Icon,
} from '../../components/shared';

export const FormularioProductoScreen = ({ route, navigation }: any) => {
  const { categorias, cargarCachLocal } = useInventarioStore();
  const { showAlert } = useUIStore();
  const { colors, spacing, radii } = useAppTheme();
  const localDb = new LocalStorageAdapter();

  const [isLoading, setIsLoading] = useState(false);
  const productoAEditar = route.params?.producto;
  const esEdicion = !!productoAEditar;
  const empleado = localDb.obtenerDatosEmpleadoLogueado();
  const sucursalId = empleado?.sucursal || 'suc-centro';

  const [nombre, setNombre] = useState(productoAEditar?.nombre || '');
  const [descripcion, setDescripcion] = useState(productoAEditar?.descripcion || '');
  const [precio, setPrecio] = useState(productoAEditar?.precio?.toString() || '');
  const [categoriaId, setCategoriaId] = useState(productoAEditar?.categoria_id || '');
  const [imagenUrl, setImagenUrl] = useState(productoAEditar?.imagen || '');
  const [stockInicial, setStockInicial] = useState('0');
  const [stockMinimo, setStockMinimo] = useState('5');

  const handleGuardar = async () => {
    if (!nombre || !precio || !categoriaId) {
      showAlert('warning', 'Campos incompletos', 'Nombre, precio y categoría son obligatorios.');
      return;
    }
    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum < 0) {
      showAlert('error', 'Valor inválido', 'El precio debe ser un número válido.');
      return;
    }

    setIsLoading(true);
    const useCase = new GuardarProductoUseCase();
    const payload = {
      sku: productoAEditar?.sku,
      nombre,
      descripcion,
      precio: precioNum,
      categoria_id: categoriaId,
      imagen: imagenUrl,
    };
    const resultado = await useCase.ejecutar(
      payload,
      esEdicion,
      sucursalId,
      parseInt(stockInicial) || 0,
      parseInt(stockMinimo) || 5,
    );
    setIsLoading(false);

    if (resultado.exito) {
      showAlert('success', '¡Éxito!', resultado.mensaje);
      cargarCachLocal();
      navigation.goBack();
    } else {
      showAlert('error', 'Error', resultado.mensaje);
    }
  };

  if (isLoading) {
    return (
      <FullScreenLoader
        mensaje={esEdicion ? 'Actualizando producto...' : 'Creando producto...'}
      />
    );
  }

  return (
    <ScreenLayout>
      <Header
        title={esEdicion ? 'Editar Producto' : 'Nuevo Producto'}
        onBack={() => navigation.goBack()}
        backLabel="Cancelar"
        backColor="danger"
      />

      <ScrollView
        contentContainerStyle={[styles.formContainer, { padding: spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Nombre del Producto *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceInset,
              borderColor: colors.border,
              color: colors.text,
              borderRadius: radii.sm,
            },
          ]}
          placeholder="Ej: Funda de Silicona"
          placeholderTextColor={colors.textMuted}
          value={nombre}
          onChangeText={setNombre}
          accessibilityLabel="Nombre del producto"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Precio de Venta ($) *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceInset,
              borderColor: colors.border,
              color: colors.text,
              borderRadius: radii.sm,
            },
          ]}
          placeholder="0.00"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={precio}
          onChangeText={setPrecio}
          accessibilityLabel="Precio de venta"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Categoría *
        </Text>
        <View style={styles.chipsContainer}>
          {categorias.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    categoriaId === cat.id ? colors.primary : colors.surfaceInset,
                  borderColor:
                    categoriaId === cat.id ? colors.primary : colors.border,
                  borderRadius: radii.xl,
                },
              ]}
              onPress={() => setCategoriaId(cat.id)}
              accessibilityRole="button"
              accessibilityLabel={`Categoría ${cat.nombre}`}
            >
              <Text
                style={{
                  color: categoriaId === cat.id ? '#ffffff' : colors.textSecondary,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {cat.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!esEdicion && (
          <View
            style={[
              styles.stockSection,
              {
                backgroundColor: colors.warningLight,
                borderColor: colors.warning,
                borderRadius: radii.md,
              },
            ]}
          >
            <View style={[styles.iconRow, { marginBottom: spacing.sm }]}>
              <Icon name="package-variant-closed" size={16} color={colors.warningText} />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.warningText },
                ]}
              >
                {' '}Inventario Inicial ({sucursalId})
              </Text>
            </View>
            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Cantidad Física
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceInset,
                      borderColor: colors.border,
                      color: colors.text,
                      borderRadius: radii.sm,
                    },
                  ]}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={stockInicial}
                  onChangeText={setStockInicial}
                  accessibilityLabel="Cantidad inicial de stock"
                />
              </View>
              <View style={styles.halfCol}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Alerta Mínima
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceInset,
                      borderColor: colors.border,
                      color: colors.text,
                      borderRadius: radii.sm,
                    },
                  ]}
                  placeholder="5"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={stockMinimo}
                  onChangeText={setStockMinimo}
                  accessibilityLabel="Stock mínimo para alerta"
                />
              </View>
            </View>
          </View>
        )}

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Descripción
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: colors.surfaceInset,
              borderColor: colors.border,
              color: colors.text,
              borderRadius: radii.sm,
            },
          ]}
          placeholder="Detalles del producto..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          value={descripcion}
          onChangeText={setDescripcion}
          accessibilityLabel="Descripción del producto"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          URL de la Imagen (Opcional)
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceInset,
              borderColor: colors.border,
              color: colors.text,
              borderRadius: radii.sm,
            },
          ]}
          placeholder="https://..."
          placeholderTextColor={colors.textMuted}
          value={imagenUrl}
          onChangeText={setImagenUrl}
          autoCapitalize="none"
          accessibilityLabel="URL de la imagen del producto"
        />

        <Button
          title={esEdicion ? 'Actualizar Producto' : 'Guardar y Asignar Stock'}
          onPress={handleGuardar}
          variant="primary"
          style={{ marginTop: spacing.xxl }}
          accessibilityLabel="Guardar producto"
        />
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  formContainer: { paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 14 },
  input: { borderWidth: 1, padding: 14, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 9, marginRight: 8, marginBottom: 8, borderWidth: 1 },
  stockSection: { padding: 16, borderWidth: 1, marginTop: 20, marginBottom: 5 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  iconRow: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfCol: { width: '48%' },
});
