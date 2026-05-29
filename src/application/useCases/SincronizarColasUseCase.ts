/* eslint-disable @typescript-eslint/no-unused-vars */
import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';
import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';

export class SincronizarColasUseCase {
  private localDb = new LocalStorageAdapter();
  private security = new SecurityAdapter();

  async ejecutar(): Promise<{ exito: boolean; procesados: number; mensaje: string }> {
    const ventasPendientes = this.localDb.obtenerVentasPendientes() || [];
    const ajustesPendientes = this.localDb.obtenerAjustesStockPendientes() || [];
    const productosPendientes = this.localDb.obtenerProductosPendientes() || [];
    const sucursalesPendientes = this.localDb.obtenerSucursalesPendientes() || [];

    const totalPendientes = ventasPendientes.length + ajustesPendientes.length + productosPendientes.length + sucursalesPendientes.length;

    if (totalPendientes === 0) {
      return { exito: true, procesados: 0, mensaje: 'No hay datos pendientes por subir.' };
    }

    console.log(`⏳ Sincronización Masiva: ${ventasPendientes.length} ventas, ${ajustesPendientes.length} ajustes, ${productosPendientes.length} productos, ${sucursalesPendientes.length} sucursales.`);
    
    let procesados = 0;
    let hubieronErrores = false;

    try {
      const credenciales = await this.security.obtenerCredencialesSilenciosas();
      if (!credenciales) throw new Error('No hay sesión activa para sincronizar la nube.');

      const githubApi = new GitHubApiAdapter(credenciales.githubToken);

      // --- 1. PROCESAR PRODUCTOS PENDIENTES ---
      if (productosPendientes.length > 0) {
        try {
          const FILE_NAME = 'productos.json';
          let listaProductos: any[] = [];
          let fileSha = '';

          try {
            const { data, sha } = await githubApi.getFile<any>(FILE_NAME);
            listaProductos = data.productos || [];
            fileSha = sha;
          } catch (e) {
            console.log(`⚠️ Archivo ${FILE_NAME} no existe. Se creará de cero.`);
          }

          productosPendientes.forEach((prodPending: any) => {
            const idx = listaProductos.findIndex((p: any) => p.sku === prodPending.sku);
            if (idx !== -1) listaProductos[idx] = prodPending;
            else listaProductos.push(prodPending);
          });

          await githubApi.updateFile(FILE_NAME, { productos: listaProductos }, fileSha, `📦 Sync Batch: ${productosPendientes.length} productos actualizados.`);
          
          productosPendientes.forEach((p: any) => this.localDb.removerProductoPendiente(p.sku));
          procesados += productosPendientes.length;
        } catch (error) {
          console.error('❌ Error subiendo productos masivos:', error);
          hubieronErrores = true;
        }
      }

      // --- 2. PROCESAR SUCURSALES PENDIENTES ---
      if (sucursalesPendientes.length > 0) {
        try {
          let listaSucursales: any[] = [];
          let fileSha = '';

          try {
            const { data, sha } = await githubApi.getFile<any>('registro_sucursales.json');
            listaSucursales = data.sucursales || [];
            fileSha = sha;
          } catch (e) {
            console.log('⚠️ Archivo registro_sucursales.json no existe. Se creará de cero.');
          }

          sucursalesPendientes.forEach((sucPending: any) => {
            const idx = listaSucursales.findIndex((s: any) => s.id === sucPending.id);
            if (idx !== -1) listaSucursales[idx] = sucPending;
            else listaSucursales.push(sucPending);
          });

          await githubApi.updateFile('registro_sucursales.json', { sucursales: listaSucursales }, fileSha, `🏢 Sync Batch: ${sucursalesPendientes.length} sucursales actualizadas.`);
          
          // Crear archivos base si es necesario
          for (const suc of sucursalesPendientes) {
            const sufijo = suc.id.replace('suc-', '').replace(/-/g, '_');
            const pathBase = `sucursal_${sufijo}`;
            try { await githubApi.getFile(`${pathBase}/stock_${sufijo}.json`); } 
            catch (e) { await githubApi.updateFile(`${pathBase}/stock_${sufijo}.json`, { sucursal_id: suc.id, stock: [] }, '', `Init stock ${suc.nombre}`); }
            
            try { await githubApi.getFile(`${pathBase}/ventas_${sufijo}.json`); } 
            catch (e) { await githubApi.updateFile(`${pathBase}/ventas_${sufijo}.json`, { sucursal_id: suc.id, ventas: [] }, '', `Init ventas ${suc.nombre}`); }
          }

          sucursalesPendientes.forEach((s: any) => this.localDb.removerSucursalPendiente(s.id));
          procesados += sucursalesPendientes.length;
        } catch (error) {
          console.error('❌ Error subiendo sucursales masivas:', error);
          hubieronErrores = true;
        }
      }

      // --- 3. PROCESAR VENTAS Y AJUSTES DE STOCK (Agrupado por sucursal) ---
      const sucursalesAfectadas = new Set([
        ...ventasPendientes.map((v: any) => v.sucursalId),
        ...ajustesPendientes.map((a: any) => a.sucursalId)
      ]);

      for (const sucursalId of sucursalesAfectadas) {
        const sufijo = sucursalId.replace('suc-', '').replace(/-/g, '_');
        const stockPath = `sucursal_${sufijo}/stock_${sucursalId.replace(/-/g, '_')}.json`;
        const ventasPath = `sucursal_${sufijo}/ventas_${sucursalId.replace(/-/g, '_')}.json`;

        const ventasDeSucursal = ventasPendientes.filter((v: any) => v.sucursalId === sucursalId);
        const ajustesDeSucursal = ajustesPendientes.filter((a: any) => a.sucursalId === sucursalId);

        let sucursalExitosa = true;

        // Actualizar Stock
        if (ventasDeSucursal.length > 0 || ajustesDeSucursal.length > 0) {
          try {
            let stockActual: any[] = [];
            let stockSha = '';
            
            try {
              const { data: stockData, sha } = await githubApi.getFile<any>(stockPath);
              stockActual = stockData.stock || [];
              stockSha = sha;
            } catch (e) { console.log(`⚠️ Archivo de stock para ${sucursalId} no existe. Se creará.`); }

            ventasDeSucursal.forEach((venta: any) => {
              venta.items.forEach((itemVendido: any) => {
                const idx = stockActual.findIndex((s: any) => s.sku === itemVendido.sku);
                if (idx !== -1) stockActual[idx].cantidad = Math.max(0, stockActual[idx].cantidad - itemVendido.cantidad);
              });
            });

            ajustesDeSucursal.forEach((ajuste: any) => {
              const idx = stockActual.findIndex((s: any) => s.sku === ajuste.sku);
              if (idx !== -1) stockActual[idx].cantidad = ajuste.nuevaCantidad;
              else stockActual.push({ sku: ajuste.sku, cantidad: ajuste.nuevaCantidad, minimo: 5 });
            });

            await githubApi.updateFile(stockPath, { sucursal_id: sucursalId, stock: stockActual }, stockSha, `🔄 Sync Batch: Stock actualizado en ${sucursalId}`);
          } catch (error) {
            console.error(`❌ Error en stock de ${sucursalId}`, error);
            sucursalExitosa = false;
            hubieronErrores = true;
          }
        }

        // Actualizar Ventas
        if (ventasDeSucursal.length > 0 && sucursalExitosa) {
          try {
            let ventasActuales: any[] = [];
            let ventasSha = '';
            
            try {
              const { data: ventasData, sha } = await githubApi.getFile<any>(ventasPath);
              ventasActuales = ventasData.ventas || [];
              ventasSha = sha;
            } catch (e) { console.log(`⚠️ Archivo de ventas para ${sucursalId} no existe. Se creará.`); }

            ventasActuales = [...ventasActuales, ...ventasDeSucursal];
            await githubApi.updateFile(ventasPath, { sucursal_id: sucursalId, ventas: ventasActuales }, ventasSha, `🔄 Sync Batch: ${ventasDeSucursal.length} ventas en ${sucursalId}`);
          } catch (error) {
            console.error(`❌ Error en ventas de ${sucursalId}`, error);
            sucursalExitosa = false;
            hubieronErrores = true;
          }
        }

        if (sucursalExitosa) {
          ventasDeSucursal.forEach((v: any) => this.localDb.removerVentaPendiente(v.id));
          ajustesDeSucursal.forEach((a: any) => this.localDb.removerAjusteStockPendiente(a.id));
          procesados += (ventasDeSucursal.length + ajustesDeSucursal.length);
        }
      }

      if (hubieronErrores && procesados === 0) {
         return { exito: false, procesados: 0, mensaje: 'Hubo problemas de conexión al subir los archivos.' };
      }

      return { exito: true, procesados, mensaje: hubieronErrores ? 'Sincronización parcial con errores.' : '¡Todo sincronizado con éxito!' };

    } catch (error) {
      console.error('❌ Fallo crítico en el motor de Sincronización Masiva:', error);
      return { exito: false, procesados: 0, mensaje: 'Fallo crítico de red o sesión.' };
    }
  }
}