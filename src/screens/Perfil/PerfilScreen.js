import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';

// Placeholder temporal: la pantalla real de perfil se definirá después.
export default function PerfilScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Bienvenido, {user?.name}</Text>
      <Pressable style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  text: {
    color: colors.onSurface,
    fontSize: 16,
  },
  button: {
    height: 48,
    paddingHorizontal: 24,
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.onPrimaryContainer,
    fontWeight: '700',
  },
});
