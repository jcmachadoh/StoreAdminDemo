const translationsMap = {
  es: {
    settingsTitle: 'Ajustes de Aplicación',
    language: 'Idioma',
    spanish: 'Español',
    english: 'Inglés',
    theme: 'Tema Visual',
    lightMode: 'Modo Claro',
    darkMode: 'Modo Oscuro',
    sync: 'Sincronización con la Nube',
    syncManual: 'Manual (Icono en el menú)',
    syncAuto: 'Automática (En segundo plano)',
    syncDelayLabel: 'Retardo al recuperar conexión (Segundos):',
    save: 'Guardar Cambios',
    back: 'Volver',
    posTitle: 'Punto de Venta',
    charge: 'Cobrar',
  },
  en: {
    settingsTitle: 'Application Settings',
    language: 'Language',
    spanish: 'Spanish',
    english: 'English',
    theme: 'Visual Theme',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    sync: 'Cloud Synchronization',
    syncManual: 'Manual (Menu icon)',
    syncAuto: 'Automatic (Background)',
    syncDelayLabel: 'Delay after reconnecting (Seconds):',
    save: 'Save Changes',
    back: 'Back',
    posTitle: 'Point of Sale',
    charge: 'Charge',
  },
} as const;

export type Translations = (typeof translationsMap)['es'];
export const translations: Record<string, Translations> = translationsMap as unknown as Record<string, Translations>;
