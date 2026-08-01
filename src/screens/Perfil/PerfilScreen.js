import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { BEEP_SOUNDS } from '../../utils/beepSynth';
import { playBeepPreview } from '../../utils/audioEngine';
import { colors } from '../../theme/colors';

const FONTS = {
  headline: 'Montserrat_700Bold',
  body: 'Inter_400Regular',
  label: 'JetBrainsMono_500Medium',
};

export default function PerfilScreen() {
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Inter_400Regular,
    JetBrainsMono_500Medium,
  });

  const { user, logout } = useAuth();
  const { beepSoundId, setBeepSoundId } = useSettings();
  const [playingId, setPlayingId] = useState(null);

  const handlePreview = (soundId) => {
    playBeepPreview(soundId);
    setPlayingId(soundId);
    setTimeout(() => setPlayingId((current) => (current === soundId ? null : current)), 250);
  };

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.welcome}>Bienvenido, {user?.name}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Sonido del metrónomo</Text>
        <Text style={styles.sectionHint}>Elegí el beep que vas a escuchar en cada tick durante la práctica.</Text>

        <View style={styles.soundList}>
          {BEEP_SOUNDS.map((sound) => {
            const isSelected = sound.id === beepSoundId;
            const isPlaying = sound.id === playingId;

            return (
              <View key={sound.id} style={[styles.soundRow, isSelected && styles.soundRowSelected]}>
                <Pressable
                  style={styles.soundSelect}
                  onPress={() => setBeepSoundId(sound.id)}
                  hitSlop={4}
                >
                  <MaterialIcons
                    name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={22}
                    color={isSelected ? colors.primaryFixedDim : colors.onSurfaceVariant}
                  />
                  <Text style={[styles.soundLabel, isSelected && styles.soundLabelSelected]}>
                    {sound.label}
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.playButton, (pressed || isPlaying) && styles.pressed]}
                  onPress={() => handlePreview(sound.id)}
                  hitSlop={8}
                >
                  <MaterialIcons name="play-circle-outline" size={26} color={colors.primaryFixedDim} />
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 48,
    gap: 32,
  },
  welcome: {
    fontFamily: FONTS.headline,
    fontSize: 20,
    color: colors.onSurface,
  },
  section: {
    gap: 4,
  },
  sectionLabel: {
    fontFamily: FONTS.label,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.primaryFixedDim,
  },
  sectionHint: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    opacity: 0.8,
    marginBottom: 12,
  },
  soundList: {
    gap: 8,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  soundRowSelected: {
    borderColor: colors.primaryFixedDim,
  },
  soundSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  soundLabel: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: colors.onSurface,
  },
  soundLabelSelected: {
    fontFamily: FONTS.headline,
    fontSize: 15,
  },
  playButton: {
    padding: 4,
  },
  pressed: {
    transform: [{ scale: 0.9 }],
  },
  logoutButton: {
    height: 48,
    paddingHorizontal: 24,
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    fontFamily: FONTS.headline,
    color: colors.onPrimaryContainer,
    fontSize: 15,
  },
});
