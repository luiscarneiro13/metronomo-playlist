import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';
import { useFonts } from 'expo-font';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { MaterialIcons } from '@expo/vector-icons';

import { useSettings } from '../../hooks/useSettings';
import { createMetronomeEngine } from '../../utils/audioEngine';
import { colors } from '../../theme/colors';

const MIN_BPM = 20;
const MAX_BPM = 300;
const DEFAULT_BPM = 128;
const SWING_ANGLE = 35;

const FONTS = {
  headline: 'Montserrat_700Bold',
  body: 'Inter_400Regular',
  label: 'JetBrainsMono_500Medium',
  display: 'JetBrainsMono_700Bold',
};

function clampBpm(value) {
  return Math.min(Math.max(Math.round(value), MIN_BPM), MAX_BPM);
}

function BpmSlider({ value, onChange }) {
  const [trackWidth, setTrackWidth] = useState(0);

  const updateFromTouch = (x) => {
    if (!trackWidth) return;
    const percent = Math.min(Math.max(x / trackWidth, 0), 1);
    onChange(clampBpm(MIN_BPM + percent * (MAX_BPM - MIN_BPM)));
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => updateFromTouch(evt.nativeEvent.locationX),
    onPanResponderMove: (evt) => updateFromTouch(evt.nativeEvent.locationX),
  });

  const percent = ((value - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 100;

  return (
    <View
      style={styles.sliderTrackWrapper}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${percent}%` }]} />
      </View>
      <View style={[styles.sliderThumb, { left: `${percent}%` }]} />
    </View>
  );
}

export default function PracticaScreen() {
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Inter_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  const { beepSoundId } = useSettings();

  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [bpmText, setBpmText] = useState(String(DEFAULT_BPM));
  const [isPlaying, setIsPlaying] = useState(false);

  const bpmRef = useRef(bpm);
  const isPlayingRef = useRef(false);
  const directionRef = useRef(1);
  const angle = useRef(new Animated.Value(0)).current;
  const beatPulse = useRef(new Animated.Value(0)).current;
  const engineRef = useRef(null);

  useEffect(() => {
    bpmRef.current = bpm;
    setBpmText(String(bpm));
    engineRef.current?.setBpm(bpm);
  }, [bpm]);

  // El beep lo dispara internamente el motor (audioEngine.js), programado
  // contra el reloj de audio (AudioContext.currentTime) en vez del hilo de
  // JS. Este callback solo se ocupa de la parte visual/háptica, y se llama
  // ya sincronizado con el instante real del sonido.
  const triggerBeat = useCallback(() => {
    Vibration.vibrate(10);
    Animated.sequence([
      Animated.timing(beatPulse, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(beatPulse, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    const target = directionRef.current * SWING_ANGLE;
    directionRef.current *= -1;
    Animated.timing(angle, {
      toValue: target,
      duration: 60000 / bpmRef.current,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: true,
    }).start();
  }, [angle, beatPulse]);

  useEffect(() => {
    const engine = createMetronomeEngine();
    engine.setSound(beepSoundId);
    engineRef.current = engine;

    return () => {
      isPlayingRef.current = false;
      angle.stopAnimation();
      engine.dispose();
    };
  }, [angle]);

  useEffect(() => {
    engineRef.current?.setSound(beepSoundId);
  }, [beepSoundId]);

  const handlePlayPause = () => {
    if (isPlaying) {
      isPlayingRef.current = false;
      engineRef.current?.stop();
      angle.stopAnimation();
      setIsPlaying(false);
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);
    engineRef.current?.start(bpmRef.current, triggerBeat);
  };

  const handleStop = () => {
    isPlayingRef.current = false;
    engineRef.current?.stop();
    setIsPlaying(false);
    angle.stopAnimation();
    directionRef.current = 1;
    Animated.timing(angle, { toValue: 0, duration: 150, useNativeDriver: true }).start();
  };

  const handleReset = () => {
    angle.stopAnimation();
    directionRef.current = 1;
    Animated.timing(angle, { toValue: 0, duration: 150, useNativeDriver: true }).start();
  };

  const applyBpm = (nextBpm) => setBpm(clampBpm(nextBpm));

  const handleBpmTextChange = (text) => {
    setBpmText(text.replace(/[^0-9]/g, ''));
  };

  const commitBpmText = () => {
    const parsed = parseInt(bpmText, 10);
    setBpm(clampBpm(Number.isNaN(parsed) ? DEFAULT_BPM : parsed));
  };

  const rotate = angle.interpolate({ inputRange: [-90, 90], outputRange: ['-90deg', '90deg'] });
  const weightTop = 10 + ((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 70;
  const beatLightOpacity = beatPulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const beatLightScale = beatPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.metronomeVisual}>
        <View style={styles.housing}>
          <View style={styles.scaleLines}>
            <View style={[styles.scaleLine, { width: 40 }]} />
            <View style={[styles.scaleLine, { width: 56 }]} />
            <View style={[styles.scaleLine, { width: 72 }]} />
            <View style={[styles.scaleLine, { width: 56 }]} />
            <View style={[styles.scaleLine, { width: 40 }]} />
          </View>

          <View style={styles.pendulumPivotArea}>
            <Animated.View style={[styles.pendulumArm, { transform: [{ translateY: -104 }, { rotate }, { translateY: 104 }] }]}>
              <View style={[styles.pendulumWeight, { top: `${weightTop}%` }]} />
            </Animated.View>
          </View>
          <View style={styles.pivotPoint} />
        </View>

        <Animated.View
          style={[
            styles.beatLight,
            { opacity: beatLightOpacity, transform: [{ scale: beatLightScale }] },
          ]}
        />
      </View>

      <View style={styles.dashboard}>
        <View style={styles.bpmRow}>
          <Pressable
            style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
            onPress={() => applyBpm(bpm - 1)}
          >
            <MaterialIcons name="remove" size={28} color={colors.primaryFixedDim} />
          </Pressable>

          <View style={styles.bpmDisplay}>
            <Text style={styles.tempoGhost}>TEMPO</Text>
            <TextInput
              style={styles.bpmInput}
              value={bpmText}
              onChangeText={handleBpmTextChange}
              onEndEditing={commitBpmText}
              keyboardType="number-pad"
              maxLength={3}
              selectTextOnFocus
            />
            <Text style={styles.bpmCaption}>Beats Per Minute</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
            onPress={() => applyBpm(bpm + 1)}
          >
            <MaterialIcons name="add" size={28} color={colors.primaryFixedDim} />
          </Pressable>
        </View>

        <BpmSlider value={bpm} onChange={applyBpm} />
      </View>

      <View style={styles.transportRow}>
        <Pressable style={({ pressed }) => [styles.transportButton, pressed && styles.pressed]} onPress={handleReset}>
          <MaterialIcons name="restart-alt" size={28} color={colors.onSurfaceVariant} />
        </Pressable>

        <Pressable style={({ pressed }) => [styles.mainPlayButton, pressed && styles.pressed]} onPress={handlePlayPause}>
          <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={44} color="#000000" />
        </Pressable>

        <Pressable style={({ pressed }) => [styles.transportButton, pressed && styles.pressed]} onPress={handleStop}>
          <MaterialIcons name="stop" size={28} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>

      <View style={styles.tapTempoButton}>
        <Text style={styles.tapTempoText}>Tap Tempo</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 24,
  },
  metronomeVisual: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  housing: {
    width: 220,
    height: 260,
    alignItems: 'center',
  },
  scaleLines: {
    position: 'absolute',
    top: 56,
    height: 140,
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 0.2,
  },
  scaleLine: {
    height: 1,
    backgroundColor: colors.onSurface,
  },
  pendulumPivotArea: {
    position: 'absolute',
    bottom: 40,
    height: 208,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pendulumArm: {
    width: 6,
    height: 208,
    borderRadius: 3,
    backgroundColor: colors.surfaceContainerHighest,
  },
  pendulumWeight: {
    position: 'absolute',
    left: '50%',
    marginLeft: -16,
    width: 32,
    height: 40,
    borderRadius: 4,
    backgroundColor: colors.primaryContainer,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  pivotPoint: {
    position: 'absolute',
    bottom: 36,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primaryFixedDim,
  },
  beatLight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primaryContainer,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  dashboard: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 20,
    gap: 32,
  },
  bpmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperButton: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bpmDisplay: {
    alignItems: 'center',
  },
  tempoGhost: {
    fontFamily: FONTS.headline,
    fontSize: 12,
    letterSpacing: 4,
    color: colors.primaryFixedDim,
    opacity: 0.15,
    marginBottom: 2,
  },
  bpmInput: {
    fontFamily: FONTS.display,
    fontSize: 64,
    color: colors.primaryFixedDim,
    textAlign: 'center',
    minWidth: 160,
    padding: 0,
  },
  bpmCaption: {
    fontFamily: FONTS.label,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.outline,
    marginTop: -4,
  },
  sliderTrackWrapper: {
    height: 32,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primaryContainer,
  },
  sliderThumb: {
    position: 'absolute',
    width: 4,
    height: 32,
    marginLeft: -2,
    borderRadius: 2,
    backgroundColor: colors.primaryContainer,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginTop: 16,
  },
  transportButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPlayButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 6,
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
  tapTempoButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    opacity: 0.6,
  },
  tapTempoText: {
    fontFamily: FONTS.label,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
  },
});
