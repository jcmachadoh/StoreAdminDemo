import { Producto } from '../entities/Producto';
import { Categoria } from '../entities/Categoria';
import { StockSucursal } from '../entities/Stock';

export interface IProductoRepository {
  // Catálogo
  obtenerProductos(): Promise<Producto[]>;
  guardarProducto(producto: Producto): Promise<void>;
  
  // Categorías
  obtenerCategorias(): Promise<Categoria[]>;
  guardarCategoria(categoria: Categoria): Promise<void>;

  // Inventario
  obtenerStockPorSucursal(sucursalId: string): Promise<StockSucursal>;
  actualizarStock(sucursalId: string, nuevoStock: StockSucursal): Promise<void>;
}