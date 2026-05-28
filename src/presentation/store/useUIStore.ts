import { create } from 'zustand';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface UIState {
  alertVisible: boolean;
  alertType: AlertType;
  alertTitle: string;
  alertMessage: string;
  
  showAlert: (type: AlertType, title: string, message: string) => void;
  hideAlert: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  alertVisible: false,
  alertType: 'info',
  alertTitle: '',
  alertMessage: '',

  showAlert: (type, title, message) => {
    set({ alertVisible: true, alertType: type, alertTitle: title, alertMessage: message });
    // Ocultar automáticamente después de 3.5 segundos
    setTimeout(() => {
      set({ alertVisible: false });
    }, 3500);
  },
  
  hideAlert: () => set({ alertVisible: false })
}));