import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useUIStore } from '../../store/useUIStore';
import { GuardarSucursalUseCase } from '../../../application/useCases/GuardarSucursalUseCase';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  ScreenLayout,
  Header,
  Button,
  FullScreenLoader,
} from '../../components/shared';

export const FormularioSucursalScreen = ({ route, navigation }: any) => {
  const { showAlert } = useUIStore();
  const { colors, spacing, radii } = useAppTheme();
  const [isLoading, setIsLoading] = useState(false);

  const sucursalAEditar = route.params?.sucursal;
  const esEdicion = !!sucursalAEditar;

  const [nombre, setNombre] = useState(sucursalAEditar?.nombre || '');
  const [direccion, setDireccion] = useState(sucursalAEditar?.direccion || '');
  const [lat, setLat] = useState(sucursalAEditar?.coordenadas?.lat?.toString() || '');
  const [lng, setLng] = useState(sucursalAEditar?.coordenadas?.lng?.toString() || '');

  const handleGuardar = async () => {
    if (!nombre || !direccion) {
      showAlert('warning', 'Datos incompletos', 'Nombre y dirección son obligatorios.');
      return;
    }

    setIsLoading(true);
    const useCase = new GuardarSucursalUseCase();
    const payload = {
      id: sucursalAEditar?.id,
      nombre,
      direccion,
      coordenadas: {
        lat: parseFloat(lat) || 0,
        lng: parseFloat(lng) || 0,
      },
    };
    const resultado = await useCase.ejecutar(payload, esEdicion);
    setIsLoading(false);

    if (resultado.exito) {
      showAlert('success', esEdicion ? 'Actualizado' : '¡Inauguración!', resultado.mensaje);
      navigation.goBack();
    } else {
      showAlert('error', 'Error', resultado.mensaje);
    }
  };

  if (isLoading) {
    return (
      <FullScreenLoader
        mensaje={esEdicion ? 'Guardando cambios...' : 'Creando sucursal...'}
      />
    );
  }

  return (
    <ScreenLayout>
      <Header
        title={esEdicion ? 'Editar Sucursal' : 'Inaugurar Sucursal'}
        onBack={() => navigation.goBack()}
        backLabel="Cancelar"
        backColor="danger"
      />

      <ScrollView
        contentContainerStyle={[styles.formContainer, { padding: spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        {!esEdicion && (
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary,
                borderRadius: radii.sm,
              },
            ]}
          >
            <Text style={[styles.infoText, { color: colors.primary }]}>
              Al crear una sucursal, el sistema generará un identificador único y una
              base de datos de inventario independiente.
            </Text>
          </View>
        )}

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Nombre de la Tienda *
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
          placeholder="Ej: Sucursal Habana Vieja"
          placeholderTextColor={colors.textMuted}
          value={nombre}
          onChangeText={setNombre}
          accessibilityLabel="Nombre de la sucursal"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Dirección Física *
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
          placeholder="Calle, Número, Municipio..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={2}
          value={direccion}
          onChangeText={setDireccion}
          accessibilityLabel="Dirección de la sucursal"
        />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Ubicación GPS (Opcional)
        </Text>
        <View style={styles.row}>
          <View style={styles.halfCol}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Latitud</Text>
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
              placeholder="23.1135"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={lat}
              onChangeText={setLat}
              accessibilityLabel="Latitud"
            />
          </View>
          <View style={styles.halfCol}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Longitud</Text>
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
              placeholder="-82.3665"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={lng}
              onChangeText={setLng}
              accessibilityLabel="Longitud"
            />
          </View>
        </View>

        <Button
          title={esEdicion ? 'Actualizar Datos' : 'Crear Sucursal'}
          onPress={handleGuardar}
          variant="primary"
          style={{ marginTop: spacing.xxxl }}
          accessibilityLabel="Guardar sucursal"
        />
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  formContainer: { paddingBottom: 40 },
  infoBox: { padding: 14, borderWidth: 1, marginBottom: 20 },
  infoText: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 14 },
  input: { borderWidth: 1, padding: 14, fontSize: 16 },
  textArea: { height: 70, textAlignVertical: 'top' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingBottom: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfCol: { width: '48%' },
});
