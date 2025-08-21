// Polyfills for Privy and React Native
// MUST be imported before anything else

// 1. Setup crypto polyfill
import 'react-native-get-random-values';

// 2. Setup Buffer polyfill
import { Buffer } from '@craftzdog/react-native-buffer';
global.Buffer = Buffer;

// 3. Setup TextEncoder/TextDecoder without using react-native-polyfill-globals
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TextEncodingPolyfill = require('text-encoding');
global.TextEncoder = TextEncodingPolyfill.TextEncoder;
global.TextDecoder = TextEncodingPolyfill.TextDecoder;

// 4. Setup process polyfill
if (typeof global.process === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  global.process = require('process');
  global.process.env = global.process.env || {};
  global.process.version = global.process.version || 'v16.0.0';
}
