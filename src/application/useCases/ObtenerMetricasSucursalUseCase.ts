import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';
import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';

export class ObtenerMetricasSucursalUseCase {
  private security = new SecurityAdapter();
  private localDb = new LocalStorageAdapter();

  async ejecutar(sucursalId: string): Promise<{ exito: boolean; data: any; mensaje: string }> {
    // 1. LECTURAS LOCALES INMEDIATAS (Offline-First)
    const empleadosLocales = this.localDb.obtenerEmpleados();
    const ventasLocales = this.localDb.obtenerVentasSucursal(sucursalId) || [];
    const ventasPendientes = this.localDb.obtenerVentasPendientes() || [];
    const stockLocal = this.localDb.obtenerStockSucursal(sucursalId) || [];

    const calcularMetricas = (empleados: any[], ventas: any[], stock: any[]) => {
      // Filtrar empleados de esta sucursal
      const misEmpleados = empleados.filter((e: any) => e.sucursal === sucursalId);
      
      // Filtrar ventas de HOY
      const hoy = new Date().toISOString().split('T')[0];
      const ventasDeHoy = ventas.filter((v: any) => v.fecha.startsWith(hoy));
      const ingresosHoy = ventasDeHoy.reduce((acc, v) => acc + v.total, 0);

      // Filtrar productos con bajo stock (cantidad <= minimo)
      const alertasStock = stock.filter((s: any) => s.cantidad <= s.minimo);

      return {
        empleadosCount: misEmpleados.length,
        ventasHoyCount: ventasDeHoy.length,
        ingresosHoy,
        alertasStock
      };
    };

    try {
      const credenciales = await this.security.obtenerCredencialesSilenciosas();
      if (!credenciales) throw new Error('Sin sesión');

      const githubApi = new GitHubApiAdapter(credenciales.githubToken);
      const sufijo = sucursalId.replace('suc-', '').replace(/-/g, '_');
      
      // 2. SINCRONIZACIÓN EN PARALELO CON GITHUB
      const [resStock, resVentas, resEmpleados] = await Promise.all([
        githubApi.getFile<any>(`sucursal_${sufijo}/stock_${sucursalId.replace(/-/g, '_')}.json`).catch(() => ({ data: { stock: [] } })),
        githubApi.getFile<any>(`sucursal_${sufijo}/ventas_${sucursalId.replace(/-/g, '_')}.json`).catch(() => ({ data: { ventas: [] } })),
        githubApi.getFile<any>('registro_empleados.json').catch(() => ({ data: { empleados: [] } }))
      ]);

      const stockRemoto = resStock.data.stock || [];
      const ventasRemotas = resVentas.data.ventas || [];
      const empleadosRemotos = resEmpleados.data.empleados || [];

      // 3. ACTUALIZAR CACHÉ
      this.localDb.guardarStockSucursal(sucursalId, stockRemoto);
      this.localDb.guardarVentasSucursal(sucursalId, ventasRemotas);
      this.localDb.guardarEmpleados(empleadosRemotos);

      // Unimos las remotas con las pendientes que aún no suben
      const ventasUnificadas = [...ventasRemotas, ...ventasPendientes.filter((v:any) => v.sucursalId === sucursalId)];

      return {
        exito: true,
        data: calcularMetricas(empleadosRemotos, ventasUnificadas, stockRemoto),
        mensaje: 'Métricas actualizadas desde la nube.'
      };

    } catch (error) {
      console.log('Cargando métricas en modo Offline'+error);
      const ventasUnificadas = [...ventasLocales, ...ventasPendientes.filter((v:any) => v.sucursalId === sucursalId)];
      
      return {
        exito: true,
        data: calcularMetricas(empleadosLocales, ventasUnificadas, stockLocal),
        mensaje: 'Sin conexión (Mostrando datos locales)'
      };
    }
  }
}