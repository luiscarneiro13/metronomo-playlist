import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFonts } from 'expo-font';
import { Montserrat_700Bold, Montserrat_800ExtraBold } from '@expo-google-fonts/montserrat';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LOGO = require('../../../assets/logo.png');

const FONTS = {
  headline: 'Montserrat_800ExtraBold',
  label: 'JetBrainsMono_500Medium',
  labelBold: 'JetBrainsMono_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  action: 'Montserrat_700Bold',
};

function useBeatVisualizer(dotCount, intervalMs) {
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % dotCount);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [dotCount, intervalMs]);

  return activeDot;
}

export default function LoginScreen() {
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const activeDot = useBeatVisualizer(4, 500);
  const cardGlow = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    Animated.timing(cardGlow, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const handleBlur = () => {
    Animated.timing(cardGlow, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const handleSubmit = async () => {
    if (!EMAIL_REGEX.test(email)) {
      setErrorMessage('Ingresá un email válido.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  const shadowOpacity = cardGlow.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.4] });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.title}>
            METRÓNOMO <Text style={styles.titleAccent}>PLAYLIST</Text>
          </Text>
          <Text style={styles.subtitle}>Por Luis Carneiro</Text>
        </View>

        <Animated.View style={[styles.card, { shadowOpacity }]}>
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <MaterialIcons name="mail" size={16} color={colors.onSurfaceVariant} />
              <Text style={styles.label}>EMAIL</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="usuario@metroflow.com"
              placeholderTextColor="rgba(132, 148, 149, 0.4)"
              value={email}
              onChangeText={setEmail}
              onFocus={handleFocus}
              onBlur={handleBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <View style={styles.labelRowBetween}>
              <View style={styles.labelRow}>
                <MaterialIcons name="lock" size={16} color={colors.onSurfaceVariant} />
                <Text style={styles.label}>PASSWORD</Text>
              </View>
              {/* <Pressable>
                <Text style={styles.forgotLink}>¿Olvidaste tu contraseña?</Text>
              </Pressable> */}
            </View>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor="rgba(132, 148, 149, 0.4)"
                value={password}
                onChangeText={setPassword}
                onFocus={handleFocus}
                onBlur={handleBlur}
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setPasswordVisible((v) => !v)}
                hitSlop={8}
              >
                <MaterialIcons
                  name={passwordVisible ? 'visibility-off' : 'visibility'}
                  size={20}
                  color={colors.onSurfaceVariant}
                />
              </Pressable>
            </View>
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.pressed,
              submitting && styles.loginButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimaryContainer} />
            ) : (
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            )}
          </Pressable>

          {/* <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>O CONTINUAR CON</Text>
            <View style={styles.divider} />
          </View>

          <Pressable style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}>
            <FontAwesome name="google" size={18} color={colors.onSurface} />
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </Pressable> */}
        </Animated.View>

        {/* <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿No tienes una cuenta?{' '}
            <Text style={styles.footerLink}>Crear cuenta</Text>
          </Text>
          <View style={styles.footerLinksRow}>
            <Text style={styles.footerSmallLink}>TÉRMINOS</Text>
            <Text style={styles.footerSmallLink}>PRIVACIDAD</Text>
            <Text style={styles.footerSmallLink}>SOPORTE</Text>
          </View>
        </View> */}
      </ScrollView>

      <View style={styles.beatVisualizer} pointerEvents="none">
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[styles.beatDot, index === activeDot && styles.beatDotActive]}
          />
        ))}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  glowTopRight: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.primaryContainer,
    opacity: 0.06,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.secondaryContainer,
    opacity: 0.04,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBox: {
    width: 64,
    height: 64,
    marginBottom: 20,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontFamily: FONTS.headline,
    fontSize: 24,
    letterSpacing: -0.5,
    color: colors.primaryFixedDim,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  titleAccent: {
    color: colors.primaryFixedDim,
  },
  subtitle: {
    fontFamily: FONTS.label,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
    opacity: 0.6,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 24,
    gap: 24,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 4,
  },
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: FONTS.label,
    fontSize: 13,
    letterSpacing: 1,
    color: colors.onSurfaceVariant,
  },
  forgotLink: {
    fontFamily: FONTS.label,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.primaryFixedDim,
    textTransform: 'uppercase',
  },
  input: {
    height: 48,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 16,
    color: colors.onSurface,
    fontFamily: FONTS.body,
    fontSize: 15,
  },
  passwordWrapper: {
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
  loginButton: {
    height: 48,
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontFamily: FONTS.action,
    fontSize: 16,
    fontWeight: '700',
    color: colors.onPrimaryContainer,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.outlineVariant,
  },
  dividerText: {
    fontFamily: FONTS.label,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.onSurfaceVariant,
  },
  googleButton: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: colors.onSurface,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 16,
  },
  footerText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  footerLink: {
    fontFamily: FONTS.bodyMedium,
    fontWeight: '700',
    color: colors.primaryFixedDim,
  },
  footerLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    opacity: 0.4,
  },
  footerSmallLink: {
    fontFamily: FONTS.label,
    fontSize: 11,
    color: colors.onSurface,
  },
  beatVisualizer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  beatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 245, 255, 0.2)',
  },
  beatDotActive: {
    backgroundColor: colors.primaryContainer,
    transform: [{ scale: 1.25 }],
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
});
