import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';
import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';

export class SincronizarCatalogoUseCase {
  private localDb = new LocalStorageAdapter();
  private security = new SecurityAdapter();

  async ejecutar(): Promise<{ exito: boolean; mensaje: string }> {
    try {
      const credenciales = await this.security.obtenerCredencialesSilenciosas();
      if (!credenciales) return { exito: false, mensaje: 'No hay sesión activa.' };

      const githubApi = new GitHubApiAdapter(credenciales.githubToken);

      console.log('⏳ Sincronizando Ecosistema POS completo...');
      
      // DESCARGAMOS TODO EN PARALELO
      const [productos, categorias, roles, sucursalesRes, empleadosRes] = await Promise.all([
        githubApi.obtenerProductos(),
        githubApi.obtenerCategorias(),
        githubApi.obtenerRoles(),
        githubApi.getFile<any[]>('sucursales.json').catch(() => ({ data: [] })),
        githubApi.getFile<any>('registro_empleados.json').catch(() => ({ data: { empleados: [] } }))
      ]);

      // GUARDAMOS TODO EN LA MEMORIA ULTRARRÁPIDA (MMKV)
      this.localDb.guardarProductos(productos);
      this.localDb.guardarCategorias(categorias);
      this.localDb.guardarRoles(roles);
      this.localDb.guardarSucursales(sucursalesRes.data || []);
      this.localDb.guardarEmpleados(empleadosRes.data?.empleados || []);

      console.log(`✅ Ecosistema sincronizado y guardado para uso Offline.`);
      return { exito: true, mensaje: 'Sincronizado' };
      
    } catch (error: any) {
      console.error('❌ Error sincronizando:', error);
      return { exito: false, mensaje: 'Modo Offline Activo' };
    }
  }
}