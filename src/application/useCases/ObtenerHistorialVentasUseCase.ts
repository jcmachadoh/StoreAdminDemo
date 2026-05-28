import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';
import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';

export class ObtenerHistorialVentasUseCase {
  private security = new SecurityAdapter();
  private localDb = new LocalStorageAdapter();

  async ejecutar(sucursalId: string): Promise<{ exito: boolean; data: any[]; mensaje: string }> {
    const empleadoLogueado = this.localDb.obtenerDatosEmpleadoLogueado();
    
    // 1. Obtenemos el historial local en caché y las ventas en cola
    const ventasLocales = this.localDb.obtenerVentasSucursal(sucursalId) || [];
    const ventasPendientes = this.localDb.obtenerVentasPendientes() || [];

    // Filtramos las pendientes para asegurarnos que son de esta sucursal y les ponemos la etiqueta virtual
    const pendientesDeSucursal = ventasPendientes
      .filter((v: any) => v.sucursalId === sucursalId)
      .map((v: any) => ({ ...v, _isPending: true })); // <-- ETIQUETA MÁGICA

    try {
      const credenciales = await this.security.obtenerCredencialesSilenciosas();
      if (!credenciales) throw new Error('Sin sesión');

      const githubApi = new GitHubApiAdapter(credenciales.githubToken);
      const sufijo = sucursalId.replace('suc-', '').replace(/-/g, '_');
      const ventasPath = `sucursal_${sufijo}/ventas_${sucursalId.replace(/-/g, '_')}.json`;

      // 2. Descargamos el historial oficial de la nube
      const { data } = await githubApi.getFile<any>(ventasPath);
      const ventasRemotas = data.ventas || [];

      // Sincronizamos la caché local
      this.localDb.guardarVentasSucursal(sucursalId, ventasRemotas);

      // 3. FUSIONAMOS: Oficiales (Nube) + Pendientes (Cola Local)
      const todasLasVentas = [...ventasRemotas, ...pendientesDeSucursal];

      return {
        exito: true,
        data: this.filtrarPorRol(todasLasVentas, empleadoLogueado),
        mensaje: 'Historial Sincronizado'
      };

    } catch (error) {
      console.log('POS Historial en modo Offline.' + error);
      
      // MODO OFFLINE: Fusionamos el Caché Oficial + Pendientes
      const todasOffline = [...ventasLocales, ...pendientesDeSucursal];
      
      return {
        exito: true,
        data: this.filtrarPorRol(todasOffline, empleadoLogueado),
        mensaje: 'Mostrando historial local (Offline)'
      };
    }
  }

  private filtrarPorRol(ventas: any[], empleado: any): any[] {
    if (!empleado) return [];
    
    const tieneAccesoTotal = empleado.roles.includes('rol-prop-111') || empleado.roles.includes('rol-jefe-222');
    if (tieneAccesoTotal) {
      return ventas;
    }
    return ventas.filter(v => v.vendedor?.id === empleado.id);
  }
}