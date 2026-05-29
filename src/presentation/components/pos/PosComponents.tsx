import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Button } from '../shared';

// --- 1. TARJETA DEL PRODUCTO ---
export const PosProductCard = ({ item, categorias, cart, onPress }: any) => {
  const { colors, radii, shadows } = useAppTheme();
  const catDelProducto = (categorias || []).find(
    (c: any) => c.id === item.categoria_id,
  );
  const itemEnCarrito = (cart || []).find(
    (c: any) => c.producto.sku === item.sku,
  );

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: itemEnCarrito ? colors.successLight : colors.surface,
          borderColor: itemEnCarrito ? colors.success : colors.borderLight,
          borderRadius: radii.md,
          ...shadows.sm,
        },
      ]}
      activeOpacity={0.7}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`Agregar ${item.nombre} al carrito`}
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
            Img
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <Text
          style={[styles.nombre, { color: colors.text }]}
          numberOfLines={2}
        >
          {item.nombre}
        </Text>
        <Text style={[styles.categoriaTexto, { color: colors.textTertiary }]} numberOfLines={1}>
          {catDelProducto?.nombre || 'Sin categoría'}
        </Text>
        <Text style={[styles.precio, { color: colors.primary }]}>
          ${item.precio.toFixed(2)}
        </Text>
      </View>
      {itemEnCarrito ? (
        <View
          style={[
            styles.badgeCarrito,
            { backgroundColor: colors.success },
          ]}
        >
          <Text style={styles.badgeTexto}>{itemEnCarrito.cantidad}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

// --- 2. MODAL DE CANTIDAD ---
export const PosQuantityModal = ({
  visible,
  onClose,
  onConfirm,
  producto,
  cantidad,
  setCantidad,
}: any) => {
  const { colors, radii } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.modalContainer, { backgroundColor: `${colors.shadow}80` }]}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.surface, borderRadius: radii.lg },
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Añadir al Ticket
          </Text>
          <Text style={[styles.modalSubtitle, { color: colors.textTertiary }]}>
            {producto?.nombre}
          </Text>
          <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
            Cantidad a cobrar:
          </Text>
          <TextInput
            style={[
              styles.modalInput,
              {
                backgroundColor: colors.surfaceInset,
                color: colors.primary,
                borderRadius: radii.sm,
              },
            ]}
            keyboardType="numeric"
            value={cantidad}
            onChangeText={setCantidad}
            autoFocus
            accessibilityLabel="Cantidad a cobrar"
          />
          <View style={styles.modalActions}>
            <Button
              title="Cancelar"
              variant="danger"
              onPress={onClose}
              style={{ flex: 1, marginRight: 6 }}
              accessibilityLabel="Cancelar"
            />
            <Button
              title="Confirmar"
              variant="success"
              onPress={onConfirm}
              style={{ flex: 1, marginLeft: 6 }}
              accessibilityLabel="Confirmar cantidad"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- 3. MODAL DE DATOS DE COBRO ---
export const PosCheckoutModal = ({
  visible,
  onClose,
  onConfirm,
  total,
  clienteNombre,
  setClienteNombre,
  clienteCarnet,
  setClienteCarnet,
  clienteTelefono,
  setClienteTelefono,
  tipoPago,
  setTipoPago,
}: any) => {
  const { colors, radii } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.modalContainer, { backgroundColor: `${colors.shadow}80` }]}>
        <View
          style={[
            styles.modalContent,
            styles.modalFull,
            { backgroundColor: colors.surface, borderRadius: radii.lg },
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Procesar Cobro
          </Text>
          <Text
            style={[
              styles.totalValue,
              { color: colors.success, textAlign: 'center', marginVertical: 10 },
            ]}
          >
            Total: ${total.toFixed(2)}
          </Text>

          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
            Nombre del Cliente *
          </Text>
          <TextInput
            style={[
              styles.formInput,
              {
                backgroundColor: colors.surfaceInset,
                borderColor: colors.border,
                color: colors.text,
                borderRadius: radii.sm,
              },
            ]}
            placeholder="Ej: Juan Pérez"
            placeholderTextColor={colors.textMuted}
            value={clienteNombre}
            onChangeText={setClienteNombre}
            accessibilityLabel="Nombre del cliente"
          />

          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
            Tipo de Pago *
          </Text>
          <View style={styles.pagoChipsRow}>
            {['Efectivo', 'Tarjeta', 'Transferencia'].map(metodo => (
              <TouchableOpacity
                key={metodo}
                style={[
                  styles.pagoChip,
                  {
                    backgroundColor:
                      tipoPago === metodo ? colors.primary : colors.surfaceInset,
                    borderColor:
                      tipoPago === metodo ? colors.primary : colors.border,
                    borderRadius: radii.sm,
                  },
                ]}
                onPress={() => setTipoPago(metodo)}
                accessibilityRole="button"
                accessibilityLabel={`Pago con ${metodo}`}
              >
                <Text
                  style={{
                    color:
                      tipoPago === metodo ? '#ffffff' : colors.textSecondary,
                    fontWeight: '600',
                    fontSize: 13,
                  }}
                >
                  {metodo}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
            Carnet de Identidad (Opcional)
          </Text>
          <TextInput
            style={[
              styles.formInput,
              {
                backgroundColor: colors.surfaceInset,
                borderColor: colors.border,
                color: colors.text,
                borderRadius: radii.sm,
              },
            ]}
            placeholder="Número de documento..."
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={clienteCarnet}
            onChangeText={setClienteCarnet}
            accessibilityLabel="Carnet de identidad del cliente"
          />

          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
            Teléfono (Opcional)
          </Text>
          <TextInput
            style={[
              styles.formInput,
              {
                backgroundColor: colors.surfaceInset,
                borderColor: colors.border,
                color: colors.text,
                borderRadius: radii.sm,
              },
            ]}
            placeholder="+53 5xxxxxxx"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={clienteTelefono}
            onChangeText={setClienteTelefono}
            accessibilityLabel="Teléfono del cliente"
          />

          <View style={styles.modalActions}>
            <Button
              title="Atrás"
              variant="danger"
              onPress={onClose}
              style={{ flex: 1, marginRight: 6 }}
              accessibilityLabel="Volver atrás"
            />
            <Button
              title="Confirmar Pago"
              variant="success"
              onPress={onConfirm}
              style={{ flex: 1, marginLeft: 6 }}
              accessibilityLabel="Confirmar pago"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- ESTILOS ---
const styles = StyleSheet.create({
  // Tarjeta
  card: {
    width: '48%',
    padding: 10,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
  },
  imagen: { width: 80, height: 80, borderRadius: 8, marginBottom: 10 },
  imagenPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  placeholderText: { fontSize: 12 },
  info: { width: '100%', alignItems: 'center' },
  nombre: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  categoriaTexto: { fontSize: 11, marginTop: 2 },
  precio: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  badgeCarrito: {
    position: 'absolute',
    top: 5,
    right: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTexto: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Modales
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', padding: 24, elevation: 10 },
  modalFull: { width: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  modalSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20, marginTop: 4 },
  modalLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  modalInput: { padding: 14, fontSize: 20, textAlign: 'center', fontWeight: '700' },
  modalActions: { flexDirection: 'row', marginTop: 24 },

  // Formulario Cobro
  formLabel: { fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 5 },
  formInput: { borderWidth: 1, padding: 10, fontSize: 15 },
  pagoChipsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  pagoChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
  },
  totalValue: { fontSize: 26, fontWeight: '700' },
});
