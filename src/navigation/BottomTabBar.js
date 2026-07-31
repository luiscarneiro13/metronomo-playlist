import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';

export const TABS = [
  { key: 'metronomos', label: 'Metrónomos', iconSet: MaterialIcons, icon: 'library-music' },
  { key: 'playlists', label: 'Playlists', iconSet: MaterialIcons, icon: 'queue-music' },
  { key: 'practica', label: 'Práctica', iconSet: MaterialCommunityIcons, icon: 'metronome' },
  { key: 'perfil', label: 'Perfil', iconSet: MaterialIcons, icon: 'person' },
];

export default function BottomTabBar({ activeTab, onTabChange }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, 8), height: 56 + Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        const Icon = tab.iconSet;

        return (
          <Pressable
            key={tab.key}
            style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
            onPress={() => onTabChange(tab.key)}
          >
            <Icon
              name={tab.icon}
              size={24}
              color={isActive ? colors.primaryFixedDim : colors.onSurfaceVariant}
              style={!isActive && styles.inactiveIcon}
            />
            <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabPressed: {
    transform: [{ scale: 0.9 }],
  },
  inactiveIcon: {
    opacity: 0.6,
  },
  label: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  labelActive: {
    color: colors.primaryFixedDim,
    fontFamily: 'JetBrainsMono_700Bold',
  },
  labelInactive: {
    color: colors.onSurfaceVariant,
    opacity: 0.6,
  },
});
