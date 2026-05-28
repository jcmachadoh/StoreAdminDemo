import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';
import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';

export class GuardarSucursalUseCase {
  private security = new SecurityAdapter();

  async ejecutar(sucursalData: any, esEdicion: boolean): Promise<{ exito: boolean; mensaje: string }> {
    try {
      const credenciales = await this.security.obtenerCredencialesSilenciosas();
      if (!credenciales) throw new Error('No hay sesión activa.');

      const githubApi = new GitHubApiAdapter(credenciales.githubToken);

      // 1. Descargamos el listado actual
      const { data, sha } = await githubApi.getFile<any[]>('sucursales.json');
      let sucursalesActuales = data || [];

      if (esEdicion) {
        // MODO EDICIÓN: Reemplazamos la sucursal existente
        sucursalesActuales = sucursalesActuales.map((s: any) =>
          s.id === sucursalData.id ? { ...s, ...sucursalData } : s
        );
        await githubApi.updateFile('sucursales.json', sucursalesActuales, sha, `🏢 Sucursal actualizada: ${sucursalData.nombre}`);
        
        return { exito: true, mensaje: '¡Datos de la sucursal actualizados!' };
      } else {
        // MODO CREACIÓN: Generamos el ID y la añadimos
        const idBase = sucursalData.nombre.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 6);
        const sucursalId = `suc-${idBase}-${Math.floor(Math.random() * 1000)}`;

        const sucursalFinal = {
          id: sucursalId,
          ...sucursalData,
          activa: true
        };

        sucursalesActuales.push(sucursalFinal);
        await githubApi.updateFile('sucursales.json', sucursalesActuales, sha, `🏢 Nueva sucursal agregada: ${sucursalFinal.nombre}`);

        // Creamos su almacén físico
        try {
          const sufijo = sucursalId.replace('suc-', '').replace(/-/g, '_');
          const stockPath = `sucursal_${sufijo}/stock_${sucursalId.replace(/-/g, '_')}.json`;
          await githubApi.updateFile(stockPath, { sucursal_id: sucursalId, stock: [] }, '', `📦 Inicialización de almacén para ${sucursalFinal.nombre}`);
        } catch (e) {
          console.warn('Aviso: El archivo de stock no se pudo inicializar en este paso. ' + e);
        }

        return { exito: true, mensaje: '¡Sucursal construida y almacén inicializado!' };
      }
    } catch (error: any) {
      console.error('Error guardando sucursal:', error);
      return { exito: false, mensaje: 'Error al comunicarse con GitHub. Revisa tu conexión.' };
    }
  }
}