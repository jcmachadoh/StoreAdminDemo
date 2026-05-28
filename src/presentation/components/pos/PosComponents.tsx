import React from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, Modal, StyleSheet } from 'react-native';

// --- 1. TARJETA DEL PRODUCTO ---
export const PosProductCard = ({ item, categorias, cart, onPress }: any) => {
  const catDelProducto = (categorias || []).find((c: any) => c.id === item.categoria_id);
  const itemEnCarrito = (cart || []).find((c: any) => c.producto.sku === item.sku);

  return (
    <TouchableOpacity 
      style={[styles.card, itemEnCarrito ? styles.cardSeleccionada : null]} 
      activeOpacity={0.7}
      onPress={() => onPress(item)}
    >
      {item.imagen ? (
        <Image source={{ uri: item.imagen }} style={styles.imagen} />
      ) : (
        <View style={styles.imagenPlaceholder}><Text style={styles.placeholderText}>Img</Text></View>
      )}
      <View style={styles.info}>
        <Text style={styles.nombre} numberOfLines={2}>{item.nombre}</Text>
        <Text style={styles.categoriaTexto} numberOfLines={1}>{catDelProducto?.nombre || 'Sin categoría'}</Text>
        <Text style={styles.precio}>${item.precio.toFixed(2)}</Text>
      </View>
      {itemEnCarrito ? (
        <View style={styles.badgeCarrito}>
          <Text style={styles.badgeTexto}>{itemEnCarrito.cantidad}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

// --- 2. MODAL DE CANTIDAD ---
export const PosQuantityModal = ({ visible, onClose, onConfirm, producto, cantidad, setCantidad }: any) => (
  <Modal visible={visible} transparent={true} animationType="fade">
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Añadir al Ticket</Text>
        <Text style={styles.modalSubtitle}>{producto?.nombre}</Text>
        <Text style={styles.modalLabel}>Cantidad a cobrar:</Text>
        <TextInput 
          style={styles.modalInput} 
          keyboardType="numeric" 
          value={cantidad} 
          onChangeText={setCantidad}
          autoFocus={true}
        />
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalConfirmBtn} onPress={onConfirm}>
            <Text style={styles.modalConfirmText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// --- 3. MODAL DE DATOS DE COBRO ---
export const PosCheckoutModal = ({ 
  visible, onClose, onConfirm, total, 
  clienteNombre, setClienteNombre, 
  clienteCarnet, setClienteCarnet, 
  clienteTelefono, setClienteTelefono, 
  tipoPago, setTipoPago 
}: any) => (
  <Modal visible={visible} transparent={true} animationType="slide">
    <View style={styles.modalContainer}>
      <View style={[styles.modalContent, { width: '90%' }]}>
        <Text style={styles.modalTitle}>💳 Procesar Cobro</Text>
        <Text style={[styles.totalValue, { textAlign: 'center', marginVertical: 10 }]}>Total: ${total.toFixed(2)}</Text>
        
        <Text style={styles.formLabel}>Nombre del Cliente *</Text>
        <TextInput style={styles.formInput} placeholder="Ej: Juan Pérez" placeholderTextColor="#888" value={clienteNombre} onChangeText={setClienteNombre} />

        <Text style={styles.formLabel}>Tipo de Pago *</Text>
        <View style={styles.pagoChipsRow}>
          {['Efectivo', 'Tarjeta', 'Transferencia'].map(metodo => (
            <TouchableOpacity 
              key={metodo} 
              style={[styles.pagoChip, tipoPago === metodo && styles.pagoChipActive]} 
              onPress={() => setTipoPago(metodo)}
            >
              <Text style={[styles.pagoChipText, tipoPago === metodo && styles.pagoChipTextActive]}>{metodo}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.formLabel}>Carnet de Identidad / ID (Opcional)</Text>
        <TextInput style={styles.formInput} placeholder="Número de documento..." placeholderTextColor="#888" keyboardType="numeric" value={clienteCarnet} onChangeText={setClienteCarnet} />

        <Text style={styles.formLabel}>Teléfono de Contacto (Opcional)</Text>
        <TextInput style={styles.formInput} placeholder="+53 5xxxxxxx" placeholderTextColor="#888" keyboardType="phone-pad" value={clienteTelefono} onChangeText={setClienteTelefono} />

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
            <Text style={styles.modalCancelText}>Atrás</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalConfirmBtn} onPress={onConfirm}>
            <Text style={styles.modalConfirmText}>Confirmar Pago</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// --- ESTILOS COMPARTIDOS ---
const styles = StyleSheet.create({
  // Tarjeta
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 15, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: 'transparent' },
  cardSeleccionada: { borderColor: '#28a745', backgroundColor: '#f6fdf7' }, 
  imagen: { width: 80, height: 80, borderRadius: 8, marginBottom: 10 },
  imagenPlaceholder: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#e1e4e8', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  placeholderText: { fontSize: 12, color: '#999' },
  info: { width: '100%', alignItems: 'center' },
  nombre: { fontSize: 14, fontWeight: '600', color: '#333', textAlign: 'center' },
  categoriaTexto: { fontSize: 11, color: '#888', marginTop: 2 },
  precio: { fontSize: 16, fontWeight: 'bold', color: '#0366d6', marginTop: 4 },
  badgeCarrito: { position: 'absolute', top: 5, right: 5, backgroundColor: '#28a745', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeTexto: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  // Modales
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', padding: 25, borderRadius: 15, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, marginTop: 5 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
  modalInput: { backgroundColor: '#f1f3f5', padding: 15, borderRadius: 8, fontSize: 20, textAlign: 'center', fontWeight: 'bold', color: '#0366d6' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  modalCancelBtn: { flex: 1, padding: 12, alignItems: 'center', marginRight: 5, borderRadius: 8, backgroundColor: '#f8d7da' },
  modalCancelText: { color: '#d9534f', fontWeight: 'bold' },
  modalConfirmBtn: { flex: 1, padding: 12, alignItems: 'center', marginLeft: 5, borderRadius: 8, backgroundColor: '#28a745' },
  modalConfirmText: { color: '#fff', fontWeight: 'bold' },
  
  // Formulario Cobro
  formLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 12, marginBottom: 5 },
  formInput: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e1e4e8', borderRadius: 8, padding: 10, fontSize: 15, color: '#333' },
  pagoChipsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  pagoChip: { flex: 1, backgroundColor: '#f1f3f5', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 3, borderWidth: 1, borderColor: '#e1e4e8' },
  pagoChipActive: { backgroundColor: '#eef3f9', borderColor: '#0366d6' },
  pagoChipText: { color: '#666', fontWeight: '500', fontSize: 13 },
  pagoChipTextActive: { color: '#0366d6', fontWeight: 'bold' },
  totalValue: { fontSize: 26, fontWeight: 'bold', color: '#28a745' },
});