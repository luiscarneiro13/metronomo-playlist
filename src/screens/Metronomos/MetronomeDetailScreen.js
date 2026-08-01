import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { updateMetronome, deleteMetronome } from '../../services/metronomesService';
import { colors } from '../../theme/colors';

const MIN_BPM = 20;
const MAX_BPM = 300;

const FONTS = {
  headline: 'Montserrat_700Bold',
  body: 'Inter_400Regular',
  label: 'JetBrainsMono_500Medium',
};

export default function MetronomeDetailScreen({ metronome, onBack, onUpdated, onDeleted }) {
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Inter_400Regular,
    JetBrainsMono_500Medium,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(metronome.title || '');
  const [artist, setArtist] = useState(metronome.artist || '');
  const [bpmText, setBpmText] = useState(metronome.bpm ? String(metronome.bpm) : '');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [titleError, setTitleError] = useState(false);

  const canSubmit = title.trim().length > 0 && !submitting;

  const handleCancelEdit = () => {
    setTitle(metronome.title || '');
    setArtist(metronome.artist || '');
    setBpmText(metronome.bpm ? String(metronome.bpm) : '');
    setErrorMessage(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError(true);
      setTimeout(() => setTitleError(false), 1000);
      return;
    }

    const parsedBpm = bpmText ? Math.min(Math.max(parseInt(bpmText, 10), MIN_BPM), MAX_BPM) : null;

    setErrorMessage(null);
    setSubmitting(true);
    try {
      const updated = await updateMetronome(metronome.id, {
        title: title.trim(),
        artist: artist.trim(),
        bpm: parsedBpm,
      });
      setIsEditing(false);
      onUpdated?.(updated);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar metrónomo',
      `¿Seguro que querés eliminar "${metronome.title}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteMetronome(metronome.id);
              onDeleted?.();
            } catch (error) {
              setDeleting(false);
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
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
            <Text style={styles.title}>{isEditing ? 'Editar Metrónomo' : metronome.title}</Text>
          </View>
          <Text style={styles.eyebrow}>
            {isEditing ? 'Editando canción' : metronome.artist || 'Sin artista'}
          </Text>
        </View>

        {isEditing ? (
          <>
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

            <View style={styles.actionsRow}>
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                onPress={handleCancelEdit}
                disabled={submitting}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.submitButton,
                  styles.flexButton,
                  !canSubmit && styles.submitButtonDisabled,
                  pressed && canSubmit && styles.pressed,
                ]}
                onPress={handleSave}
                disabled={!canSubmit}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.onPrimaryContainer} />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Guardar</Text>
                    <MaterialIcons name="check-circle" size={22} color={colors.onPrimaryContainer} />
                  </>
                )}
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>BPM</Text>
                <Text style={styles.detailValue}>{metronome.bpm ?? '—'}</Text>
              </View>
              <View style={[styles.detailRow, styles.detailRowLast]}>
                <Text style={styles.detailLabel}>Metrónomo</Text>
                <Text style={styles.detailValue}>
                  {metronome.has_metronome ? 'Activo' : 'Sin metrónomo'}
                </Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.submitButtonText}>Editar</Text>
              <MaterialIcons name="edit" size={20} color={colors.onPrimaryContainer} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color={colors.error} />
              ) : (
                <>
                  <Text style={styles.deleteButtonText}>Eliminar metrónomo</Text>
                  <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                </>
              )}
            </Pressable>
          </>
        )}
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
    flexShrink: 1,
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
  detailCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontFamily: FONTS.label,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
  },
  detailValue: {
    fontFamily: FONTS.headline,
    fontSize: 16,
    color: colors.onSurface,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  flexButton: {
    flex: 1,
    marginTop: 0,
  },
  secondaryButton: {
    height: 56,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: FONTS.headline,
    fontSize: 16,
    color: colors.onSurface,
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
  deleteButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  deleteButtonText: {
    fontFamily: FONTS.headline,
    fontSize: 16,
    color: colors.error,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
});
