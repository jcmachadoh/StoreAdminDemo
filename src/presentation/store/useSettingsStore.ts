import { create } from 'zustand';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';

type ThemeType = 'light' | 'dark';
type LangType = 'es' | 'en';
type SyncModeType = 'manual' | 'auto';

interface SettingsState {
  theme: ThemeType;
  language: LangType;
  syncMode: SyncModeType;
  syncDelay: number;
  inicializarAjustes: () => void;
  cambiarTema: (nuevoTema: ThemeType) => void;
  cambiarIdioma: (nuevoIdioma: LangType) => void;
  cambiarSyncMode: (mode: SyncModeType) => void;
  cambiarSyncDelay: (delay: number) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'light',
  language: 'es',
  syncMode: 'manual',
  syncDelay: 5,

  inicializarAjustes: () => {
    const localDb = new LocalStorageAdapter();
    const { tema, idioma, syncMode, syncDelay } = localDb.obtenerPreferencias();
    set({ theme: tema, language: idioma, syncMode, syncDelay });
  },

  cambiarTema: (nuevoTema) => {
    const { language, syncMode, syncDelay } = get();
    const localDb = new LocalStorageAdapter();
    localDb.guardarPreferencias(nuevoTema, language, syncMode, syncDelay);
    set({ theme: nuevoTema });
  },

  cambiarIdioma: (nuevoIdioma) => {
    const { theme, syncMode, syncDelay } = get();
    const localDb = new LocalStorageAdapter();
    localDb.guardarPreferencias(theme, nuevoIdioma, syncMode, syncDelay);
    set({ language: nuevoIdioma });
  },

  cambiarSyncMode: (mode) => {
    const { theme, language, syncDelay } = get();
    new LocalStorageAdapter().guardarPreferencias(theme, language, mode, syncDelay);
    set({ syncMode: mode });
  },

  cambiarSyncDelay: (delay) => {
    const { theme, language, syncMode } = get();
    new LocalStorageAdapter().guardarPreferencias(theme, language, syncMode, delay);
    set({ syncDelay: delay });
  }
}));
