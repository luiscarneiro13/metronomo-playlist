import { readCache, writeCache } from '../utils/localCache';

// Envuelve una llamada de red con fallback a cache local: si ya sabemos que
// estamos offline no esperamos el timeout de apiRequest, devolvemos el
// cache al instante; si la llamada falla por falta de conexión, caemos a
// cache; si no hay nada cacheado, el error sube tal cual (mismo
// comportamiento de hoy: pantalla de error + "Reintentar").
export async function withCacheFallback(cacheKey, apiCall, { isOnline } = {}) {
  if (isOnline === false) {
    const cached = readCache(cacheKey);
    if (cached) {
      return { data: cached.data, fromCache: true, syncedAt: cached.syncedAt };
    }
  }

  try {
    const data = await apiCall();
    writeCache(cacheKey, data);
    return { data, fromCache: false, syncedAt: null };
  } catch (error) {
    if (error.isNetworkError) {
      const cached = readCache(cacheKey);
      if (cached) {
        return { data: cached.data, fromCache: true, syncedAt: cached.syncedAt };
      }
    }
    throw error;
  }
}
