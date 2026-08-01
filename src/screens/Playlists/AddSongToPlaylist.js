import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { listMetronomes } from '../../services/metronomesService';
import { addSongToPlaylist } from '../../services/playlistsService';
import { withCacheFallback } from '../../services/offlineFallback';
import { useSync } from '../../hooks/useSync';
import { colors } from '../../theme/colors';

const FONTS = {
  body: 'Inter_400Regular',
  label: 'JetBrainsMono_500Medium',
};

export default function AddSongToPlaylist({ playlistId, existingIds, onAdded }) {
  const { isOnline } = useSync();

  const [allMetronomes, setAllMetronomes] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    (async () => {
      setLoadingOptions(true);
      try {
        const { data } = await withCacheFallback('metronomes', listMetronomes, { isOnline });
        setAllMetronomes(data);
      } catch {
        setAllMetronomes([]);
      } finally {
        setLoadingOptions(false);
      }
    })();
  }, [isOnline]);

  const availableOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return allMetronomes.filter((metronome) => {
      if (existingIds.has(metronome.id)) return false;
      if (!normalizedQuery) return true;
      return (
        metronome.title?.toLowerCase().includes(normalizedQuery) ||
        metronome.artist?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [allMetronomes, existingIds, query]);

  const handleSelect = (metronome) => {
    setSelected(metronome);
    setQuery(metronome.title);
    setIsOpen(false);
  };

  const handleClearSelection = () => {
    setSelected(null);
    setQuery('');
  };

  const handleAdd = async () => {
    if (!selected) return;

    setErrorMessage(null);
    setAdding(true);
    try {
      const updatedPlaylist = await addSongToPlaylist(playlistId, selected.id);
      onAdded(updatedPlaylist);
      setSelected(null);
      setQuery('');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Agregar canción</Text>

      <View style={styles.row}>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="search" size={18} color={colors.onSurfaceVariant} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Buscar metrónomo..."
            placeholderTextColor="rgba(185, 202, 202, 0.4)"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChangeText={(text) => {
              setQuery(text);
              setSelected(null);
              setIsOpen(true);
            }}
          />
          {query ? (
            <Pressable onPress={handleClearSelection} hitSlop={8}>
              <MaterialIcons name="close" size={18} color={colors.onSurfaceVariant} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            (!selected || adding) && styles.addButtonDisabled,
            pressed && selected && !adding && styles.pressed,
          ]}
          onPress={handleAdd}
          disabled={!selected || adding}
        >
          {adding ? (
            <ActivityIndicator size="small" color={colors.onPrimaryContainer} />
          ) : (
            <MaterialIcons name="add" size={22} color={colors.onPrimaryContainer} />
          )}
        </Pressable>
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {isOpen ? (
        <View style={styles.dropdown}>
          {loadingOptions ? (
            <View style={styles.dropdownState}>
              <ActivityIndicator size="small" color={colors.primaryFixedDim} />
            </View>
          ) : availableOptions.length === 0 ? (
            <View style={styles.dropdownState}>
              <Text style={styles.dropdownEmptyText}>
                {allMetronomes.length === 0
                  ? 'No tenés metrónomos creados todavía.'
                  : 'No hay metrónomos disponibles para agregar.'}
              </Text>
            </View>
          ) : (
            availableOptions.slice(0, 6).map((metronome) => (
              <Pressable
                key={metronome.id}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={() => handleSelect(metronome)}
              >
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle} numberOfLines={1}>
                    {metronome.title}
                  </Text>
                  {metronome.artist ? (
                    <Text style={styles.optionArtist} numberOfLines={1}>
                      {metronome.artist}
                    </Text>
                  ) : null}
                </View>
                {metronome.has_metronome ? (
                  <Text style={styles.optionBpm}>{metronome.bpm} BPM</Text>
                ) : null}
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    gap: 8,
  },
  label: {
    fontFamily: FONTS.label,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: -4,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: colors.onSurface,
    padding: 0,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: colors.error,
  },
  dropdown: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownState: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownEmptyText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  optionPressed: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    fontFamily: FONTS.body,
    fontWeight: '600',
    fontSize: 14,
    color: colors.onSurface,
  },
  optionArtist: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  optionBpm: {
    fontFamily: FONTS.label,
    fontSize: 12,
    color: colors.primaryFixedDim,
  },
});
