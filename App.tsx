// Import polyfills first - MUST be before any other imports
import './global';

import { useFonts } from 'expo-font';
import { useFonts as useKeaniaFonts, KeaniaOne_400Regular } from '@expo-google-fonts/keania-one';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthSyncProvider } from '@/components/AuthSyncProvider';
import { PrivyProvider } from '@/lib/privy/PrivyProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { NotificationWrapper } from '@/contexts/NotificationWrapper';
import { GlobalStreamChatProvider } from '@/providers/GlobalStreamChatProvider';
import { navigationRef } from '@/services/navigationService';
import { useAuthStore } from '@/store/authStore';
import { setLogLevel } from '@/utils/logger';
import { deepLinkingConfig } from '@/config/deepLinking';
import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';

// Hide the native splash screen immediately
SplashScreen.hideAsync();

// Configure logging - set to 'error' for production, 'info' for debugging
setLogLevel(__DEV__ ? 'info' : 'error');

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function App() {
  const { initializeAuth } = useAuthStore();

  // Load Fraunces and Keania One fonts
  const [frauncesLoaded] = useFonts({
    'Fraunces-Regular': require('./assets/fonts/Fraunces_400Regular.ttf'),
    'Fraunces-Medium': require('./assets/fonts/Fraunces_500Medium.ttf'),
    'Fraunces-SemiBold': require('./assets/fonts/Fraunces_600SemiBold.ttf'),
    'Fraunces-Bold': require('./assets/fonts/Fraunces_700Bold.ttf'),
  });

  const [keaniaLoaded] = useKeaniaFonts({
    'KeaniaOne-Regular': KeaniaOne_400Regular,
  });

  const fontsLoaded = frauncesLoaded && keaniaLoaded;

  // Initialize auth on app start
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (!fontsLoaded) {
    return null;
  }

  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
    Constants.expoConfig?.extra?.stripePublishableKey || 
    'pk_test_51RbygLGUDucRA4CwK6qX0cbghcjUfakoX0z02FiuQLSJ4E5mpzWAyO7KNVpCIC18H67hyIWly6cLn05gy3dfSOrC00d48w6M27';

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <QueryClientProvider client={queryClient}>
          <StripeProvider
            publishableKey={stripePublishableKey}
            merchantIdentifier="merchant.com.sharedtable.app"
            urlScheme="sharedtable"
          >
            <PrivyProvider>
              <AuthSyncProvider>
                <GlobalStreamChatProvider>
                  <NavigationContainer ref={navigationRef} linking={deepLinkingConfig}>
                    <NotificationWrapper>
                      <RootNavigator />
                    </NotificationWrapper>
                  </NavigationContainer>
                </GlobalStreamChatProvider>
              </AuthSyncProvider>
            </PrivyProvider>
          </StripeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
