import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';

// Canvas vacío a propósito: el contenido de este tab se definirá después.
export default function PracticaScreen() {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
