/* eslint-disable @typescript-eslint/no-unused-vars */
import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';
import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';

export class ObtenerReporteGlobalUseCase {
  private security = new SecurityAdapter();
  private localDb = new LocalStorageAdapter();

  async ejecutar(sincronizarNube: boolean = false): Promise<{ exito: boolean; data: any; mensaje: string }> {
    // Obtenemos solo las sucursales que están activas
    const sucursales = this.localDb.obtenerSucursales().filter((s: any) => s.activa);
    let todasLasVentas: any[] = [];

    // --- 1. OBTENCIÓN DE DATOS (NUBE vs LOCAL) ---
    if (sincronizarNube) {
      try {
        const credenciales = await this.security.obtenerCredencialesSilenciosas();
        if (!credenciales) throw new Error('Sin sesión');
        const githubApi = new GitHubApiAdapter(credenciales.githubToken);

        // Descargamos las ventas de TODAS las sucursales en paralelo para máxima velocidad
        const promesasVentas = sucursales.map(async (suc) => {
          const sufijo = suc.id.replace('suc-', '').replace(/-/g, '_');
          const path = `sucursal_${sufijo}/ventas_${suc.id.replace(/-/g, '_')}.json`;
          try {
            const { data } = await githubApi.getFile<any>(path);
            const ventasRemotas = data.ventas || [];
            // Actualizamos la caché local de esta sucursal específica
            this.localDb.guardarVentasSucursal(suc.id, ventasRemotas);
            return ventasRemotas;
          } catch (e) {
            // Si una sucursal no tiene archivo de ventas aún, no rompemos el proceso
            return this.localDb.obtenerVentasSucursal(suc.id) || [];
          }
        });

        const resultados = await Promise.all(promesasVentas);
        todasLasVentas = resultados.flat(); // Unimos todos los arrays en uno solo
      } catch (error) {
        return { exito: false, data: null, mensaje: 'Error al conectar con GitHub.' };
      }
    } else {
      // MODO OFFLINE: Leemos la caché de todas las sucursales al instante
      sucursales.forEach((suc) => {
        const ventasSuc = this.localDb.obtenerVentasSucursal(suc.id) || [];
        todasLasVentas = [...todasLasVentas, ...ventasSuc];
      });
      
      // Sumamos las ventas que están en la cola de espera del teléfono
      const ventasPendientes = this.localDb.obtenerVentasPendientes() || [];
      todasLasVentas = [...todasLasVentas, ...ventasPendientes];
    }

    // --- 2. CÁLCULO DE MÉTRICAS GLOBALES ---
    let ingresosTotales = 0;
    const ventasPorSucursal: Record<string, { nombre: string, total: number, cantidadVentas: number }> = {};
    const ventasPorProducto: Record<string, { nombre: string, cantidad: number, totalMonto: number }> = {};

    // Inicializamos el diccionario de sucursales para que salgan incluso si tienen $0
    sucursales.forEach(s => {
      ventasPorSucursal[s.id] = { nombre: s.nombre, total: 0, cantidadVentas: 0 };
    });

    todasLasVentas.forEach((venta: any) => {
      ingresosTotales += venta.total;
      
      // Acumulamos por Sucursal
      if (ventasPorSucursal[venta.sucursalId]) {
        ventasPorSucursal[venta.sucursalId].total += venta.total;
        ventasPorSucursal[venta.sucursalId].cantidadVentas += 1;
      }

      // Acumulamos por Producto
      venta.items?.forEach((item: any) => {
        if (!ventasPorProducto[item.sku]) {
          ventasPorProducto[item.sku] = { nombre: item.nombre, cantidad: 0, totalMonto: 0 };
        }
        ventasPorProducto[item.sku].cantidad += item.cantidad;
        ventasPorProducto[item.sku].totalMonto += item.subtotal;
      });
    });

    // Convertimos diccionarios en arrays y los ordenamos (Ranking)
    const rankingSucursales = Object.values(ventasPorSucursal).sort((a, b) => b.total - a.total);
    const topProductos = Object.values(ventasPorProducto).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10); // Solo el Top 10

    return {
      exito: true,
      data: { ingresosTotales, rankingSucursales, topProductos },
      mensaje: sincronizarNube ? 'Sincronizado con GitHub' : 'Datos Locales'
    };
  }
}