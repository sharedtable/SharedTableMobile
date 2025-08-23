// Import polyfills first - MUST be before any other imports
import './global';

import {
  useFonts as useInterFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts as useKeaniaFonts, KeaniaOne_400Regular } from '@expo-google-fonts/keania-one';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthSyncProvider } from '@/components/AuthSyncProvider';
import { PrivyProvider } from '@/lib/privy/PrivyProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useAuthStore } from '@/store/authStore';
import { setLogLevel } from '@/utils/logger';

// Hide the native splash screen immediately
SplashScreen.hideAsync();

// Configure logging - set to 'error' for production, 'info' for debugging
setLogLevel(__DEV__ ? 'info' : 'error');

export default function App() {
  const { initializeAuth } = useAuthStore();

  // Load Keania One and Inter fonts
  const [interLoaded] = useInterFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  const [keaniaLoaded] = useKeaniaFonts({
    'KeaniaOne-Regular': KeaniaOne_400Regular,
  });

  const fontsLoaded = interLoaded && keaniaLoaded;

  // Initialize auth on app start
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <PrivyProvider>
          <AuthSyncProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </AuthSyncProvider>
        </PrivyProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
