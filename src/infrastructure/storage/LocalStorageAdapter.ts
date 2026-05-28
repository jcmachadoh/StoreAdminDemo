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

  
  // Limpieza general (Logout)
  limpiarTodo(): void {
    this.storage.clearAll();
  }
}