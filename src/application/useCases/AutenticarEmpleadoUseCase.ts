import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';
import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';

export class AutenticarEmpleadoUseCase {
  private security: SecurityAdapter;
  private localDb: LocalStorageAdapter;

  constructor() {
    this.security = new SecurityAdapter();
    this.localDb = new LocalStorageAdapter();
  }

  /**
   * Flujo de inicio de sesión recurrente (RF11 y RF12)
   */
  async ejecutar(): Promise<{ exito: boolean; mensaje: string; token?: string }> {
    // 1. Pedimos la huella al usuario para desencriptar el Keychain local
    const credenciales = await this.security.obtenerCredencialesConBiometria();
    
    if (!credenciales) {
      return { exito: false, mensaje: 'Autenticación biométrica requerida.' };
    }

    const { empleadoUuid, githubToken } = credenciales;

    // 2. Instanciamos el adaptador de GitHub con el token desencriptado
    const githubApi = new GitHubApiAdapter(githubToken);

    try {
      // 3. Obtenemos el Hash REMOTO desde GitHub (security/empleado_{id}_hash.json)
      const pathRemoto = `security/${empleadoUuid}_hash.json`;
      const archivoRemoto = await githubApi.getFile<any>(pathRemoto);
      const hashRemoto = archivoRemoto.data.hash;

      // 4. Obtenemos el Hash LOCAL (simulado aquí sacándolo de MMKV)
      const hashLocal = this.localDb.obtenerHashSeguridad();

      // 5. RF12: VERIFICACIÓN ANTI-MANIPULACIÓN
      if (hashLocal !== hashRemoto) {
        // Alerta roja: Alguien modificó los archivos locales o remotos sin autorización
        await this.security.limpiarCredenciales();
        this.localDb.limpiarTodo();
        return { 
          exito: false, 
          mensaje: 'Alerta de seguridad: Discrepancia de integridad detectada. Acceso bloqueado.' 
        };
      }

      // 6. ¡Todo en orden! El empleado entra a la app
      return { exito: true, mensaje: 'Bienvenido', token: githubToken };

    } catch (error) {
      // Manejo del modo offline (RNF04)
      console.log('No hay conexión a internet para validar el hash remoto. Permitiendo acceso offline.', error);
      return { exito: true, mensaje: 'Modo Offline activado', token: githubToken };
    }
  }
}