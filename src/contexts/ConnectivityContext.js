import React, { createContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const ConnectivityContext = createContext(null);

// isInternetReachable puede llegar como null antes de que NetInfo confirme
// (frecuente en Android al arrancar) — lo tratamos como online para no
// mostrar un falso "sin conexión" apenas se abre la app.
function resolveIsOnline(state) {
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

export function ConnectivityProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    NetInfo.fetch().then((state) => setIsOnline(resolveIsOnline(state)));
    const unsubscribe = NetInfo.addEventListener((state) => setIsOnline(resolveIsOnline(state)));
    return unsubscribe;
  }, []);

  return <ConnectivityContext.Provider value={{ isOnline }}>{children}</ConnectivityContext.Provider>;
}
