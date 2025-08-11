import Constants from 'expo-constants';

interface Environment {
  API_URL: string;
  STRIPE_PUBLISHABLE_KEY: string;
  SENTRY_DSN?: string;
  PUSH_NOTIFICATION_PROJECT_ID?: string;
  GOOGLE_MAPS_API_KEY?: string;
  ENABLE_ANALYTICS: boolean;
  ENABLE_CRASH_REPORTING: boolean;
  ENABLE_DEBUG_MENU: boolean;
  APP_NAME: string;
  APP_VERSION: string;
  MIN_API_VERSION: string;
  IS_DEV: boolean;
  IS_PROD: boolean;
  IS_TEST: boolean;
}

const extra = Constants.expoConfig?.extra || {};

const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // Try to get from expo-constants first (for Expo managed workflow)
  const expoValue = extra[key];
  if (expoValue !== undefined) return expoValue;

  // Try to get from process.env (for bare workflow or web)
  // eslint-disable-next-line expo/no-dynamic-env-var
  const processValue = process.env[`EXPO_PUBLIC_${key}`];
  if (processValue !== undefined) return processValue;

  // Return default value
  return defaultValue;
};

const getBooleanEnvVar = (key: string, defaultValue: boolean = false): boolean => {
  const value = getEnvVar(key, String(defaultValue));
  return value === 'true' || value === '1';
};

const NODE_ENV = getEnvVar('NODE_ENV', 'development');

export const env: Environment = {
  // API Configuration
  API_URL: getEnvVar(
    'API_URL',
    __DEV__ ? 'http://localhost:3000/api' : 'https://sharedtable.vercel.app/api'
  ),

  // Third-party Services
  STRIPE_PUBLISHABLE_KEY: getEnvVar('STRIPE_PUBLISHABLE_KEY', ''),
  SENTRY_DSN: getEnvVar('SENTRY_DSN', ''),
  PUSH_NOTIFICATION_PROJECT_ID: getEnvVar('PUSH_NOTIFICATION_PROJECT_ID', ''),
  GOOGLE_MAPS_API_KEY: getEnvVar('GOOGLE_MAPS_API_KEY', ''),

  // Feature Flags
  ENABLE_ANALYTICS: getBooleanEnvVar('ENABLE_ANALYTICS', false),
  ENABLE_CRASH_REPORTING: getBooleanEnvVar('ENABLE_CRASH_REPORTING', !__DEV__),
  ENABLE_DEBUG_MENU: getBooleanEnvVar('ENABLE_DEBUG_MENU', __DEV__),

  // App Info
  APP_NAME: getEnvVar('APP_NAME', 'SharedTable'),
  APP_VERSION: getEnvVar('APP_VERSION', '1.0.0'),
  MIN_API_VERSION: getEnvVar('MIN_API_VERSION', '1'),

  // Environment Flags
  IS_DEV: NODE_ENV === 'development' || __DEV__,
  IS_PROD: NODE_ENV === 'production' && !__DEV__,
  IS_TEST: NODE_ENV === 'test',
};

// Validate required environment variables
const validateEnv = () => {
  const required: (keyof Environment)[] = [];

  // Only validate in production
  if (env.IS_PROD) {
    required.push('API_URL', 'STRIPE_PUBLISHABLE_KEY');
  }

  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file or app.config.js'
    );
  }
};

// Only validate in non-test environments
if (!env.IS_TEST) {
  validateEnv();
}

export default env;
