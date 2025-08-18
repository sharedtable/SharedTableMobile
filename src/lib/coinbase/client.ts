import { Waas } from '@coinbase/waas-sdk-react-native';
import Constants from 'expo-constants';

const apiKey =
  Constants.expoConfig?.extra?.coinbaseApiKey || process.env.EXPO_PUBLIC_COINBASE_API_KEY;
const projectId =
  Constants.expoConfig?.extra?.coinbaseProjectId || process.env.EXPO_PUBLIC_COINBASE_PROJECT_ID;

if (!apiKey || !projectId) {
  throw new Error('Missing Coinbase Cloud API credentials. Check your environment variables.');
}

export const initializeCoinbaseWallet = async () => {
  try {
    await Waas.initialize({
      apiKey,
      projectId,
    });
    console.log('Coinbase Wallet SDK initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Coinbase Wallet SDK:', error);
    // You might want to handle this error more gracefully in a production app
  }
};
