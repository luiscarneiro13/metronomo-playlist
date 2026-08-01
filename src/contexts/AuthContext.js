import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { setAuthToken, setSessionExpiredHandler } from '../api/client';
import * as authService from '../services/authService';
import { clearCache } from '../utils/localCache';
import { getItem, removeItem, setItem } from '../utils/secureStorage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('hydrating'); // hydrating | authenticated | unauthenticated

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    await Promise.all([removeItem(TOKEN_KEY), removeItem(USER_KEY)]);
    clearCache();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(clearSession);
  }, [clearSession]);

  useEffect(() => {
    (async () => {
      const [token, storedUser] = await Promise.all([getItem(TOKEN_KEY), getItem(USER_KEY)]);

      if (token && storedUser) {
        setAuthToken(token);
        setUser(JSON.parse(storedUser));
        setStatus('authenticated');
      } else {
        setStatus('unauthenticated');
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    const { token, ...userData } = data;

    setAuthToken(token);
    await Promise.all([setItem(TOKEN_KEY, token), setItem(USER_KEY, JSON.stringify(userData))]);

    setUser(userData);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // La sesión local se limpia igual aunque falle la llamada al servidor.
    }

    await clearSession();
  }, [clearSession]);

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
