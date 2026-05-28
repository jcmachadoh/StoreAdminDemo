export interface Rol {
  id: string;     // UUID único
  nombre: string; // Nombre visible (ej: "Gestor de Inventario")
  slug: string;   // Identificador seguro para el código (ej: "gestor_inventario")
}