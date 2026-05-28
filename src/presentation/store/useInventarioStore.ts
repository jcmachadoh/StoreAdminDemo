import { create } from 'zustand';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';

interface InventarioState {
  productos: any[];
  categorias: any[];
  roles: any[];
  cargarCachLocal: () => void;
}

export const useInventarioStore = create<InventarioState>((set) => ({
  productos: [],
  categorias: [],
  roles: [],

  cargarCachLocal: () => {
    const localDb = new LocalStorageAdapter();
    
    // 1. Obtenemos lo que haya en memoria
    let prods = localDb.obtenerProductos();
    let cats = localDb.obtenerCategorias();
    let rols = localDb.obtenerRoles();

    // 2. FILTRO PURIFICADOR: Si el JSON vino anidado, lo extraemos a la fuerza
    if (prods && typeof prods === 'object' && prods.productos) {
      prods = prods.productos;
    }
    if (cats && typeof cats === 'object' && cats.categorias) {
      cats = cats.categorias;
    }
    if (rols && typeof rols === 'object' && rols.roles) {
      rols = rols.roles;
    }

    // 3. Garantizamos que SIEMPRE sean Arreglos (Arrays) para que el .filter() nunca explote
    set({
      productos: Array.isArray(prods) ? prods : [],
      categorias: Array.isArray(cats) ? cats : [],
      roles: Array.isArray(rols) ? rols : []
    });
  }
}));