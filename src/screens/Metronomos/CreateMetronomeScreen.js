import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { MaterialIcons } from '@expo/vector-icons';

import { createMetronome } from '../../services/metronomesService';
import { colors } from '../../theme/colors';

const MIN_BPM = 20;
const MAX_BPM = 300;

const FONTS = {
  headline: 'Montserrat_700Bold',
  body: 'Inter_400Regular',
  label: 'JetBrainsMono_500Medium',
};

export default function CreateMetronomeScreen({ onBack, onCreated }) {
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Inter_400Regular,
    JetBrainsMono_500Medium,
  });

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [bpmText, setBpmText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [titleError, setTitleError] = useState(false);

  const canSubmit = title.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!title.trim()) {
      setTitleError(true);
      setTimeout(() => setTitleError(false), 1000);
      return;
    }

    const parsedBpm = bpmText ? Math.min(Math.max(parseInt(bpmText, 10), MIN_BPM), MAX_BPM) : null;

    setErrorMessage(null);
    setSubmitting(true);
    try {
      const metronome = await createMetronome({
        title: title.trim(),
        artist: artist.trim(),
        bpm: parsedBpm,
      });
      onCreated?.(metronome);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Pressable style={({ pressed }) => [styles.backButton, pressed && styles.pressed]} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={16} color={colors.primaryFixedDim} />
          <Text style={styles.backButtonText}>VOLVER</Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerBar} />
            <Text style={styles.title}>Nuevo Metrónomo</Text>
          </View>
          <Text style={styles.eyebrow}>Agregar Canción</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            Título <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.inputContainer, titleError && styles.inputContainerError]}>
            <MaterialIcons name="music-note" size={22} color={colors.onSurfaceVariant} />
            <TextInput
              style={styles.input}
              placeholder="Ej. Bohemian Rhapsody"
              placeholderTextColor="rgba(185, 202, 202, 0.3)"
              value={title}
              onChangeText={setTitle}
              maxLength={150}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.labelMuted}>Artista</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={22} color={colors.onSurfaceVariant} />
            <TextInput
              style={styles.input}
              placeholder="Ej. Queen"
              placeholderTextColor="rgba(185, 202, 202, 0.3)"
              value={artist}
              onChangeText={setArtist}
              maxLength={150}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.labelMuted}>BPM</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="speed" size={22} color={colors.onSurfaceVariant} />
            <TextInput
              style={styles.input}
              placeholder={`Entre ${MIN_BPM} y ${MAX_BPM} (opcional)`}
              placeholderTextColor="rgba(185, 202, 202, 0.3)"
              value={bpmText}
              onChangeText={(text) => setBpmText(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
          <Text style={styles.hint}>Dejalo vacío para guardarla solo en el listado, sin metrónomo.</Text>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            !canSubmit && styles.submitButtonDisabled,
            pressed && canSubmit && styles.pressed,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator color={colors.onPrimaryContainer} />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Agregar Metrónomo</Text>
              <MaterialIcons name="add-circle" size={22} color={colors.onPrimaryContainer} />
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  backButtonText: {
    fontFamily: FONTS.label,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.primaryFixedDim,
  },
  header: {
    marginBottom: 32,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  headerBar: {
    width: 6,
    height: 28,
    borderRadius: 3,
    backgroundColor: colors.primaryContainer,
  },
  title: {
    fontFamily: FONTS.headline,
    fontSize: 24,
    lineHeight: 32,
    color: colors.onSurface,
  },
  eyebrow: {
    fontFamily: FONTS.label,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
    opacity: 0.8,
  },
  field: {
    gap: 8,
    marginBottom: 24,
  },
  label: {
    fontFamily: FONTS.label,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.primaryFixedDim,
  },
  labelMuted: {
    fontFamily: FONTS.label,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
  },
  required: {
    color: colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 2,
    borderBottomColor: colors.outlineVariant,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    padding: 16,
  },
  inputContainerError: {
    borderBottomColor: colors.error,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: colors.onSurface,
    padding: 0,
  },
  hint: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    opacity: 0.7,
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: FONTS.headline,
    fontSize: 16,
    color: colors.onPrimaryContainer,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
});
