import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';

import BottomTabBar from '../../navigation/BottomTabBar';
import MetronomosScreen from '../Metronomos/MetronomosScreen';
import PlaylistsScreen from '../Playlists/PlaylistsScreen';
import PracticaScreen from '../Practica/PracticaScreen';
import PerfilScreen from '../Perfil/PerfilScreen';
import { colors } from '../../theme/colors';

const SCREENS = {
  metronomos: MetronomosScreen,
  playlists: PlaylistsScreen,
  practica: PracticaScreen,
  perfil: PerfilScreen,
};

export default function HomeScreen() {
  const [fontsLoaded] = useFonts({ JetBrainsMono_500Medium, JetBrainsMono_700Bold });
  const [activeTab, setActiveTab] = useState('metronomos');
  const ActiveScreen = SCREENS[activeTab];

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActiveScreen />
      </View>
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});
