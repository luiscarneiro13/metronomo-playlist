import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';

import { useSettings } from '../../hooks/useSettings';
import { createMetronomeEngine } from '../../utils/audioEngine';
import { colors } from '../../theme/colors';

const FONTS = {
  body: 'Inter_400Regular',
  label: 'JetBrainsMono_500Medium',
  labelBold: 'JetBrainsMono_700Bold',
};

function SongRow({ item, drag, isActive, sortable, onRemove, removing, isPlaying, onTogglePlay }) {
  const handleRemovePress = () => {
    Alert.alert('Quitar canción', `¿Quitar "${item.title}" de la playlist?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => onRemove(item) },
    ]);
  };

  return (
    <ScaleDecorator>
      <View style={[styles.item, isActive && styles.itemDragging]}>
        <Pressable
          onLongPress={drag}
          disabled={!sortable}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <MaterialIcons
            name="drag-indicator"
            size={22}
            color={colors.onSurfaceVariant}
            style={[styles.dragIcon, !sortable && styles.dragIconDisabled]}
          />
        </Pressable>

        <View style={styles.itemText}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.artist ? (
            <Text style={styles.itemArtist} numberOfLines={1}>
              {item.artist}
            </Text>
          ) : null}
        </View>

        {item.has_metronome ? (
          <>
            <View style={styles.bpmBlock}>
              <Text style={styles.bpmLabel}>BPM</Text>
              <Text style={styles.bpmValue}>{item.bpm}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.playButton, isPlaying && styles.playButtonActive, pressed && styles.pressed]}
              onPress={() => onTogglePlay(item)}
            >
              <MaterialIcons name={isPlaying ? 'stop' : 'play-arrow'} size={26} color={colors.onPrimary} />
            </Pressable>
          </>
        ) : (
          <View style={styles.noMetronomeBadge}>
            <Text style={styles.noMetronomeText}>Sin metrónomo</Text>
          </View>
        )}

        <Pressable style={styles.deleteButton} onPress={handleRemovePress} disabled={removing} hitSlop={8}>
          {removing ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <MaterialIcons name="delete-outline" size={22} color={colors.error} />
          )}
        </Pressable>
      </View>
    </ScaleDecorator>
  );
}

export default function DraggableSongList({
  songs,
  sortable,
  onReorder,
  onRemove,
  ListHeaderComponent,
  ListEmptyComponent,
  refreshControl,
  contentContainerStyle,
}) {
  const [removingIds, setRemovingIds] = useState(() => new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [playingId, setPlayingId] = useState(null);

  const { beepSoundId } = useSettings();
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

  const stopPlayback = () => {
    engineRef.current?.stop();
    setPlayingId(null);
  };

  const startPlayback = (item) => {
    setPlayingId(item.id);
    engineRef.current?.start(item.bpm);
  };

  const handleTogglePlay = (item) => {
    if (playingId === item.id) {
      stopPlayback();
    } else {
      startPlayback(item);
    }
  };

  const handleRemove = async (item) => {
    if (playingId === item.id) stopPlayback();
    setRemovingIds((prev) => new Set(prev).add(item.id));
    try {
      await onRemove(item);
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  return (
    <DraggableFlatList
      data={songs}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item, drag, isActive }) => (
        <SongRow
          item={item}
          drag={drag}
          isActive={isActive}
          sortable={sortable}
          onRemove={handleRemove}
          removing={removingIds.has(item.id)}
          isPlaying={playingId === item.id}
          onTogglePlay={handleTogglePlay}
        />
      )}
      onDragBegin={() => {
        stopPlayback();
        setIsDragging(true);
      }}
      onRelease={() => setIsDragging(false)}
      onDragEnd={({ data }) => {
        setIsDragging(false);
        if (sortable) onReorder(data);
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      refreshControl={isDragging ? undefined : refreshControl}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    height: 76,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  itemDragging: {
    zIndex: 10,
    elevation: 8,
    borderColor: colors.primaryFixedDim,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  separator: {
    height: 8,
  },
  dragIcon: {
    opacity: 0.4,
  },
  dragIconDisabled: {
    opacity: 0.15,
  },
  itemText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  itemTitle: {
    fontFamily: FONTS.body,
    fontWeight: '700',
    fontSize: 15,
    color: colors.onSurface,
  },
  itemArtist: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  bpmBlock: {
    alignItems: 'flex-end',
  },
  bpmLabel: {
    fontFamily: FONTS.label,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
  },
  bpmValue: {
    fontFamily: FONTS.labelBold,
    fontSize: 20,
    lineHeight: 20,
    color: colors.onSurface,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  playButtonActive: {
    backgroundColor: colors.error,
    shadowColor: colors.error,
  },
  noMetronomeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(53, 53, 52, 0.5)',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  noMetronomeText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
  },
  deleteButton: {
    padding: 4,
  },
  pressed: {
    transform: [{ scale: 0.9 }],
  },
});
