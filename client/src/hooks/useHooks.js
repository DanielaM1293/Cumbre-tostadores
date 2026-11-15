import { useCallback, useEffect, useRef, useState } from 'react';
import { api, toQuery } from '../lib/api.js';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Cumbre Tostadores` : 'Cumbre Tostadores | Café de especialidad colombiano';
  }, [title]);
}

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* modo privado */ }
  }, [key, value]);
  return [value, setValue];
}

export function useDebounced(value, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// Pide datos a la API; conserva la respuesta anterior mientras llega la nueva (sin parpadeos).
export function useFetch(path, { deps = [], enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: enabled });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path, { signal: ctrl.signal })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState((s) => ({ ...s, error, loading: false }));
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, enabled, tick, ...deps]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, refetch };
}

export function useProducts(filters) {
  const query = toQuery({
    category: filters.category,
    q: filters.q,
    max: filters.max,
    roastMin: filters.roast,
    roastMax: filters.roast,
    inStock: filters.stock ? '1' : undefined,
    sort: filters.sort,
  });
  const debounced = useDebounced(query, 220);
  return useFetch(`/products${debounced}`);
}

export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => { ref.current = value; });
  return ref.current;
}
