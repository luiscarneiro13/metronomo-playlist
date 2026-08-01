import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../hooks/useAuth';
import { useConnectivity } from '../hooks/useConnectivity';
import { listMetronomes } from '../services/metronomesService';
import { getPlaylist, listPlaylists } from '../services/playlistsService';
import { hasCache, readCache, writeCache } from '../utils/localCache';

export const SyncContext = createContext(null);

function buildIdSet(items) {
  return new Set((items || []).map((item) => item.id));
}

function latestTimestamp(...isoDates) {
  const times = isoDates.filter(Boolean).map((iso) => new Date(iso).getTime());
  return times.length ? new Date(Math.max(...times)) : null;
}

export function SyncProvider({ children }) {
  const { status } = useAuth();
  const { isOnline } = useConnectivity();

  const [syncStatus, setSyncStatus] = useState('idle'); // idle | syncing | offline | error
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [metronomeIds, setMetronomeIds] = useState(new Set());
  const [playlistIds, setPlaylistIds] = useState(new Set());
  const [playlistDetailIds, setPlaylistDetailIds] = useState(new Set());

  const isSyncingRef = useRef(false);
  const prevOnlineRef = useRef(isOnline);

  // Relee lo que ya esté en disco (de una sincronización previa) al montar,
  // así los checks aparecen aunque la app se abra directamente sin señal.
  const refreshIdSetsFromDisk = useCallback(() => {
    const metronomesCache = readCache('metronomes');
    setMetronomeIds(buildIdSet(metronomesCache?.data));

    const playlistsCache = readCache('playlists');
    const playlists = playlistsCache?.data || [];
    setPlaylistIds(buildIdSet(playlists));
    setPlaylistDetailIds(
      new Set(playlists.filter((playlist) => hasCache(`playlist_detail_${playlist.id}`)).map((playlist) => playlist.id))
    );

    setLastSyncedAt((current) => latestTimestamp(metronomesCache?.syncedAt, playlistsCache?.syncedAt) || current);
  }, []);

  useEffect(() => {
    refreshIdSetsFromDisk();
  }, [refreshIdSetsFromDisk]);

  const runSync = useCallback(async () => {
    if (isSyncingRef.current || !isOnline) return;
    isSyncingRef.current = true;
    setSyncStatus('syncing');

    try {
      const metronomes = await listMetronomes();
      writeCache('metronomes', metronomes);

      const playlists = await listPlaylists();
      writeCache('playlists', playlists);

      await Promise.allSettled(
        playlists.map(async (playlist) => {
          const detail = await getPlaylist(playlist.id);
          writeCache(`playlist_detail_${playlist.id}`, detail);
        })
      );

      refreshIdSetsFromDisk();
      setLastSyncedAt(new Date());
      setSyncStatus('idle');
    } catch (error) {
      setSyncStatus(error.isNetworkError ? 'offline' : 'error');
    } finally {
      isSyncingRef.current = false;
    }
  }, [isOnline, refreshIdSetsFromDisk]);

  // Disparo solo en transiciones (nunca polling): login/apertura con
  // conexión, y recuperación de conexión estando autenticado.
  useEffect(() => {
    if (status === 'authenticated' && isOnline) {
      runSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    const wasOffline = prevOnlineRef.current === false;
    prevOnlineRef.current = isOnline;
    if (status === 'authenticated' && isOnline && wasOffline) {
      runSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const value = useMemo(
    () => ({
      isOnline,
      syncStatus,
      lastSyncedAt,
      metronomeIds,
      playlistIds,
      playlistDetailIds,
      triggerSync: runSync,
    }),
    [isOnline, syncStatus, lastSyncedAt, metronomeIds, playlistIds, playlistDetailIds, runSync]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
