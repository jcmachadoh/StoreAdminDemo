export interface Producto {
  sku: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria_id: string;
  imagen?: string;  // <-- Cambiado de imagen_url a imagen
  activo: boolean;
}