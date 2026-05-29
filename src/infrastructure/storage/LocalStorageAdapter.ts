import { createMMKV, MMKV } from 'react-native-mmkv';
import { Producto } from '../../domain/entities/Producto';
import { Categoria } from '../../domain/entities/Categoria';
import { StockSucursal } from '../../domain/entities/Stock';

export class LocalStorageAdapter {
  private storage: MMKV;

  constructor() {
    // RNF09: Ciframos el almacenamiento local usando una clave segura.
    // En producción, esta clave idealmente se recupera de react-native-keychain.
    this.storage = createMMKV({
      id: 'admin-local-cache',
      // RNF09: Ciframos el almacenamiento local usando una clave segura...
      encryptionKey: 'hgSTDFYGbnk:I98767E%SXCG08978^RDCG/-*LKJH^689Jkn%Esdf6878uj'
    });
  }

  // --- MÉTODOS PARA PRODUCTOS ---
  guardarProductos(productos: Producto[]): void {
    this.storage.set('productos', JSON.stringify(productos));
  }

  obtenerProductos(): Producto[] {
    const res = this.storage.getString('productos');
    return res ? JSON.parse(res) : [];
  }

  // --- MÉTODOS PARA CATEGORÍAS ---
  guardarCategorias(categorias: Categoria[]): void {
    this.storage.set('categorias', JSON.stringify(categorias));
  }

  obtenerCategorias(): Categoria[] {
    const res = this.storage.getString('categorias');
    return res ? JSON.parse(res) : [];
  }

  // --- MÉTODOS PARA STOCK POR SUCURSAL ---
  guardarStockSucursal(sucursalId: string, stock: StockSucursal): void {
    this.storage.set(`stock_${sucursalId}`, JSON.stringify(stock));
  }

  obtenerStockSucursal(sucursalId: string): StockSucursal | null {
    const res = this.storage.getString(`stock_${sucursalId}`);
    return res ? JSON.parse(res) : null;
  }

  // --- COLA DE AJUSTES DE STOCK OFFLINE ---
  guardarAjusteStockPendiente(ajuste: any): void {
    const pendientes = this.obtenerAjustesStockPendientes();
    pendientes.push(ajuste);
    this.storage.set('ajustes_stock_pendientes', JSON.stringify(pendientes));
  }

  obtenerAjustesStockPendientes(): any[] {
    const res = this.storage.getString('ajustes_stock_pendientes');
    return res ? JSON.parse(res) : [];
  }

  removerAjusteStockPendiente(ajusteId: string): void {
    const pendientes = this.obtenerAjustesStockPendientes();
    const filtrados = pendientes.filter((a: any) => a.id !== ajusteId);
    this.storage.set('ajustes_stock_pendientes', JSON.stringify(filtrados));
  }

  // --- PREFERENCIAS DE USUARIO (TEMA E IDIOMA) ---
  // Busca tus métodos de preferencias y sustitúyelos/amplíalos así:
  guardarPreferencias(tema: 'light' | 'dark', idioma: 'es' | 'en', syncMode: 'manual' | 'auto' = 'manual', syncDelay: number = 5): void {
    this.storage.set('app_tema', tema);
    this.storage.set('app_idioma', idioma);
    this.storage.set('app_sync_mode', syncMode);
    this.storage.set('app_sync_delay', syncDelay);
  }

  obtenerPreferencias(): { tema: 'light' | 'dark'; idioma: 'es' | 'en'; syncMode: 'manual' | 'auto'; syncDelay: number } {
    const tema = (this.storage.getString('app_tema') as 'light' | 'dark') || 'light';
    const idioma = (this.storage.getString('app_idioma') as 'es' | 'en') || 'es';
    const syncMode = (this.storage.getString('app_sync_mode') as 'manual' | 'auto') || 'manual';
    const syncDelay = this.storage.getNumber('app_sync_delay') ?? 5; // 5 segundos por defecto
    return { tema, idioma, syncMode, syncDelay };
  }

  // --- COLA DE SINCRONIZACIÓN OFFLINE (Para RNF04 / RF41) ---
  // Aquí guardaremos temporalmente las operaciones hechas sin internet
  agregarOperacionPendiente(operacion: { tipo: string; payload: any }): void {
    const colaActual = this.obtenerOperacionesPendientes();
    colaActual.push(operacion);
    this.storage.set('cola_offline', JSON.stringify(colaActual));
  }

  obtenerOperacionesPendientes(): any[] {
    const res = this.storage.getString('cola_offline');
    return res ? JSON.parse(res) : [];
  }

  limpiarColaOffline(): void {
    this.storage.remove('cola_offline'); // ✅ Cambio aquí: 'delete' -> 'remove'
  }
  // --- MÉTODOS PARA SEGURIDAD BIOMÉTRICA (RF10, RF11, RF12) ---

  /**
   * Guarda el ancla de seguridad (hash y salt) en MMKV.
   * Esto se compara diariamente con el de GitHub para evitar manipulaciones.
   */
  guardarHashSeguridad(data: any): void {
    // Convertimos el objeto SecurityHash a string para MMKV
    this.storage.set('security_hash', JSON.stringify(data));
  }

  /**
   * Recupera el ancla de seguridad almacenada.
   */
  obtenerHashSeguridad(): any | null {
    const res = this.storage.getString('security_hash');
    return res ? JSON.parse(res) : null;
  }

  // --- MÉTODOS PARA SESIÓN DEL EMPLEADO (RF08) ---

  /**
   * Guarda los datos no sensibles del empleado (nombre, roles, sucursal) 
   * para cargar el Dashboard instantáneamente (< 1ms).
   */
  guardarDatosEmpleadoLogueado(empleado: any): void {
    // MMKV está cifrado, es seguro guardar el empleado completo aquí
    this.storage.set('empleado_actual', JSON.stringify(empleado));
  }

  /**
   * Recupera los datos del empleado activo.
   */
  obtenerDatosEmpleadoLogueado(): any | null {
    const res = this.storage.getString('empleado_actual');
    return res ? JSON.parse(res) : null;
  }

  guardarRoles(roles: any[]): void {
    this.storage.set('roles_maestros', JSON.stringify(roles));
  }

  obtenerRoles(): any[] {
    const res = this.storage.getString('roles_maestros');
    return res ? JSON.parse(res) : [];
  }

  // --- SUCURSALES ---
  guardarSucursales(sucursales: any[]): void {
    this.storage.set('sucursales_cache', JSON.stringify(sucursales));
  }

  obtenerSucursales(): any[] {
    const res = this.storage.getString('sucursales_cache');
    return res ? JSON.parse(res) : [];
  }

  // --- EMPLEADOS ---
  guardarEmpleados(empleados: any[]): void {
    this.storage.set('empleados_cache', JSON.stringify(empleados));
  }

  obtenerEmpleados(): any[] {
    const res = this.storage.getString('empleados_cache');
    return res ? JSON.parse(res) : [];
  }

  // --- COLA DE VENTAS OFFLINE ---
  guardarVentaPendiente(venta: any): void {
    const pendientes = this.obtenerVentasPendientes();
    pendientes.push(venta);
    this.storage.set('ventas_pendientes', JSON.stringify(pendientes));
  }

  obtenerVentasPendientes(): any[] {
    const res = this.storage.getString('ventas_pendientes');
    return res ? JSON.parse(res) : [];
  }

  removerVentaPendiente(ventaId: string): void {
    const pendientes = this.obtenerVentasPendientes();
    const filtradas = pendientes.filter((v: any) => v.id !== ventaId);
    this.storage.set('ventas_pendientes', JSON.stringify(filtradas));
  }

  // --- HISTORIAL DE VENTAS SUCURSAL ---
  guardarVentasSucursal(sucursalId: string, ventas: any[]): void {
    this.storage.set(`ventas_history_${sucursalId}`, JSON.stringify(ventas));
  }

  obtenerVentasSucursal(sucursalId: string): any[] {
    const res = this.storage.getString(`ventas_history_${sucursalId}`);
    return res ? JSON.parse(res) : [];
  }

  // --- COLA DE SUCURSALES PENDIENTES ---
  guardarSucursalPendiente(sucursal: any): void {
    const pendientes = this.obtenerSucursalesPendientes();
    // Reemplazamos si ya existe (para soportar ediciones offline) o agregamos
    const index = pendientes.findIndex((s: any) => s.id === sucursal.id);
    if (index !== -1) pendientes[index] = sucursal;
    else pendientes.push(sucursal);
    this.storage.set('sucursales_pendientes', JSON.stringify(pendientes));
  }

  obtenerSucursalesPendientes(): any[] {
    const res = this.storage.getString('sucursales_pendientes');
    return res ? JSON.parse(res) : [];
  }

  removerSucursalPendiente(sucursalId: string): void {
    const pendientes = this.obtenerSucursalesPendientes();
    const filtradas = pendientes.filter((s: any) => s.id !== sucursalId);
    this.storage.set('sucursales_pendientes', JSON.stringify(filtradas));
  }

  // --- COLA DE PRODUCTOS PENDIENTES ---
  guardarProductoPendiente(producto: any): void {
    const pendientes = this.obtenerProductosPendientes();
    const index = pendientes.findIndex((p: any) => p.sku === producto.sku);
    if (index !== -1) pendientes[index] = producto;
    else pendientes.push(producto);
    this.storage.set('productos_pendientes', JSON.stringify(pendientes));
  }

  obtenerProductosPendientes(): any[] {
    const res = this.storage.getString('productos_pendientes');
    return res ? JSON.parse(res) : [];
  }

  removerProductoPendiente(sku: string): void {
    const pendientes = this.obtenerProductosPendientes();
    const filtrados = pendientes.filter((p: any) => p.sku !== sku);
    this.storage.set('productos_pendientes', JSON.stringify(filtrados));
  }
  
  // Limpieza general (Logout)
  limpiarTodo(): void {
    this.storage.clearAll();
  }
}