const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add specific configurations for Privy and React Native
config.resolver = {
  ...config.resolver,
  // Add support for .cjs files
  sourceExts: [...config.resolver.sourceExts, 'cjs'],
  // Specify how to resolve node modules
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
    crypto: require.resolve('expo-crypto'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('@craftzdog/react-native-buffer'),
    process: require.resolve('process'),
  },
  // Add unstable flags for better module resolution
  unstable_enablePackageExports: true,
  unstable_conditionNames: ['react-native', 'browser', 'require'],
};

module.exports = config;
