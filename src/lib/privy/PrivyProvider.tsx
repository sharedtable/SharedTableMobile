import { PrivyProvider as PrivySDKProvider } from '@privy-io/expo';
import React from 'react';

interface PrivyProviderProps {
  children: React.ReactNode;
}

export const PrivyProvider: React.FC<PrivyProviderProps> = ({ children }) => {
  // Use the Privy App ID
  const privyAppId = 'cmej9f9cp00xbl10b8zwjifec';
  const clientId = 'client-WY6Ppjah1dhv2xgZRFRfgyjd91G831H9ZaNfpH7CRdyK6';

  // Configuration is set for Expo Go development

  return (
    <PrivySDKProvider
      appId={privyAppId}
      clientId={clientId}
      config={{
        embedded: {
          ethereum: {
            createOnLogin: 'users-without-wallets', // Create wallet for users who don't have one
            requireUserPasswordOnCreate: false, // Don't require password for wallet creation
            showWalletUIs: true, // Show wallet UI components
          },
        },
      }}
    >
      {children}
    </PrivySDKProvider>
  );
};
