#!/usr/bin/env node

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🔍 Verifying API Configuration\n');
console.log('='.repeat(50));

// Check environment variables
console.log('Environment Variables:');
console.log(`EXPO_PUBLIC_API_URL: ${process.env.EXPO_PUBLIC_API_URL}`);

// Check app.json
const appJson = require('./app.json');
console.log('\napp.json Configuration:');
console.log(`apiUrl: ${appJson.expo.extra?.apiUrl}`);

// Check if they match Railway
const expectedUrl = 'https://fare-backend-production.up.railway.app/api';
const envUrl = process.env.EXPO_PUBLIC_API_URL;
const appJsonUrl = appJson.expo.extra?.apiUrl;

console.log('\n' + '='.repeat(50));
console.log('Validation Results:');

if (envUrl === expectedUrl) {
  console.log('✅ .env file: Correctly configured');
} else {
  console.log(`❌ .env file: Wrong URL (${envUrl})`);
}

if (appJsonUrl === expectedUrl) {
  console.log('✅ app.json: Correctly configured');
} else {
  console.log(`❌ app.json: Wrong URL (${appJsonUrl})`);
}

console.log('='.repeat(50));

if (envUrl === expectedUrl && appJsonUrl === expectedUrl) {
  console.log('\n✅ Configuration is correct!');
  console.log('\nIf the app is still using the old URL, you need to:');
  console.log('1. Force quit Expo Go app on your phone');
  console.log('2. Clear Expo Go app data/cache');
  console.log('3. Restart the Expo server (already done)');
  console.log('4. Scan the QR code again');
} else {
  console.log('\n❌ Configuration needs fixing');
}