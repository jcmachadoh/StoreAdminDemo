export interface Sucursal {
  id: string;
  nombre: string;
  direccion: string;
  horario: string; // <-- Nuevo
  coordenadas: {
    lat: number;
    lng: number;
  };
  activa?: boolean;
}