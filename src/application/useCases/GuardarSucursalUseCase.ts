/* eslint-disable @typescript-eslint/no-unused-vars */
import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';
import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';

export class CrearSucursalUseCase {
  private security = new SecurityAdapter();
  private localDb = new LocalStorageAdapter();

  async ejecutar(nuevaSucursal: any): Promise<{ exito: boolean; mensaje: string }> {
    try {
      // 1. GUARDAMOS EN LA COLA PENDIENTE
      this.localDb.guardarSucursalPendiente(nuevaSucursal);

      // 2. ACTUALIZAMOS LA LISTA LOCAL (Para efecto visual inmediato Offline)
      const sucursalesActuales = this.localDb.obtenerSucursales() || [];
      const index = sucursalesActuales.findIndex((s: any) => s.id === nuevaSucursal.id);
      
      if (index !== -1) {
        sucursalesActuales[index] = nuevaSucursal; // Es una edición
      } else {
        sucursalesActuales.push(nuevaSucursal); // Es una creación
      }
      this.localDb.guardarSucursales(sucursalesActuales);

      // 3. INTENTO DE SINCRONIZACIÓN EN SEGUNDO PLANO
      this.sincronizarEnSegundoPlano(nuevaSucursal).catch(err => {
        console.log('Modo Offline: Sucursal guardada localmente.', err);
      });

      return { exito: true, mensaje: 'Sucursal guardada localmente.' };
    } catch (error) {
      return { exito: false, mensaje: 'Error al guardar la sucursal en memoria.' };
    }
  }

  private async sincronizarEnSegundoPlano(sucursal: any) {
    const credenciales = await this.security.obtenerCredencialesSilenciosas();
    if (!credenciales) return;

    const githubApi = new GitHubApiAdapter(credenciales.githubToken);
    
    // 1. Actualizar registro principal de sucursales
    const { data: sucursalesData, sha: sucursalesSha } = await githubApi.getFile<any>('registro_sucursales.json');
    let listaNube = sucursalesData.sucursales || [];
    
    const idx = listaNube.findIndex((s: any) => s.id === sucursal.id);
    if (idx !== -1) listaNube[idx] = sucursal;
    else listaNube.push(sucursal);

    await githubApi.updateFile('registro_sucursales.json', { sucursales: listaNube }, sucursalesSha, `🏢 Administrador: Sucursal ${sucursal.id} guardada.`);

    // 2. Crear archivos base si es nueva (Omitir si fallan porque ya existen)
    const sufijo = sucursal.id.replace('suc-', '').replace(/-/g, '_');
    const pathBase = `sucursal_${sufijo}`;
    
    try {
      await githubApi.getFile(`${pathBase}/stock_${sufijo}.json`);
    } catch (e) {
      await githubApi.updateFile(`${pathBase}/stock_${sufijo}.json`, { sucursal_id: sucursal.id, stock: [] }, '', `Inicializando stock para ${sucursal.nombre}`);
    }

    try {
      await githubApi.getFile(`${pathBase}/ventas_${sufijo}.json`);
    } catch (e) {
      await githubApi.updateFile(`${pathBase}/ventas_${sufijo}.json`, { sucursal_id: sucursal.id, ventas: [] }, '', `Inicializando historial de ventas para ${sucursal.nombre}`);
    }

    // 3. Limpiar de la cola local
    this.localDb.removerSucursalPendiente(sucursal.id);
    console.log(`✅ Sucursal ${sucursal.id} sincronizada en la nube.`);
  }
}