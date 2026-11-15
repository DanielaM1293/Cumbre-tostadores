import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { api } from '../lib/api.js';
import { useUI } from './UIContext.jsx';

const CartContext = createContext(null);
const KEY = 'cumbre.cart.v1';
const MAX_PER_LINE = 20;

const snapshot = (p) => ({
  id: p.id, name: p.name, price: p.price, color: p.color, category: p.category,
  imageUrl: p.imageUrl, stock: p.stock,
});
const limit = (item) => Math.max(1, Math.min(item.stock, MAX_PER_LINE));

function reducer(items, action) {
  switch (action.type) {
    case 'ADD': {
      const { product, qty } = action;
      const found = items.find((i) => i.id === product.id);
      if (!found) return [...items, { ...snapshot(product), qty: Math.min(qty, limit(product)) }];
      return items.map((i) => (i.id === product.id ? { ...i, ...snapshot(product), qty: Math.min(i.qty + qty, limit(product)) } : i));
    }
    case 'SET_QTY':
      return items.map((i) => (i.id === action.id ? { ...i, qty: Math.max(1, Math.min(action.qty, limit(i))) } : i));
    case 'REMOVE':
      return items.filter((i) => i.id !== action.id);
    case 'CLEAR':
      return [];
    case 'REPLACE':
      return action.items;
    case 'SYNC': {
      // Alinea precios, stock y disponibilidad con lo que hay hoy en el catálogo.
      const byId = new Map(action.products.map((p) => [p.id, p]));
      return items
        .filter((i) => byId.get(i.id)?.stock > 0)
        .map((i) => {
          const p = byId.get(i.id);
          return { ...i, ...snapshot(p), qty: Math.min(i.qty, limit(p)) };
        });
    }
    default:
      return items;
  }
}

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((i) => i && i.id && i.qty > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, load);
  const { config, toast } = useUI();
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* modo privado */ }
  }, [items]);

  // Entre pestañas: si cambias el carrito en una, se actualiza en la otra.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== KEY) return;
      dispatch({ type: 'REPLACE', items: load() });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const sync = async () => {
    if (!itemsRef.current.length) return;
    try {
      const { items: products } = await api('/products', { auth: false });
      const before = itemsRef.current;
      const byId = new Map(products.map((p) => [p.id, p]));
      const gone = before.filter((i) => !(byId.get(i.id)?.stock > 0)).map((i) => i.name);
      const changed = before.some((i) => {
        const p = byId.get(i.id);
        return p && p.stock > 0 && (p.price !== i.price || i.qty > Math.min(p.stock, MAX_PER_LINE));
      });
      dispatch({ type: 'SYNC', products });
      if (gone.length) toast(`Quitamos de tu carrito: ${gone.join(', ')} (agotado).`);
      else if (changed) toast('Actualizamos precios o cantidades de tu carrito.');
    } catch { /* sin conexión: se queda con lo guardado */ }
  };

  // Al abrir la tienda, revisa que lo guardado siga vigente.
  useEffect(() => { sync(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const value = useMemo(() => {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping = items.length === 0 || subtotal >= config.freeShippingFrom ? 0 : config.shippingFlat;
    return {
      items, count, subtotal, shipping, total: subtotal + shipping,
      remainingForFree: Math.max(0, config.freeShippingFrom - subtotal),
      qtyOf: (id) => items.find((i) => i.id === id)?.qty ?? 0,
      add: (product, qty = 1) => dispatch({ type: 'ADD', product, qty }),
      setQty: (id, qty) => dispatch({ type: 'SET_QTY', id, qty }),
      remove: (id) => dispatch({ type: 'REMOVE', id }),
      clear: () => dispatch({ type: 'CLEAR' }),
      sync,
      maxFor: (i) => limit(i),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, config]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
