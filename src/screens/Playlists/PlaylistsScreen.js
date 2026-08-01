import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFonts } from 'expo-font';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { MaterialIcons } from '@expo/vector-icons';

import { listPlaylists } from '../../services/playlistsService';
import { withCacheFallback } from '../../services/offlineFallback';
import PlaylistDetailScreen from './PlaylistDetailScreen';
import CreatePlaylistScreen from './CreatePlaylistScreen';
import { useSync } from '../../hooks/useSync';
import { colors } from '../../theme/colors';

const FONTS = {
  headline: 'Montserrat_700Bold',
  body: 'Inter_400Regular',
  bodyBold: 'Inter_700Bold',
  label: 'JetBrainsMono_500Medium',
};

function PlaylistCard({ item, onPress, isAvailableOffline }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.cardFooterLeft}>
          <Text style={styles.cardChip}>
            {item.metronomes_count} {item.metronomes_count === 1 ? 'Tema' : 'Temas'}
          </Text>
          {isAvailableOffline ? (
            <MaterialIcons name="offline-pin" size={16} color={colors.outline} />
          ) : null}
        </View>
        <Pressable style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}>
          <MaterialIcons name="more-vert" size={22} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function PlaylistsScreen() {
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Inter_400Regular,
    Inter_700Bold,
    JetBrainsMono_500Medium,
  });

  const { isOnline, playlistDetailIds } = useSync();

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchPlaylists = useCallback(async () => {
    setErrorMessage(null);
    try {
      const { data } = await withCacheFallback('playlists', listPlaylists, { isOnline });
      setPlaylists(data);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }, [isOnline]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchPlaylists();
      setLoading(false);
    })();
  }, [fetchPlaylists]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlaylists();
    setRefreshing(false);
  }, [fetchPlaylists]);

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  if (selectedPlaylistId) {
    return (
      <PlaylistDetailScreen
        playlistId={selectedPlaylistId}
        onBack={() => setSelectedPlaylistId(null)}
      />
    );
  }

  if (isCreating) {
    return (
      <CreatePlaylistScreen
        onBack={() => setIsCreating(false)}
        onCreated={(playlist) => {
          setIsCreating(false);
          fetchPlaylists();
          setSelectedPlaylistId(playlist.id);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Tu Sonido</Text>
          <Text style={styles.title}>Mis Playlists</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <MaterialIcons name="sort-by-alpha" size={20} color={colors.onSurfaceVariant} />
          </Pressable>
          <Pressable style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <MaterialIcons name="filter-list" size={20} color={colors.primaryFixedDim} />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primaryFixedDim} />
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable style={styles.retryButton} onPress={fetchPlaylists}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PlaylistCard
              item={item}
              onPress={() => setSelectedPlaylistId(item.id)}
              isAvailableOffline={playlistDetailIds.has(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primaryFixedDim}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No tenés playlists todavía.</Text>
            </View>
          }
        />
      )}

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
        onPress={() => setIsCreating(true)}
      >
        <MaterialIcons name="add" size={26} color={colors.onPrimaryFixed} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  eyebrow: {
    fontFamily: FONTS.label,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.primaryFixedDim,
    marginBottom: 4,
  },
  title: {
    fontFamily: FONTS.headline,
    fontSize: 24,
    lineHeight: 32,
    color: colors.onSurface,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 96,
    flexGrow: 1,
  },
  separator: {
    height: 16,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2d2d2d',
    borderRadius: 16,
    padding: 20,
    minHeight: 160,
    justifyContent: 'space-between',
    gap: 24,
  },
  cardPressed: {
    backgroundColor: colors.surfaceVariant,
    transform: [{ scale: 0.98 }],
  },
  cardTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 18,
    color: colors.onSurface,
    marginBottom: 4,
  },
  cardDescription: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardChip: {
    fontFamily: FONTS.label,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    backgroundColor: colors.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  moreButton: {
    padding: 4,
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
    fontFamily: FONTS.bodyBold,
    color: colors.onSurface,
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryFixedDim,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.primaryFixedDim,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
});
