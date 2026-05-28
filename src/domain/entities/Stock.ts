export interface StockItem {
  sku: string;
  cantidad: number;
  minimo: number; // Nuevo: Para alertas de Gestor de Inventario
}

export interface StockSucursal {
  sucursal_id: string;
  stock: StockItem[]; // Ahora es un Array
  sha?: string; 
}