import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../lib/api.js';

const AuthContext = createContext(null);

const emailFromToken = (t) => {
  try { return JSON.parse(atob(t.split('.')[1])).email; } catch { return null; }
};

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken);

  const login = useCallback(async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password }, auth: false });
    setToken(data.token);
    setTokenState(data.token);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setTokenState(null);
  }, []);

  // Si la API responde 401 (sesión vencida), cerramos sesión en la interfaz.
  useEffect(() => {
    window.addEventListener('cumbre:logout', logout);
    return () => window.removeEventListener('cumbre:logout', logout);
  }, [logout]);

  const value = useMemo(
    () => ({ isAdmin: Boolean(token), email: token ? emailFromToken(token) : null, login, logout }),
    [token, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
