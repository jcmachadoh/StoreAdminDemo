import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useSettingsStore } from '../store/useSettingsStore';
import { SincronizarColasUseCase } from '../../application/useCases/SincronizarColasUseCase';
import { useUIStore } from '../store/useUIStore';

export const useVigilanteRed = () => {
  const { syncMode, syncDelay } = useSettingsStore();
  const { showAlert } = useUIStore();
  // Inicializamos en null para que registre bien el primer cambio
  const previoConectado = useRef<boolean | null>(null); 

  useEffect(() => {
    if (syncMode !== 'auto') {
      console.log('🛑 Vigilante apagado (Modo Manual)');
      return;
    }

    console.log('👀 Vigilante de red activado...');

    const unsubscribe = NetInfo.addEventListener(state => {
      console.log(`📡 [NetInfo] Estado actual -> Conectado: ${state.isConnected}`);

      // Si estábamos desconectados (false) y ahora estamos conectados (true)
      if (state.isConnected === true && previoConectado.current === false) {
        console.log(`🌐 ¡Conexión recuperada! Esperando ${syncDelay} segundos para sincronizar...`);
        
        setTimeout(async () => {
          const syncEngine = new SincronizarColasUseCase();
          const result = await syncEngine.ejecutar();
          if (result.procesados > 0) {
            showAlert('success', 'Sincronización Automática', `Se subieron ${result.procesados} elementos a la nube.`);
          } else if (!result.exito) {
            // Opcional: Mostrar si hubo error de conexión durante el intento
            console.log('Error en la sincronización automática de fondo.');
          }
        }, syncDelay * 1000);
      }
      
      // Actualizamos el registro de estado (ignorando los nulls iniciales de Android)
      if (state.isConnected !== null) {
        previoConectado.current = state.isConnected;
      }
    });

    return () => unsubscribe();
  }, [syncMode, syncDelay, showAlert]);
};