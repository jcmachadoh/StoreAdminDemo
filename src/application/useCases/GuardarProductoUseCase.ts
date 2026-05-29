/* eslint-disable @typescript-eslint/no-unused-vars */
import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';
import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';

export class GuardarProductoUseCase {
  private security = new SecurityAdapter();
  private localDb = new LocalStorageAdapter();
  private FILE_NAME = 'productos.json'; // <--- EL NOMBRE CORRECTO

  async ejecutar(producto: any): Promise<{ exito: boolean; mensaje: string }> {
    try {
      // FIX: GENERADOR AUTOMÁTICO DE SKU SI VIENE VACÍO
      if (!producto.sku || producto.sku.trim() === '') {
        producto.sku = `PROD-${Date.now()}`;
      }

      // 1. GUARDAMOS EN LA COLA PENDIENTE
      this.localDb.guardarProductoPendiente(producto);

      // 2. ACTUALIZAMOS EL CATÁLOGO LOCAL (Efecto Offline Inmediato)
      const catalogoRaw: any = this.localDb.obtenerProductos();
      const productosActuales: any[] = Array.isArray(catalogoRaw) ? catalogoRaw : (catalogoRaw.productos || []);
      
      const index = productosActuales.findIndex((p: any) => p.sku === producto.sku);
      if (index !== -1) {
        productosActuales[index] = producto; // Edición
      } else {
        productosActuales.push(producto); // Creación
      }
      
      const nuevoCatalogo = Array.isArray(catalogoRaw) ? productosActuales : { ...catalogoRaw, productos: productosActuales };
      this.localDb.guardarProductos(nuevoCatalogo);

      // 3. INTENTO DE SINCRONIZACIÓN EN SEGUNDO PLANO
      this.sincronizarEnSegundoPlano(producto).catch(err => {
        console.log('Modo Offline: Producto guardado en cola local.', err);
      });

      return { exito: true, mensaje: 'Producto guardado en catálogo local.' };
    } catch (error) {
      return { exito: false, mensaje: 'Error al escribir el producto en memoria.' };
    }
  }

  private async sincronizarEnSegundoPlano(producto: any) {
    const credenciales = await this.security.obtenerCredencialesSilenciosas();
    if (!credenciales) return;

    const githubApi = new GitHubApiAdapter(credenciales.githubToken);
    
    let listaProductos: any[] = [];
    let fileSha = '';

    // ¡EL FIX! Manejo del error 404 por si el archivo no existe
    try {
      const { data, sha } = await githubApi.getFile<any>(this.FILE_NAME);
      listaProductos = data.productos || [];
      fileSha = sha;
    } catch (e) {
      console.log(`⚠️ Archivo ${this.FILE_NAME} no existe. Se creará uno nuevo.`);
    }

    const index = listaProductos.findIndex((p: any) => p.sku === producto.sku);
    if (index !== -1) {
      listaProductos[index] = producto;
    } else {
      listaProductos.push(producto);
    }

    await githubApi.updateFile(this.FILE_NAME, { productos: listaProductos }, fileSha, `📦 Catálogo: Producto ${producto.sku} guardado.`);

    this.localDb.removerProductoPendiente(producto.sku);
    console.log(`✅ Producto ${producto.sku} sincronizado en la nube.`);
  }
}