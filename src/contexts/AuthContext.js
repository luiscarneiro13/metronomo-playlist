import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { setAuthToken } from '../api/client';
import * as authService from '../services/authService';
import { getItem, removeItem, setItem } from '../utils/secureStorage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('hydrating'); // hydrating | authenticated | unauthenticated

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

    setAuthToken(null);
    await Promise.all([removeItem(TOKEN_KEY), removeItem(USER_KEY)]);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
