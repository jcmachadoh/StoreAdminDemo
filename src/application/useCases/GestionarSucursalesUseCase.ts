import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';
import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';

export class GestionarSucursalesUseCase {
  private security = new SecurityAdapter();
  private localDb = new LocalStorageAdapter();

  async obtenerSucursales(): Promise<{ exito: boolean; data: any[]; mensaje: string }> {
    // 1. CARGA INSTANTÁNEA (OFFLINE FIRST)
    const sucursalesLocales = this.localDb.obtenerSucursales();

    try {
      const credenciales = await this.security.obtenerCredencialesSilenciosas();
      if (!credenciales) throw new Error('Sin sesión');

      // 2. INTENTO DE SINCRONIZACIÓN
      const githubApi = new GitHubApiAdapter(credenciales.githubToken);
      const { data } = await githubApi.getFile<any[]>('sucursales.json');
      
      const sucursalesRemotas = data || [];
      
      // 3. ACTUALIZAR CACHÉ
      this.localDb.guardarSucursales(sucursalesRemotas);
      
      return { exito: true, data: sucursalesRemotas, mensaje: 'Sincronizado' };
    } catch (error: any) {
      // 4. FALLO DE RED -> MODO OFFLINE (No rompemos la app)
      console.log('Modo Offline: Mostrando sucursales en caché. ' + error);
      return { 
        exito: true, // Lo marcamos como éxito para que la UI pinte la lista
        data: sucursalesLocales, 
        mensaje: 'Sin conexión: Mostrando datos locales.' 
      };
    }
  }
}