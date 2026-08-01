import React, { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import SplashScreen from './src/components/SplashScreen';
import LoginScreen from './src/screens/Login/LoginScreen';
import HomeScreen from './src/screens/Home/HomeScreen';
import { AuthProvider } from './src/contexts/AuthContext';
import { ConnectivityProvider } from './src/contexts/ConnectivityContext';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { SyncProvider } from './src/contexts/SyncContext';
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

function Root() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <AppContent />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaProvider>
        <AuthProvider>
          <ConnectivityProvider>
            <SyncProvider>
              <SettingsProvider>
                <Root />
              </SettingsProvider>
            </SyncProvider>
          </ConnectivityProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
