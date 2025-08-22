// Polyfills for Privy and React Native
// MUST be imported before anything else

// 1. Setup crypto polyfill
import 'react-native-get-random-values';

// 2. Setup Buffer polyfill
import { Buffer } from '@craftzdog/react-native-buffer';
globalThis.Buffer = Buffer;

// 3. Setup TextEncoder/TextDecoder without using react-native-polyfill-globals
import { TextEncoder, TextDecoder } from 'text-encoding';
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

// 4. Setup process polyfill
import process from 'process';
if (typeof globalThis.process === 'undefined') {
  globalThis.process = process;
  globalThis.process.env = globalThis.process.env || {};
  globalThis.process.version = globalThis.process.version || 'v16.0.0';
}
