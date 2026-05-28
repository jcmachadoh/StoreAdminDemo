import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';
import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';

export class ObtenerEmpleadosUseCase {
  private security = new SecurityAdapter();
  private localDb = new LocalStorageAdapter();

  async ejecutar(): Promise<{ exito: boolean; data: any[]; mensaje: string }> {
    // 1. CARGA INSTANTÁNEA (OFFLINE FIRST)
    const empleadosLocales = this.localDb.obtenerEmpleados();

    try {
      const credenciales = await this.security.obtenerCredencialesSilenciosas();
      if (!credenciales) throw new Error('Sin sesión');

      // 2. INTENTO DE SINCRONIZACIÓN
      const githubApi = new GitHubApiAdapter(credenciales.githubToken);
      const { data } = await githubApi.getFile<any>('registro_empleados.json');
      
      const empleadosRemotos = data.empleados || [];
      
      // 3. ACTUALIZAR CACHÉ
      this.localDb.guardarEmpleados(empleadosRemotos);
      
      return { exito: true, data: empleadosRemotos, mensaje: 'Sincronizado' };
    } catch (error: any) {
      // 4. FALLO DE RED -> MODO OFFLINE
      console.log('Modo Offline: Mostrando empleados en caché. ' + error);
      return { 
        exito: true, 
        data: empleadosLocales, 
        mensaje: 'Sin conexión: Mostrando datos locales.' 
      };
    }
  }
}