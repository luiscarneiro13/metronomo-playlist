import React, { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import SplashScreen from './src/components/SplashScreen';
import LoginScreen from './src/screens/Login/LoginScreen';
import HomeScreen from './src/screens/Home/HomeScreen';
import { AuthProvider } from './src/contexts/AuthContext';
import { useAuth } from './src/hooks/useAuth';
import { colors } from './src/theme/colors';

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const { status } = useAuth();

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (showSplash || status === 'hydrating') {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (status === 'authenticated') {
    return <HomeScreen />;
  }

  return <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <View style={styles.root}>
        <StatusBar style="light" />
        <AppContent />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
