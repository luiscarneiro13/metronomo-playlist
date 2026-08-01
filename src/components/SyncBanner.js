import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useSync } from '../hooks/useSync';
import { colors } from '../theme/colors';

function formatSyncedAt(date) {
  if (!date) return 'Todavía no sincronizado';

  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return 'Última sincronización: recién';
  if (diffMinutes < 60) return `Última sincronización: hace ${diffMinutes} min`;

  const diffHours = Math.round(diffMinutes / 60);
  return `Última sincronización: hace ${diffHours} h`;
}

export default function SyncBanner() {
  const { isOnline, syncStatus, lastSyncedAt } = useSync();

  if (isOnline && syncStatus !== 'syncing') {
    return null;
  }

  if (!isOnline) {
    return (
      <View style={[styles.banner, styles.bannerOffline]}>
        <MaterialIcons name="cloud-off" size={16} color={colors.onSurfaceVariant} />
        <Text style={styles.text}>Sin conexión — usando datos guardados</Text>
        <Text style={styles.subtext}>{formatSyncedAt(lastSyncedAt)}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.banner, styles.bannerSyncing]}>
      <ActivityIndicator size="small" color={colors.primaryFixedDim} />
      <Text style={styles.text}>Sincronizando…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  bannerOffline: {
    backgroundColor: colors.surfaceContainer,
  },
  bannerSyncing: {
    backgroundColor: colors.surfaceContainerLow,
  },
  text: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  subtext: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.outline,
    marginLeft: 'auto',
  },
});
