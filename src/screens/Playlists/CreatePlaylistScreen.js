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

import { createPlaylist } from '../../services/playlistsService';
import { colors } from '../../theme/colors';

const FONTS = {
  headline: 'Montserrat_700Bold',
  body: 'Inter_400Regular',
  label: 'JetBrainsMono_500Medium',
};

export default function CreatePlaylistScreen({ onBack, onCreated }) {
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Inter_400Regular,
    JetBrainsMono_500Medium,
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [nameError, setNameError] = useState(false);

  const canSubmit = name.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setNameError(true);
      setTimeout(() => setNameError(false), 1000);
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);
    try {
      const playlist = await createPlaylist({ name: name.trim(), description: description.trim() });
      onCreated?.(playlist);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={({ pressed }) => [styles.backButton, pressed && styles.pressed]} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={16} color={colors.primaryFixedDim} />
          <Text style={styles.backButtonText}>VOLVER</Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerBar} />
            <Text style={styles.title}>Nueva Playlist</Text>
          </View>
          <Text style={styles.eyebrow}>Configuración de Sesión</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            Nombre de la playlist <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.inputContainer, nameError && styles.inputContainerError]}>
            <MaterialIcons name="playlist-add" size={22} color={colors.onSurfaceVariant} />
            <TextInput
              style={styles.nameInput}
              placeholder="Ej. Sesión de Velocidad 180"
              placeholderTextColor="rgba(185, 202, 202, 0.3)"
              value={name}
              onChangeText={setName}
              maxLength={150}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.labelMuted}>Descripción</Text>
          <View style={[styles.inputContainer, styles.textareaContainer]}>
            <MaterialIcons
              name="description"
              size={22}
              color={colors.onSurfaceVariant}
              style={styles.textareaIcon}
            />
            <TextInput
              style={styles.textarea}
              placeholder="Detalles sobre el tempo, tonalidad o instrumentos para esta práctica..."
              placeholderTextColor="rgba(185, 202, 202, 0.3)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={1000}
              textAlignVertical="top"
            />
          </View>
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
              <Text style={styles.submitButtonText}>Crear Playlist</Text>
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
    marginBottom: 32,
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
  nameInput: {
    flex: 1,
    fontFamily: FONTS.headline,
    fontSize: 17,
    color: colors.onSurface,
    padding: 0,
  },
  textareaContainer: {
    alignItems: 'flex-start',
  },
  textareaIcon: {
    marginTop: 2,
  },
  textarea: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.onSurface,
    padding: 0,
    minHeight: 88,
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
    fontSize: 17,
    color: colors.onPrimaryContainer,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
});
