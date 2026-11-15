const BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'cumbre.token';

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* sin almacenamiento */ }
};

// Las imágenes subidas vienen como /uploads/...; en producción pueden vivir en otro dominio.
export const assetUrl = (u) => (u && u.startsWith('/') ? `${BASE}${u}` : u);

export class ApiError extends Error {
  constructor(status, message, fields = []) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
  // { 'customer.phone': 'Escribe un celular válido' }
  get fieldMap() {
    return Object.fromEntries(this.fields.map((f) => [f.field, f.message]));
  }
}

export async function api(path, { method = 'GET', body, form, signal, auth = true } = {}) {
  const headers = {};
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: form ?? (body ? JSON.stringify(body) : undefined),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token && auth) {
      setToken(null);
      window.dispatchEvent(new Event('cumbre:logout'));
    }
    throw new ApiError(res.status, data.error || 'Algo salió mal. Intenta de nuevo.', data.fields);
  }
  return data;
}

export const toQuery = (obj) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) if (v !== undefined && v !== null && v !== '') p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : '';
};
