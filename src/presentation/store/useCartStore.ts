import { create } from 'zustand';
import { Producto } from '../../domain/entities/Producto';

export interface CartItem {
  producto: Producto;
  cantidad: number;
}

interface CartState {
  cart: CartItem[];
  total: number;
  
  agregarAlCarrito: (producto: Producto) => void;
  agregarConCantidad: (producto: Producto, cantidad: number) => void; // NUEVO
  quitarDelCarrito: (sku: string) => void;
  cambiarCantidad: (sku: string, incremento: number) => void;
  vaciarCarrito: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  total: 0,

  agregarAlCarrito: (producto) => {
    get().agregarConCantidad(producto, 1);
  },

  // ESTA ES LA FUNCIÓN NUEVA PARA EL MODAL
  agregarConCantidad: (producto, cantidadAgregada) => {
    const { cart } = get();
    const itemExistente = cart.find(item => item.producto.sku === producto.sku);

    let nuevoCarrito;
    if (itemExistente) {
      nuevoCarrito = cart.map(item => 
        item.producto.sku === producto.sku 
          ? { ...item, cantidad: item.cantidad + cantidadAgregada }
          : item
      );
    } else {
      nuevoCarrito = [...cart, { producto, cantidad: cantidadAgregada }];
    }

    const nuevoTotal = nuevoCarrito.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
    set({ cart: nuevoCarrito, total: nuevoTotal });
  },

  quitarDelCarrito: (sku) => {
    const { cart } = get();
    const nuevoCarrito = cart.filter(item => item.producto.sku !== sku);
    const nuevoTotal = nuevoCarrito.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
    set({ cart: nuevoCarrito, total: nuevoTotal });
  },

  cambiarCantidad: (sku, incremento) => {
    const { cart, quitarDelCarrito } = get();
    const itemActual = cart.find(item => item.producto.sku === sku);
    
    if (itemActual && itemActual.cantidad + incremento <= 0) {
      quitarDelCarrito(sku);
      return;
    }

    const nuevoCarrito = cart.map(item => 
      item.producto.sku === sku ? { ...item, cantidad: item.cantidad + incremento } : item
    );

    const nuevoTotal = nuevoCarrito.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
    set({ cart: nuevoCarrito, total: nuevoTotal });
  },

  vaciarCarrito: () => set({ cart: [], total: 0 })
}));