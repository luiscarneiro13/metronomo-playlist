import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFonts } from 'expo-font';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { MaterialIcons } from '@expo/vector-icons';

import { getPlaylist, removeSongFromPlaylist, reorderPlaylist } from '../../services/playlistsService';
import { withCacheFallback } from '../../services/offlineFallback';
import AddSongToPlaylist from './AddSongToPlaylist';
import DraggableSongList from './DraggableSongList';
import { useSync } from '../../hooks/useSync';
import { colors } from '../../theme/colors';

const FONTS = {
  headline: 'Montserrat_700Bold',
  body: 'Inter_400Regular',
  label: 'JetBrainsMono_500Medium',
  labelBold: 'JetBrainsMono_700Bold',
};

export default function PlaylistDetailScreen({ playlistId, onBack }) {
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Inter_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  const { isOnline } = useSync();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [query, setQuery] = useState('');

  const fetchPlaylist = useCallback(async () => {
    setErrorMessage(null);
    try {
      const { data } = await withCacheFallback(
        `playlist_detail_${playlistId}`,
        () => getPlaylist(playlistId),
        { isOnline }
      );
      setPlaylist(data);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }, [playlistId, isOnline]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchPlaylist();
      setLoading(false);
    })();
  }, [fetchPlaylist]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlaylist();
    setRefreshing(false);
  }, [fetchPlaylist]);

  const songs = playlist?.metronomes || [];

  const filteredSongs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return songs;
    return songs.filter(
      (song) =>
        song.title?.toLowerCase().includes(normalizedQuery) ||
        song.artist?.toLowerCase().includes(normalizedQuery)
    );
  }, [songs, query]);

  const existingSongIds = useMemo(() => new Set(songs.map((song) => song.id)), [songs]);

  const handleReorder = useCallback(
    async (reorderedSongs) => {
      const previousSongs = songs;
      setActionError(null);
      setPlaylist((prev) => ({ ...prev, metronomes: reorderedSongs }));

      try {
        const updatedPlaylist = await reorderPlaylist(
          playlistId,
          reorderedSongs.map((song) => song.id)
        );
        setPlaylist(updatedPlaylist);
      } catch (error) {
        setPlaylist((prev) => ({ ...prev, metronomes: previousSongs }));
        setActionError(error.message);
      }
    },
    [playlistId, songs]
  );

  const handleRemoveSong = useCallback(
    async (song) => {
      const previousSongs = songs;
      setActionError(null);
      setPlaylist((prev) => ({
        ...prev,
        metronomes: previousSongs.filter((item) => item.id !== song.id),
      }));

      try {
        const updatedPlaylist = await removeSongFromPlaylist(playlistId, song.id);
        setPlaylist(updatedPlaylist);
      } catch (error) {
        setPlaylist((prev) => ({ ...prev, metronomes: previousSongs }));
        setActionError(error.message);
      }
    },
    [playlistId, songs]
  );

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Pressable style={({ pressed }) => [styles.backButton, pressed && styles.pressed]} onPress={onBack}>
        <MaterialIcons name="arrow-back" size={16} color={colors.primaryFixedDim} />
        <Text style={styles.backButtonText}>VOLVER</Text>
      </Pressable>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primaryFixedDim} />
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable style={styles.retryButton} onPress={fetchPlaylist}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <DraggableSongList
          songs={filteredSongs}
          sortable={!query}
          onReorder={handleReorder}
          onRemove={handleRemoveSong}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primaryFixedDim}
            />
          }
          ListHeaderComponent={
            <View>
              <Text style={styles.title}>{playlist?.name}</Text>
              {playlist?.description ? (
                <Text style={styles.description}>{playlist.description}</Text>
              ) : null}

              <Pressable style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
                <MaterialIcons name="edit" size={20} color={colors.primaryFixedDim} />
                <Text style={styles.editButtonText}>Editar playlist</Text>
              </Pressable>

              <AddSongToPlaylist playlistId={playlistId} existingIds={existingSongIds} onAdded={setPlaylist} />

              <View style={styles.searchWrapper}>
                <MaterialIcons
                  name="search"
                  size={20}
                  color={colors.onSurfaceVariant}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar por canción o artista..."
                  placeholderTextColor="rgba(185, 202, 202, 0.4)"
                  value={query}
                  onChangeText={setQuery}
                />
              </View>

              <View style={styles.instructions}>
                <MaterialIcons name="drag-indicator" size={16} color={colors.onSurfaceVariant} />
                <Text style={styles.instructionsText}>
                  {query
                    ? 'Borrá la búsqueda para poder reordenar la playlist.'
                    : 'Mantené presionado el ícono y arrastrá para reordenar la playlist.'}
                </Text>
              </View>

              {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                {songs.length === 0
                  ? 'Esta playlist no tiene canciones todavía.'
                  : 'Ninguna canción coincide con la búsqueda.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontFamily: FONTS.label,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.primaryFixedDim,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 96,
    flexGrow: 1,
  },
  title: {
    fontFamily: FONTS.headline,
    fontSize: 24,
    lineHeight: 32,
    color: colors.onSurface,
    marginBottom: 4,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: colors.onSurfaceVariant,
    opacity: 0.8,
    marginBottom: 24,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 24,
  },
  editButtonText: {
    fontFamily: FONTS.body,
    fontWeight: '700',
    color: colors.onSurface,
  },
  searchWrapper: {
    justifyContent: 'center',
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  searchInput: {
    height: 48,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    paddingLeft: 44,
    paddingRight: 16,
    color: colors.onSurface,
    fontFamily: FONTS.body,
    fontSize: 15,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    opacity: 0.6,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  instructionsText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 14,
    color: colors.onSurfaceVariant,
  },
  pressed: {
    opacity: 0.7,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 48,
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontFamily: FONTS.body,
    fontWeight: '700',
    color: colors.onSurface,
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
