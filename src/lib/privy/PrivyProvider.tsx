import { PrivyProvider as PrivySDKProvider } from '@privy-io/expo';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

// Complete OAuth redirects on web
if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

interface PrivyProviderProps {
  children: React.ReactNode;
}

export const PrivyProvider: React.FC<PrivyProviderProps> = ({ children }) => {
  // Use the Privy App ID from environment or fallback
  const privyAppId = process.env.EXPO_PUBLIC_PRIVY_APP_ID || 'cmej9f9cp00xbl10b8zwjifec';
  // Try using the Default mobile app client ID first (host.exp.Exponent)
  const clientId = 'client-WY6Ppjah1dhv2xgZRFRfgyjd91G831H9ZaNYgSwNcBKmG';

  useEffect(() => {
    // Warm up the browser for OAuth flows on mobile
    if (Platform.OS !== 'web') {
      WebBrowser.warmUpAsync();

      return () => {
        WebBrowser.coolDownAsync();
      };
    }
  }, []);

  // Log the environment for debugging
  useEffect(() => {
    if (__DEV__) {
      console.log('Privy Configuration:', {
        appId: privyAppId,
        clientId,
        platform: Platform.OS,
        expoVersion: Constants.expoVersion,
        manifest: Constants.expoConfig,
      });
    }
  }, [privyAppId, clientId]);

  return (
    <PrivySDKProvider appId={privyAppId} clientId={clientId}>
      {children}
    </PrivySDKProvider>
  );
};
