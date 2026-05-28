export interface Empleado {
  id: string;              // UUID del empleado
  nombre: string;          // Nombre completo
  email: string;           // Correo
  username?: string;       // Creado en el primer inicio (RF21)
  hash_password?: string;  // Hash SHA-256 + Sal de la contraseña (RF21)
  salt?: string;           // Sal aleatoria única para el hash (RNF22)
  sucursal: string;        // ID de la sucursal
  roles: string[];         // Ej: ["Empleado", "Gestor de Inventario"]
  token_hash?: string;     // Hash del token de GitHub (RF07)
  activo: boolean;         // Estado de la cuenta
}

// Mantenemos el modelo de seguridad biométrica para el inicio rápido
export interface SecurityHash {
  empleado_uuid: string;
  hash: string;
  salt: string;
  metodo: 'biometria' | 'patron';
}