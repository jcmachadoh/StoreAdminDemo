import axios, { AxiosInstance } from 'axios';
import { decode, encode } from 'base-64';
import { IProductoRepository } from '../../domain/repositories/IProductoRepository';
import { Producto } from '../../domain/entities/Producto';
import { Categoria } from '../../domain/entities/Categoria';
import { StockSucursal } from '../../domain/entities/Stock';

export class GitHubApiAdapter implements IProductoRepository {
  private api: AxiosInstance;
  private owner = 'jcmachadoh';
  private repo = 'GitStore';
  private branch = 'main';

  constructor(token: string) {
    this.api = axios.create({
      baseURL: `https://api.github.com/repos/${this.owner}/${this.repo}/contents`,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
  }

  // --- MÉTODOS AUXILIARES ---

  public async getFile<T>(path: string): Promise<{ data: T; sha: string }> {
    try {
      const response = await this.api.get(`/${path}?ref=${this.branch}`);
      const contentBase64 = response.data.content;

      const cleanBase64 = contentBase64.replace(/\n/g, '');
      const decodedContent = decodeURIComponent(escape(decode(cleanBase64)));

      return {
        data: JSON.parse(decodedContent),
        sha: response.data.sha,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`El archivo ${path} no existe en el repositorio.`);
      }
      throw error;
    }
  }

  public async updateFile(path: string, content: any, sha: string, commitMessage: string): Promise<string> {
    const jsonString = JSON.stringify(content, null, 2);
    // IMPORTANTE: Asegúrate de usar esta codificación para evitar errores con caracteres especiales al subir
    const encodedContent = encode(unescape(encodeURIComponent(jsonString)));

    const response = await this.api.put(`/${path}`, {
      message: commitMessage,
      content: encodedContent,
      sha: sha,
      branch: this.branch,
    });

    return response.data.content.sha;
  }

  // --- IMPLEMENTACIÓN DEL REPOSITORIO ---

  async obtenerProductos(): Promise<Producto[]> {
    // CORRECCIÓN 2: productos.json está en la raíz, sin carpeta 'negocio/'
    const { data } = await this.getFile<Producto[]>('productos.json');
    return data;
  }

  async guardarProducto(producto: Producto): Promise<void> {
    const { data: productos, sha } = await this.getFile<Producto[]>('productos.json');

    const index = productos.findIndex(p => p.sku === producto.sku);
    if (index !== -1) {
      productos[index] = producto;
    } else {
      productos.push(producto);
    }

    await this.updateFile('productos.json', productos, sha, `Update producto: ${producto.nombre}`);
  }

  async obtenerCategorias(): Promise<Categoria[]> {
    // CORRECCIÓN 3: categorias.json está en la raíz
    const { data } = await this.getFile<Categoria[]>('categorias.json');
    return data;
  }

  async guardarCategoria(categoria: Categoria): Promise<void> {
    const { data: categorias, sha } = await this.getFile<Categoria[]>('categorias.json');

    const index = categorias.findIndex(c => c.id === categoria.id);
    if (index !== -1) {
      categorias[index] = categoria;
    } else {
      categorias.push(categoria);
    }

    await this.updateFile('categorias.json', categorias, sha, `Update categoria: ${categoria.nombre}`);
  }

  async obtenerStockPorSucursal(sucursalId: string): Promise<StockSucursal> {
    // Esta ruta SÍ está bien, porque en tu captura tienes la carpeta sucursal_centro
    const path = `sucursal_${sucursalId.replace('suc-', '')}/stock_sucursal_${sucursalId.replace('suc-', '')}.json`;
    const { data, sha } = await this.getFile<StockSucursal>(path);

    data.sha = sha;
    return data;
  }

  async actualizarStock(sucursalId: string, nuevoStock: StockSucursal): Promise<void> {
    if (!nuevoStock.sha) throw new Error("Se requiere el SHA anterior para actualizar el stock y evitar conflictos.");

    const path = `sucursal_${sucursalId.replace('suc-', '')}/stock_sucursal_${sucursalId.replace('suc-', '')}.json`;
    const { sha, ...stockDataToSave } = nuevoStock;

    await this.updateFile(path, stockDataToSave, sha, `Update stock sucursal: ${sucursalId}`);
  }

  async obtenerRegistroEmpleados(): Promise<any> {
    // Según el documento, el archivo está en la raíz: registro_empleados.json
    const { data, sha } = await this.getFile<any>('registro_empleados.json');
    // Devolvemos tanto el objeto como el SHA del archivo para poder actualizarlo después
    return { empleados: data.empleados, sha };
  }

  async actualizarRegistroEmpleados(empleados: any[], sha: string): Promise<void> {
    const contenidoCompleto = { empleados };
    await this.updateFile('registro_empleados.json', contenidoCompleto, sha, '🔑 Sistema: Activación de cuenta de empleado');
  }

  async obtenerRoles(): Promise<any[]> {
    const { data } = await this.getFile<any>('roles.json');
    return data.roles;
  }
}