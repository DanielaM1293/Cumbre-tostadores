import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const UIContext = createContext(null);

const DEFAULT_CONFIG = {
  storeName: 'Cumbre Tostadores',
  whatsapp: '573001234567',
  freeShippingFrom: 150000,
  shippingFlat: 9000,
  paymentMode: 'simulated',
};

export function UIProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    api('/config', { auth: false }).then(setConfig).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle('dark', next);
      try { localStorage.setItem('cumbre.theme', next ? 'dark' : 'light'); } catch { /* ignorar */ }
      return next;
    });
  }, []);

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback((message, action) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t.slice(-2), { id, message, action }]);
    setTimeout(() => dismissToast(id), 4500);
  }, [dismissToast]);

  const value = useMemo(
    () => ({
      config, dark, toggleTheme, toasts, toast, dismissToast,
      cartOpen, closeCart: () => setCartOpen(false),
      // Al abrir el carrito, los avisos sobran: el cajón ya muestra lo que se agregó.
      openCart: () => { setToasts([]); setCartOpen(true); },
    }),
    [config, dark, toggleTheme, toasts, toast, dismissToast, cartOpen],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export const useUI = () => useContext(UIContext);
