import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing } from 'react-native';
import { useFonts, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { colors } from '../theme/colors';

const LOGO = require('../../assets/splash-icon.png');

export default function SplashScreen({ onFinish }) {
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    JetBrainsMono_500Medium,
  });

  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 4000,
      delay: 100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        onFinish?.();
      }
    });

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blink, {
          toValue: 0.4,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, [blink, onFinish, progress, pulse, shimmer]);

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const shimmerColor = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [colors.onSurfaceVariant, colors.primaryContainer, colors.onSurfaceVariant],
  });

  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressBar, { width: barWidth }]} />
      </View>

      <View style={styles.center}>
        <View style={styles.logoWrap}>
          <Animated.View
            style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}
          />
          <View style={styles.logoBox}>
            <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title}>
            METRÓNOMO <Text style={styles.titleAccent}>PLAYLIST</Text>
          </Text>
          <View style={styles.subtitleRow}>
            <View style={styles.divider} />
            <Animated.Text style={[styles.subtitle, { color: shimmerColor }]}>
              PRECISION TIMING SYSTEM
            </Animated.Text>
            <View style={styles.divider} />
          </View>
        </View>
      </View>

      <View style={styles.statusBlock}>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>BUFFER: READY</Text>
          <Animated.View style={[styles.statusDot, { opacity: glowOpacity }]} />
          <Text style={styles.statusText}>OSCILLATOR: STABLE</Text>
        </View>
        <Animated.Text style={[styles.initText, { opacity: blink }]}>
          Initializing Session...
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.surfaceContainer,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primaryContainer,
  },
  center: {
    alignItems: 'center',
  },
  logoWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primaryContainer,
    opacity: 0.15,
  },
  logoBox: {
    width: 128,
    height: 128,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  textBlock: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    lineHeight: 32,
    color: colors.onSurface,
    letterSpacing: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  titleAccent: {
    color: colors.primaryFixedDim,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    width: 32,
    height: 1,
    backgroundColor: colors.outlineVariant,
  },
  subtitle: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  statusBlock: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
    gap: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    letterSpacing: 1.5,
    color: 'rgba(185, 202, 202, 0.4)',
    textTransform: 'uppercase',
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primaryFixedDim,
  },
  initText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 14,
    color: colors.outline,
    letterSpacing: 0.5,
  },
});
