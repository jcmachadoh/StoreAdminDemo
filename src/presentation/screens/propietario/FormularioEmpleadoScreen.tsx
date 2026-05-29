import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useUIStore } from '../../store/useUIStore';
import { AltaEmpleadoUseCase } from '../../../application/useCases/AltaEmpleadoUseCase';
import { GestionarSucursalesUseCase } from '../../../application/useCases/GestionarSucursalesUseCase';
import { LocalStorageAdapter } from '../../../infrastructure/storage/LocalStorageAdapter';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  ScreenLayout,
  Header,
  Button,
  FullScreenLoader,
} from '../../components/shared';

export const FormularioEmpleadoScreen = ({ navigation }: any) => {
  const { showAlert } = useUIStore();
  const { colors, spacing, radii } = useAppTheme();
  const localDb = new LocalStorageAdapter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [sucursales, setSucursales] = useState<any[]>([]);
  const [rolesMaestros, setRolesMaestros] = useState<any[]>([]);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');
  const [rolesSeleccionados, setRolesSeleccionados] = useState<string[]>([]);

  useEffect(() => {
    const inicializar = async () => {
      setRolesMaestros(localDb.obtenerRoles());
      const sucursalesUseCase = new GestionarSucursalesUseCase();
      const resultado = await sucursalesUseCase.obtenerSucursales();
      if (resultado.exito) {
        setSucursales(resultado.data.filter((s: any) => s.activa));
      } else {
        showAlert('error', 'Error', 'No se pudieron cargar las sucursales.');
      }
      setIsLoading(false);
    };
    inicializar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleRol = (rolId: string) => {
    if (rolesSeleccionados.includes(rolId)) {
      setRolesSeleccionados(rolesSeleccionados.filter(id => id !== rolId));
    } else {
      setRolesSeleccionados([...rolesSeleccionados, rolId]);
    }
  };

  const handleGuardar = async () => {
    if (!nombre || !email || !sucursalSeleccionada || rolesSeleccionados.length === 0) {
      showAlert('warning', 'Faltan datos', 'Completa todos los campos y selecciona al menos un rol.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('error', 'Email inválido', 'Introduce un correo real.');
      return;
    }

    setIsSaving(true);
    const useCase = new AltaEmpleadoUseCase();
    const resultado = await useCase.ejecutar({
      nombre,
      email,
      sucursalId: sucursalSeleccionada,
      rolesIds: rolesSeleccionados,
    });
    setIsSaving(false);

    if (resultado.exito) {
      showAlert('success', '¡Contratación Exitosa!', resultado.mensaje);
      navigation.goBack();
    } else {
      showAlert('error', 'Error', resultado.mensaje);
    }
  };

  if (isLoading) return <FullScreenLoader mensaje="Cargando estructura de la empresa..." />;
  if (isSaving) return <FullScreenLoader mensaje="Registrando nuevo empleado..." />;

  return (
    <ScreenLayout>
      <Header
        title="Alta de Personal"
        onBack={() => navigation.goBack()}
        backLabel="Cancelar"
        backColor="danger"
      />

      <ScrollView
        contentContainerStyle={[styles.formContainer, { padding: spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: colors.warningLight,
              borderColor: colors.warning,
              borderRadius: radii.sm,
            },
          ]}
        >
          <Text style={[styles.infoText, { color: colors.warningText }]}>
            Crea el perfil del empleado. Deberás informarle que ingrese a la app con su
            Token para activar su cuenta.
          </Text>
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Nombre Completo *
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
          placeholder="Ej: Ana López"
          placeholderTextColor={colors.textMuted}
          value={nombre}
          onChangeText={setNombre}
          accessibilityLabel="Nombre completo del empleado"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Correo Electrónico *
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
          placeholder="ana@tienda.com"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          accessibilityLabel="Correo electrónico del empleado"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Asignar a Sucursal *
        </Text>
        <View style={styles.chipsContainer}>
          {sucursales.map(suc => (
            <TouchableOpacity
              key={suc.id}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    sucursalSeleccionada === suc.id
                      ? colors.primary
                      : colors.surfaceInset,
                  borderColor:
                    sucursalSeleccionada === suc.id
                      ? colors.primary
                      : colors.border,
                  borderRadius: radii.xl,
                },
              ]}
              onPress={() => setSucursalSeleccionada(suc.id)}
              accessibilityRole="button"
              accessibilityLabel={`Sucursal ${suc.nombre}`}
            >
              <Text
                style={{
                  color:
                    sucursalSeleccionada === suc.id
                      ? '#ffffff'
                      : colors.textSecondary,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {suc.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Permisos del Sistema (Roles) *
        </Text>
        <View style={styles.chipsContainer}>
          {rolesMaestros.map(rol => (
            <TouchableOpacity
              key={rol.id}
              style={[
                styles.chip,
                {
                  backgroundColor: rolesSeleccionados.includes(rol.id)
                    ? colors.primary
                    : colors.surfaceInset,
                  borderColor: rolesSeleccionados.includes(rol.id)
                    ? colors.primary
                    : colors.border,
                  borderRadius: radii.xl,
                },
              ]}
              onPress={() => toggleRol(rol.id)}
              accessibilityRole="button"
              accessibilityLabel={`Rol ${rol.nombre}`}
            >
              <Text
                style={{
                  color: rolesSeleccionados.includes(rol.id)
                    ? '#ffffff'
                    : colors.textSecondary,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {rol.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Registrar Empleado"
          onPress={handleGuardar}
          variant="primary"
          style={{ marginTop: spacing.xxl }}
          accessibilityLabel="Registrar nuevo empleado"
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
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 9, marginRight: 8, marginBottom: 8, borderWidth: 1 },
});
