import { create } from 'zustand';
import { LoginBiometricoUseCase } from '../../application/useCases/LoginBiometricoUseCase';
import { ConfigurarBiometriaUseCase } from '../../application/useCases/ConfigurarBiometriaUseCase';
import { LoginTradicionalUseCase } from '../../application/useCases/LoginTradicionalUseCase';
import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  error: string | null;
  isBiometryAvailable: boolean; // <-- NUEVO

  // Acciones
  loginConHuella: () => Promise<void>;
  vincularHuella: (empleadoId: string, token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loginConPassword: (user: string, pass: string, tokenOpcional?: string) => Promise<{ exito: boolean; empleadoId?: string; token?: string } | { exito: boolean; requiereToken: boolean }>;
  verificarHardwareBiometrico: () => Promise<void>;
}

const loginBiometricoUseCase = new LoginBiometricoUseCase();
const configurarBiometriaUseCase = new ConfigurarBiometriaUseCase();
const loginTradicionalUseCase = new LoginTradicionalUseCase();
const securityAdapter = new SecurityAdapter();

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: false,
  token: null,
  error: null,

  loginConHuella: async () => {
    set({ isLoading: true, error: null });
    const resultado = await loginBiometricoUseCase.ejecutar();

    if (resultado.exito && resultado.token) {
      set({ isAuthenticated: true, token: resultado.token, isLoading: false });
    } else {
      set({ isAuthenticated: false, error: resultado.mensaje, isLoading: false });
    }
  },

  vincularHuella: async (empleadoId: string, token: string) => {
    set({ isLoading: true, error: null });
    const resultado = await configurarBiometriaUseCase.ejecutar(empleadoId, token);

    set({ isLoading: false, error: !resultado.exito ? resultado.mensaje : null });
    return resultado.exito;
  },

  loginConPassword: async (user: string, pass: string, tokenOpcional?: string) => {
    set({ isLoading: true, error: null });
    
    const resultado = await loginTradicionalUseCase.ejecutar(user, pass, tokenOpcional);
    
    if (resultado.exito && resultado.token) {
      set({ isAuthenticated: true, token: resultado.token, isLoading: false });
      
      // DEVOLVEMOS EL ID PARA QUE LA UI PUEDA PREGUNTAR POR LA HUELLA
      return { exito: true, empleadoId: resultado.empleadoId, token: resultado.token };
    } else {
      // Si devuelve NUEVO_DISPOSITIVO, la UI sabrá que debe mostrar el campo del Token
      set({ isAuthenticated: false, error: resultado.mensaje === 'NUEVO_DISPOSITIVO' ? null : resultado.mensaje, isLoading: false });
      return { exito: false, requiereToken: resultado.mensaje === 'NUEVO_DISPOSITIVO' };
    }
  },

  isBiometryAvailable: true, // Asumimos true por defecto hasta que se compruebe

  verificarHardwareBiometrico: async () => {
    const disponible = await securityAdapter.verificarBiometriaDisponible();
    set({ isBiometryAvailable: disponible });
  },

  logout: async () => {
    // Aquí invocamos SecurityAdapter.limpiarCredenciales()
    set({ isAuthenticated: false, token: null, error: null });
  }
}));