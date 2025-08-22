export default function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: [
            '.ios.ts',
            '.android.ts',
            '.ts',
            '.ios.tsx',
            '.android.tsx',
            '.tsx',
            '.jsx',
            '.js',
            '.json',
          ],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@services': './src/services',
            '@hooks': './src/hooks',
            '@store': './src/store',
            '@utils': './src/utils',
            '@types': './src/types',
            '@assets': './src/assets',
            '@config': './src/config',
          },
        },
      ],
      'react-native-reanimated/plugin', // Note: Reanimated plugin must be last
    ],
  };
}
