import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';

// Importación de Pantallas
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ActivationScreen } from '../screens/auth/ActivationScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { AjusteStockScreen } from '../screens/inventario/AjusteStockScreen';
import { MaestroArticulosScreen } from '../screens/inventario/MaestroArticulosScreen';
import { FormularioProductoScreen } from '../screens/inventario/FormularioProductoScreen';
import { GestionarSucursalesScreen } from '../screens/propietario/GestionarSucursalesScreen';
import { FormularioSucursalScreen } from '../screens/propietario/FormularioSucursalScreen';
import { FormularioEmpleadoScreen } from '../screens/propietario/FormularioEmpleadoScreen';
import { ListaEmpleadosScreen } from '../screens/propietario/ListaEmpleadosScreen';
import { PosScreen } from '../screens/empleado/PosScreen';
import { HistorialVentasScreen } from '../screens/shared/HistorialVentasScreen';
import { AjustesScreen } from '../screens/shared/AjustesScreen';
import { MiSucursalScreen } from '../screens/sucursal/MiSucursalScreen';
import { ReporteGlobalScreen } from '../screens/propietario/ReporteGlobalScreen';

// Definición de las rutas del Stack
export type RootStackParamList = {
  LoginScreen: undefined;
  ActivationScreen: undefined;
  DashboardScreen: undefined;
  AjusteStockScreen: undefined;
  MaestroArticulosScreen: undefined;
  FormularioProductoScreen: undefined;
  GestionarSucursalesScreen: undefined;
  FormularioSucursalScreen: undefined;
  FormularioEmpleadoScreen: undefined;
  ListaEmpleadosScreen: undefined;
  PosScreen: undefined;
  HistorialVentasScreen: undefined;
  MiSucursalScreen: undefined;
  ReporteGlobalScreen: undefined;
  AjustesScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigation = () => {
  // El navegador escucha de forma reactiva el estado global de autenticación
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // --- FLUJO PÚBLICO (Autenticación / Activación) ---
        <>
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="ActivationScreen" component={ActivationScreen} />
        </>
      ) : (
        // --- FLUJO PRIVADO (Sistema Interno del Admin) ---
        <>
          <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
          <Stack.Screen name="AjusteStockScreen" component={AjusteStockScreen} />
          <Stack.Screen name="MaestroArticulosScreen" component={MaestroArticulosScreen} />
          <Stack.Screen name="FormularioProductoScreen" component={FormularioProductoScreen} />
          <Stack.Screen name="GestionarSucursalesScreen" component={GestionarSucursalesScreen} />
          <Stack.Screen name="FormularioSucursalScreen" component={FormularioSucursalScreen} />
          <Stack.Screen name="FormularioEmpleadoScreen" component={FormularioEmpleadoScreen} />
          <Stack.Screen name="ListaEmpleadosScreen" component={ListaEmpleadosScreen} />
          <Stack.Screen name="PosScreen" component={PosScreen} />
          <Stack.Screen name="HistorialVentasScreen" component={HistorialVentasScreen} />
          <Stack.Screen name="MiSucursalScreen" component={MiSucursalScreen} />
          <Stack.Screen name="ReporteGlobalScreen" component={ReporteGlobalScreen} />
          <Stack.Screen name="AjustesScreen" component={AjustesScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

