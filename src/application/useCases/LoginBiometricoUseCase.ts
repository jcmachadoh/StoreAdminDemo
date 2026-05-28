import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';
import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';

export class LoginBiometricoUseCase {
  private security: SecurityAdapter;
  private localDb: LocalStorageAdapter;

  constructor() {
    this.security = new SecurityAdapter();
    this.localDb = new LocalStorageAdapter();
  }

  async ejecutar(): Promise<{ exito: boolean; mensaje: string; token?: string }> {
    // 1. RF11: Solicitamos la huella para abrir el Keychain local y sacar el Token de GitHub
    console.log('Esperando huella dactilar...');
    const credenciales = await this.security.obtenerCredencialesConBiometria();
    
    if (!credenciales) {
      return { exito: false, mensaje: 'Autenticación biométrica requerida para entrar.' };
    }

    const { empleadoUuid, githubToken } = credenciales;
    const githubApi = new GitHubApiAdapter(githubToken);

    try {
      // 2. RF12: VERIFICACIÓN ANTI-MANIPULACIÓN
      console.log('Validando integridad del dispositivo...');
      
      const pathRemoto = `security/${empleadoUuid}_hash.json`;
      const archivoRemoto = await githubApi.getFile<any>(pathRemoto);
      const hashRemoto = archivoRemoto.data.hash;

      const seguridadLocal = this.localDb.obtenerHashSeguridad();

      if (!seguridadLocal || seguridadLocal.hash !== hashRemoto) {
        // ¡Alerta roja! El hash de GitHub no coincide con el local.
        // Alguien borró los datos locales o intentó inyectar un archivo falso en GitHub.
        console.warn('⚠️ DISCREPANCIA DE SEGURIDAD DETECTADA ⚠️');
        await this.security.limpiarCredenciales();
        this.localDb.limpiarTodo();
        
        return { 
          exito: false, 
          mensaje: 'Se detectó un cambio no autorizado en la seguridad del dispositivo. Por protección, tu acceso ha sido revocado. Vuelve a iniciar sesión con tu contraseña.' 
        };
      }

      // 3. ¡Todo coincide! Recuperamos los datos del empleado de la caché ultrarrápida
      const empleadoCache = this.localDb.obtenerDatosEmpleadoLogueado();

      console.log(`🔓 Acceso concedido a ${empleadoCache?.nombre || empleadoUuid}`);
      return { exito: true, mensaje: 'Bienvenido de nuevo', token: githubToken };

    } catch (error: any) {
      // RNF04 & RF06: MODO OFFLINE
      // Si falla porque no hay internet (Network Error), le dejamos entrar confiando en el Keychain
      if (error.message.includes('Network') || error.code === 'ERR_NETWORK') {
        console.log('Sin conexión a GitHub. Habilitando MODO OFFLINE seguro.');
        return { exito: true, mensaje: 'Sesión iniciada en modo offline', token: githubToken };
      }
      
      return { exito: false, mensaje: 'Error al verificar credenciales con el servidor.' };
    }
  }
}