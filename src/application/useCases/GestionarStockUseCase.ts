import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';
import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';
import { StockSucursal } from '../../domain/entities/Stock';

export class GestionarStockUseCase {
  private security = new SecurityAdapter();

  // 1. Descarga el stock fresco desde GitHub
  async obtenerStockFresco(sucursalId: string): Promise<{ exito: boolean; data?: StockSucursal; mensaje: string }> {
    try {
      const credenciales = await this.security.obtenerCredencialesSilenciosas();
      if (!credenciales) throw new Error('No hay sesión activa.');

      const githubApi = new GitHubApiAdapter(credenciales.githubToken);
      const stock = await githubApi.obtenerStockPorSucursal(sucursalId);
      
      return { exito: true, data: stock, mensaje: 'Stock descargado.' };
    } catch (error: any) {
      console.error('Error obteniendo stock:', error);
      return { exito: false, mensaje: 'Error al descargar el inventario. Verifica tu conexión.' };
    }
  }

  // 2. Sube los ajustes a GitHub
  async guardarAjusteStock(sucursalId: string, nuevoStock: StockSucursal): Promise<{ exito: boolean; mensaje: string }> {
    try {
      const credenciales = await this.security.obtenerCredencialesSilenciosas();
      if (!credenciales) throw new Error('No hay sesión activa.');

      const githubApi = new GitHubApiAdapter(credenciales.githubToken);
      
      // Subimos a GitHub (El adaptador ya maneja el SHA que le pasamos en nuevoStock)
      await githubApi.actualizarStock(sucursalId, nuevoStock);

      return { exito: true, mensaje: '¡Inventario actualizado correctamente en la nube!' };
    } catch (error: any) {
      console.error('Error guardando stock:', error);
      // RF35: Si el SHA no coincide, GitHub lanzará un error 409 Conflict
      if (error.response?.status === 409) {
        return { exito: false, mensaje: 'Conflicto: Alguien más modificó el stock mientras editabas. Vuelve a cargar la pantalla.' };
      }
      return { exito: false, mensaje: 'Error al guardar los cambios en la nube.' };
    }
  }
}