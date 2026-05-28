import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';
import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';

export class GuardarProductoUseCase {
  private security = new SecurityAdapter();
  private localDb = new LocalStorageAdapter();

  async ejecutar(
    productoData: any, 
    esEdicion: boolean, 
    sucursalId: string, 
    stockInicial: number = 0, 
    stockMinimo: number = 5
  ): Promise<{ exito: boolean; mensaje: string }> {
    try {
      const credenciales = await this.security.obtenerCredencialesSilenciosas();
      if (!credenciales) throw new Error('No hay sesión activa.');

      const githubApi = new GitHubApiAdapter(credenciales.githubToken);

      // 1. DESCARGAMOS Y ACTUALIZAMOS CATÁLOGO MAESTRO
      const { data, sha } = await githubApi.getFile<any>('productos.json');
      let productosActuales = data.productos || [];

      let skuFinal = productoData.sku;

      if (esEdicion) {
        productosActuales = productosActuales.map((p: any) => p.sku === skuFinal ? { ...p, ...productoData } : p);
        await githubApi.updateFile('productos.json', { productos: productosActuales }, sha, `✏️ Producto editado: ${productoData.nombre}`);
      } else {
        skuFinal = `prod-${Math.random().toString(36).substring(2, 15)}`;
        const nuevoProducto = { ...productoData, sku: skuFinal, activo: true };
        productosActuales.push(nuevoProducto);
        await githubApi.updateFile('productos.json', { productos: productosActuales }, sha, `📦 Nuevo producto agregado: ${nuevoProducto.nombre}`);
        
        // 2. SI ES NUEVO, AGREGAMOS EL STOCK A LA SUCURSAL DEL EMPLEADO
        try {
          const stockPath = `sucursal_${sucursalId.replace('suc-', '')}/stock_${sucursalId.replace('-', '_')}.json`; 
          // Ajusta el path exacto según tu estructura, ej: "sucursal_centro/stock_sucursal_centro.json"
          
          const { data: stockData, sha: stockSha } = await githubApi.getFile<any>(stockPath);
          stockData.stock.push({ sku: skuFinal, cantidad: stockInicial, minimo: stockMinimo });
          await githubApi.updateFile(stockPath, stockData, stockSha, `📥 Stock inicial seteado para ${skuFinal}`);
        } catch (error) {
          console.error('Error actualizando stock inicial, pero el producto se creó.', error);
        }
      }

      this.localDb.guardarProductos(productosActuales);
      return { exito: true, mensaje: esEdicion ? 'Producto actualizado correctamente' : 'Producto y stock creados exitosamente' };
    } catch (error: any) {
      console.error('Error en GuardarProductoUseCase:', error);
      return { exito: false, mensaje: 'Error de conexión con la base de datos (GitHub).' };
    }
  }
}