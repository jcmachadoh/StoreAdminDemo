import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';
import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';

export interface AjusteStockData {
  sucursalId: string;
  sku: string;
  nuevaCantidad: number;
  motivo: string;
}

export class AjustarStockUseCase {
  private security = new SecurityAdapter();
  private localDb = new LocalStorageAdapter();

  async ejecutar(data: AjusteStockData): Promise<{ exito: boolean; mensaje: string }> {
    try {
      const nuevoAjuste = {
        id: `ajuste-${Date.now()}`,
        fecha: new Date().toISOString(),
        ...data
      };

      // 1. GUARDAMOS EN LA COLA DE ESPERA
      this.localDb.guardarAjusteStockPendiente(nuevoAjuste);

      // 2. CORRECCIÓN DEL TIPO: Extraemos el array sin importar la estructura
      const stockLocalRaw: any = this.localDb.obtenerStockSucursal(data.sucursalId) || [];
      const stockArray: any[] = Array.isArray(stockLocalRaw) ? stockLocalRaw : (stockLocalRaw.stock || []);

      const indexLocal = stockArray.findIndex((s: any) => s.sku === data.sku);
      
      if (indexLocal !== -1) {
        stockArray[indexLocal].cantidad = data.nuevaCantidad;
        
        // Lo volvemos a guardar respetando la estructura original
        if (!Array.isArray(stockLocalRaw)) {
          stockLocalRaw.stock = stockArray;
          this.localDb.guardarStockSucursal(data.sucursalId, stockLocalRaw);
        } else {
          this.localDb.guardarStockSucursal(data.sucursalId, stockArray);
        }
      } else {
        // Si no existía en stock local, lo agregamos
        stockArray.push({ sku: data.sku, cantidad: data.nuevaCantidad, minimo: 5 });
        this.localDb.guardarStockSucursal(data.sucursalId, Array.isArray(stockLocalRaw) ? stockArray : { ...stockLocalRaw, stock: stockArray });
      }

      // 3. BACKGROUND COMMIT AL REPOSITORIO
      this.sincronizarEnSegundoPlano(nuevoAjuste).catch(err => {
        console.log('Modo Offline: Ajuste guardado localmente de forma segura.', err);
      });

      return { exito: true, mensaje: 'Ajuste aplicado exitosamente.' };

    } catch (error) {
        console.log(error);
        
      return { exito: false, mensaje: 'Error al procesar el ajuste en memoria.' };
    }
  }

  private async sincronizarEnSegundoPlano(ajuste: any) {
    const credenciales = await this.security.obtenerCredencialesSilenciosas();
    if (!credenciales) return;

    const githubApi = new GitHubApiAdapter(credenciales.githubToken);
    const sufijo = ajuste.sucursalId.replace('suc-', '').replace(/-/g, '_');
    const stockPath = `sucursal_${sufijo}/stock_${ajuste.sucursalId.replace(/-/g, '_')}.json`;

    try {
      const { data: fileData, sha } = await githubApi.getFile<any>(stockPath);
      const stockActual = fileData.stock || [];

      const index = stockActual.findIndex((s: any) => s.sku === ajuste.sku);
      if (index !== -1) {
        stockActual[index].cantidad = ajuste.nuevaCantidad;
      } else {
        stockActual.push({ sku: ajuste.sku, cantidad: ajuste.nuevaCantidad, minimo: 5 });
      }

      await githubApi.updateFile(
        stockPath, 
        { ...fileData, stock: stockActual }, 
        sha, 
        `🔧 Ajuste Stock: ${ajuste.sku} -> ${ajuste.nuevaCantidad} (${ajuste.motivo})`
      );

      this.localDb.removerAjusteStockPendiente(ajuste.id);
    } catch (error) {
      console.error('Error sincronizando ajuste con GitHub:', error);
    }
  }
}