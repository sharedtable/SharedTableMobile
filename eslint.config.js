// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactNative from 'eslint-plugin-react-native';
import reactHooks from 'eslint-plugin-react-hooks';
// import eslintPluginPrettier from 'eslint-plugin-prettier';
// import simpleImportSort from 'eslint-plugin-simple-import-sort';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  //   importPlugin.flatConfigs.recommended,
  //   importPlugin.flatConfigs.typescript,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json'],
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    rules: {
      // Add or override TypeScript-specific rules here
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-empty-interface': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',

      'no-console': [
        'warn',
        {
          allow: ['warn', 'error', 'log'],
        },
      ],
      'no-debugger': 'error',
      'no-alert': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'no-nested-ternary': 'warn',
    },
  },
  {
    files: ['**/*.{tsx,jsx}'],
    plugins: {
      react,
      'react-native': reactNative,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/display-name': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-native/no-unused-styles': 'error',
      'react-native/split-platform-components': 'error',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'warn',
      'react-native/no-raw-text': [
        'warn',
        {
          skip: ['Text'],
        },
      ],
    },
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'backend/dist/',
      'backend/node_modules/',
      '.expo/',
      '.expo-shared/',
      'babel.config.js',
      'metro.config.cjs',
      'jest.config.js',
      'generate-blank-splash.js',
      'generate-icon.js',
      'generate-splash.js',
      'jest.setup.js',
      '*.config.js',
      '.DS_Store',
      '*.log',
      '.vscode/',
      '.idea/',
      '*.tmp',
      '*.temp',
    ],
  },
];
