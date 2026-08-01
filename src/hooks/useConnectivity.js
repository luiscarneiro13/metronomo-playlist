import { useContext } from 'react';

import { ConnectivityContext } from '../contexts/ConnectivityContext';

export function useConnectivity() {
  const context = useContext(ConnectivityContext);

  if (!context) {
    throw new Error('useConnectivity debe usarse dentro de un ConnectivityProvider');
  }

  return context;
}
