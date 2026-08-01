import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFonts } from 'expo-font';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { MaterialIcons } from '@expo/vector-icons';

import { listMetronomes } from '../../services/metronomesService';
import { withCacheFallback } from '../../services/offlineFallback';
import CreateMetronomeScreen from './CreateMetronomeScreen';
import MetronomeDetailScreen from './MetronomeDetailScreen';
import { useSettings } from '../../hooks/useSettings';
import { useSync } from '../../hooks/useSync';
import { createMetronomeEngine } from '../../utils/audioEngine';
import { colors } from '../../theme/colors';

const FONTS = {
  headline: 'Montserrat_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  label: 'JetBrainsMono_500Medium',
  labelBold: 'JetBrainsMono_700Bold',
};

function MetronomeItem({ item, onPress, isPlaying, onTogglePlay, isAvailableOffline }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      onPress={onPress}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.bar, item.has_metronome ? styles.barActive : styles.barInactive]} />
        <View style={styles.itemText}>
          <View style={styles.itemTitleRow}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {isAvailableOffline ? (
              <MaterialIcons name="offline-pin" size={14} color={colors.outline} />
            ) : null}
          </View>
          {item.artist ? (
            <Text style={styles.itemArtist} numberOfLines={1}>
              {item.artist}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.itemRight}>
        {item.has_metronome ? (
          <>
            <View style={styles.bpmBlock}>
              <Text style={styles.bpmValue}>{item.bpm}</Text>
              <Text style={styles.bpmLabel}>BPM</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
              onPress={onTogglePlay}
              hitSlop={8}
            >
              <MaterialIcons
                name={isPlaying ? 'stop' : 'play-arrow'}
                size={24}
                color={colors.primaryFixedDim}
              />
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.noMetronomeText}>Sin metrónomo</Text>
            <Pressable style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}>
              <MaterialIcons name="add-circle" size={24} color={colors.outline} />
            </Pressable>
          </>
        )}
      </View>
    </Pressable>
  );
}

export default function MetronomosScreen() {
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  const { beepSoundId } = useSettings();
  const { isOnline, metronomeIds } = useSync();

  const [metronomes, setMetronomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [query, setQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMetronome, setSelectedMetronome] = useState(null);
  const [playingId, setPlayingId] = useState(null);

  const engineRef = useRef(null);

  useEffect(() => {
    const engine = createMetronomeEngine();
    engine.setSound(beepSoundId);
    engineRef.current = engine;

    return () => {
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setSound(beepSoundId);
  }, [beepSoundId]);

  const stopMetronome = useCallback(() => {
    engineRef.current?.stop();
    setPlayingId(null);
  }, []);

  const handleTogglePlay = useCallback(
    (item) => {
      if (playingId === item.id) {
        stopMetronome();
        return;
      }

      setPlayingId(item.id);
      engineRef.current?.start(item.bpm);
    },
    [playingId, stopMetronome]
  );

  useEffect(() => {
    return () => stopMetronome();
  }, [selectedMetronome, isCreating, stopMetronome]);

  const fetchMetronomes = useCallback(async () => {
    setErrorMessage(null);
    try {
      const { data } = await withCacheFallback('metronomes', listMetronomes, { isOnline });
      setMetronomes(data);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }, [isOnline]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchMetronomes();
      setLoading(false);
    })();
  }, [fetchMetronomes]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMetronomes();
    setRefreshing(false);
  }, [fetchMetronomes]);

  const filteredMetronomes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return metronomes;
    }
    return metronomes.filter(
      (metronome) =>
        metronome.title?.toLowerCase().includes(normalizedQuery) ||
        metronome.artist?.toLowerCase().includes(normalizedQuery)
    );
  }, [metronomes, query]);

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  if (selectedMetronome) {
    return (
      <MetronomeDetailScreen
        metronome={selectedMetronome}
        onBack={() => setSelectedMetronome(null)}
        onUpdated={() => {
          setSelectedMetronome(null);
          fetchMetronomes();
        }}
        onDeleted={() => {
          setSelectedMetronome(null);
          fetchMetronomes();
        }}
      />
    );
  }

  if (isCreating) {
    return (
      <CreateMetronomeScreen
        onBack={() => setIsCreating(false)}
        onCreated={() => {
          setIsCreating(false);
          fetchMetronomes();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Metrónomos</Text>
        <View style={styles.searchWrapper}>
          <MaterialIcons name="search" size={20} color={colors.outline} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar canción o artista..."
            placeholderTextColor={colors.outline}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primaryFixedDim} />
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable style={styles.retryButton} onPress={fetchMetronomes}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredMetronomes}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <MetronomeItem
              item={item}
              onPress={() => setSelectedMetronome(item)}
              isPlaying={playingId === item.id}
              onTogglePlay={() => handleTogglePlay(item)}
              isAvailableOffline={metronomeIds.has(item.id)}
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
              <Text style={styles.emptyText}>No tenés metrónomos todavía.</Text>
            </View>
          }
        />
      )}

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
        onPress={() => setIsCreating(true)}
      >
        <MaterialIcons name="add" size={24} color={colors.onPrimaryContainer} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 16,
  },
  title: {
    fontFamily: FONTS.headline,
    fontSize: 24,
    lineHeight: 32,
    color: colors.onSurface,
  },
  searchWrapper: {
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  searchInput: {
    height: 48,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    paddingLeft: 44,
    paddingRight: 16,
    color: colors.onSurface,
    fontFamily: FONTS.body,
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 96,
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: 16,
  },
  itemPressed: {
    backgroundColor: colors.surfaceVariant,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexShrink: 1,
  },
  bar: {
    width: 6,
    height: 32,
    borderRadius: 3,
  },
  barActive: {
    backgroundColor: colors.primaryFixedDim,
  },
  barInactive: {
    backgroundColor: colors.surfaceVariant,
  },
  itemText: {
    flexShrink: 1,
    gap: 2,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    flexShrink: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: colors.onSurface,
  },
  itemArtist: {
    fontFamily: FONTS.label,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    opacity: 0.7,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bpmBlock: {
    alignItems: 'flex-end',
  },
  bpmValue: {
    fontFamily: FONTS.labelBold,
    fontSize: 24,
    lineHeight: 24,
    color: colors.primaryFixedDim,
  },
  bpmLabel: {
    fontFamily: FONTS.label,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.outline,
  },
  noMetronomeText: {
    fontFamily: FONTS.label,
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.outline,
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.9 }],
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
    fontFamily: FONTS.bodyMedium,
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
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
