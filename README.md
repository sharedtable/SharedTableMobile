# Fare Mobile App

React Native mobile application with dedicated backend API for Fare - Stanford's social dining platform.

## Overview

This repository contains both the mobile frontend (React Native) and dedicated backend API (Express.js) for Fare. The app allows Stanford students to:

- 📱 Browse and book dinner events
- 👥 Connect with other students
- 🔐 Authenticate with Privy (email, Google, Apple)
- 💬 Receive notifications
- 👤 Manage their profile
- 💳 Handle payments via Stripe
- 💎 Manage crypto wallets

## Architecture

This repository now includes both mobile app and backend:

```
SharedTableMobile (this repo)
├── /src                 →  React Native Mobile App
├── /backend            →  Express.js API Server
│   └── Supabase DB     →  PostgreSQL Database
└── Privy Auth          →  Authentication Provider
```

## Tech Stack

### Mobile App

- **Framework**: React Native with Expo SDK 50
- **Navigation**: React Navigation v6
- **State Management**: Zustand
- **Authentication**: Privy SDK
- **API Client**: Axios
- **Forms**: React Hook Form + Zod
- **UI Components**: Custom components
- **Storage**: Expo SecureStore

### Backend API

- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Privy verification
- **Validation**: Zod schemas
- **Logging**: Winston
- **Development**: tsx (TypeScript executor)

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Studio
- Expo Go app on your phone (for device testing)

## 🚀 Quick Start for Development Team

### 1. Clone and Setup

```bash
# Clone the repository
git clone [repository-url]
cd SharedTableMobile

# Install mobile app dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Setup

#### Backend Environment (.env)

```bash
# Copy the example environment file
cp backend/.env.example backend/.env

# Edit backend/.env and add your keys:
# - SUPABASE_SERVICE_KEY (get from Supabase dashboard)
# - PRIVY_APP_SECRET (get from Privy dashboard)
```

⚠️ **IMPORTANT**: Never commit `.env` files! They're already in `.gitignore`

#### Mobile App Environment

The mobile app reads the backend URL from environment:

```bash
# For iOS Simulator or Android Emulator
# backend/.env already has: ALLOWED_ORIGINS=http://localhost:8081

# For testing on physical device, update backend/.env:
# ALLOWED_ORIGINS=http://localhost:8081,exp://YOUR_IP:8081
# Example: ALLOWED_ORIGINS=http://localhost:8081,exp://192.168.1.5:8081
```

### 3. Start Development Servers

**Open 2 terminal windows:**

#### Terminal 1 - Backend API:

```bash
cd backend
npm run dev
# Backend runs on http://localhost:3001
```

#### Terminal 2 - Mobile App:

```bash
npm start
# or
expo start
# Then press 'i' for iOS or 'a' for Android
```

## Development Commands

### Mobile App Commands

```bash
# Start development server
npm start

# Run on specific platform
npm run ios          # iOS Simulator
npm run android      # Android Emulator
npm run web          # Web browser (limited)

# Code quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking
npm run format       # Format with Prettier
npm test            # Run tests
```

### Backend Commands

```bash
cd backend

# Development
npm run dev          # Start with hot reload
npm run build        # Build for production
npm start           # Run production build

# Code quality
npm run lint         # Run ESLint
npm run format       # Format code
```

## Project Structure

```
.
├── src/                    # Mobile app source code
│   ├── screens/           # Screen components
│   │   ├── auth/         # Login, signup, welcome
│   │   ├── onboarding/   # User onboarding flow
│   │   └── main/         # Main app screens
│   ├── components/        # Reusable components
│   ├── navigation/        # React Navigation setup
│   ├── services/          # API service layer
│   │   └── api/          # API endpoints
│   ├── store/            # Zustand state stores
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Third-party integrations
│   │   └── privy/        # Privy auth provider
│   ├── utils/            # Utility functions
│   └── theme/            # Design tokens & theme
│
├── backend/               # Express.js API server
│   ├── src/
│   │   ├── config/       # Supabase, Privy config
│   │   ├── middleware/   # Auth, error handling
│   │   ├── routes/       # API endpoints
│   │   │   ├── auth.ts   # Authentication
│   │   │   ├── users.ts  # User management
│   │   │   └── wallets.ts # Wallet management
│   │   ├── utils/        # Logger, helpers
│   │   └── index.ts      # Server entry point
│   ├── .env.example      # Environment template
│   └── package.json      # Backend dependencies
│
├── ios/                   # iOS specific files
├── android/              # Android specific files
└── app.json              # Expo configuration
```

## API Endpoints

The backend provides these endpoints:

### Authentication (`/api/auth`)

- `POST /api/auth/sync` - Sync Privy user with database
- `POST /api/auth/verify` - Verify authentication token
- `GET /api/auth/me` - Get current user (requires auth)
- `PUT /api/auth/profile` - Update user profile

### Users (`/api/users`)

- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/profile` - Update profile
- `DELETE /api/users/account` - Delete account
- `GET /api/users/search` - Search users

### Wallets (`/api/wallets`)

- `GET /api/wallets` - Get user's wallets
- `POST /api/wallets` - Add new wallet
- `PUT /api/wallets/:walletId` - Update wallet
- `DELETE /api/wallets/:walletId` - Remove wallet

All authenticated endpoints require Bearer token in header:

```
Authorization: Bearer <privy-auth-token>
```

## Key Features

### 🔐 Authentication

- Multiple auth methods: Email, Google, Apple
- Privy SDK integration
- Secure token storage with Expo SecureStore
- Automatic user sync with backend

### 📅 Event Booking

- Browse available dinners
- Filter by type (friends/singles)
- Real-time availability

### 💬 Notifications

- Push notifications
- In-app notification center
- Unread badges

### 👤 Profile Management

- Photo upload
- Preferences
- Dietary restrictions

### 💳 Payments

- Stripe integration
- $10 deposit handling
- Secure payment flow

## Development Guidelines

### Code Style

- TypeScript strict mode
- Functional components
- React hooks
- Consistent formatting (Prettier)

### State Management

- Zustand for global state
- React Query for server state
- Local state for UI

### Error Handling

- API error interceptors
- User-friendly messages
- Offline support

## Testing

```bash
# Unit tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## Building for Production

### iOS

```bash
expo build:ios
# or with EAS
eas build --platform ios
```

### Android

```bash
expo build:android
# or with EAS
eas build --platform android
```

## Deployment

### Mobile App Deployment

1. **Development**: Use Expo Go app
2. **Testing**: Build development client with EAS
3. **Production**: Submit to stores

```bash
# Build for production
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Backend Deployment

#### Option 1: Vercel (Recommended)

```bash
cd backend
npm i -g vercel
vercel
# Follow prompts, set env variables in dashboard
```

#### Option 2: Railway

1. Push to GitHub
2. Connect repo on railway.app
3. Add environment variables
4. Deploy automatically

#### Option 3: Heroku

```bash
cd backend
heroku create your-app-name
heroku config:set SUPABASE_SERVICE_KEY=xxx
git push heroku main
```

### Production Checklist

- [ ] Set production API URL in mobile app
- [ ] Configure CORS for production domain
- [ ] Enable SSL/HTTPS
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure rate limiting
- [ ] Test auth flow end-to-end
- [ ] Verify database backups

## Troubleshooting

### Backend Connection Issues

```bash
# Check if backend is running
curl http://localhost:3001/health

# For physical device testing, ensure IP is correct:
# In src/services/api/config.ts, update:
const API_BASE_URL = __DEV__
  ? 'http://YOUR_IP:3001/api'  # Replace YOUR_IP
  : 'https://your-api.com/api';
```

### Common Issues & Solutions

1. **"Cannot connect to backend"**
   - Ensure backend is running: `cd backend && npm run dev`
   - Check CORS settings in backend/.env
   - For device: Use computer's IP, not localhost

2. **"Privy authentication failed"**
   - Verify PRIVY_APP_ID matches in both mobile and backend
   - Check PRIVY_APP_SECRET in backend/.env

3. **"Port 3001 already in use"**

   ```bash
   # Kill process on port 3001
   lsof -ti:3001 | xargs kill
   ```

4. **Build/Cache Issues**

   ```bash
   # Clear all caches
   expo start -c
   cd ios && pod install  # iOS only
   npx react-native start --reset-cache
   ```

5. **Environment Variables Not Loading**
   - Restart backend after changing .env
   - Ensure .env is in backend/ folder, not root

## 🔑 Getting API Keys

### Supabase Service Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to Settings → API
4. Copy the `service_role` key (NOT `anon` key)
5. Add to `backend/.env` as `SUPABASE_SERVICE_KEY`

⚠️ **WARNING**: Service role key bypasses Row Level Security. Keep it secret!

### Privy Configuration

1. Go to [Privy Dashboard](https://dashboard.privy.io)
2. Create/select your app
3. Copy the App ID → Use in mobile app
4. Go to Settings → API Keys
5. Copy the App Secret → Add to `backend/.env` as `PRIVY_APP_SECRET`

### Required Environment Variables

```bash
# backend/.env
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_KEY=eyJ...  # Service role key
PRIVY_APP_ID=cmej...         # From Privy dashboard
PRIVY_APP_SECRET=...          # From Privy settings
```

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test on both iOS and Android
3. Ensure ESLint passes: `npm run lint`
4. Commit with clear message
5. Push and create pull request

## License

[Your License]

## Contact

[Your Contact Info]

# Jiashu's Notes

1. Create your `.env` files

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

2. Update both accordingly.

`.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_SUPABASE_SERVICE_KEY
EXPO_PUBLIC_API_URL
EXPO_PUBLIC_PRIVY_APP_ID
EXPO_PUBLIC_STREAM_API_KEY
```

`backend/.env`:

```bash
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
PRIVY_APP_ID
PRIVY_APP_SECRET
STREAM_API_KEY
STREAM_API_SECRET
```

3. Install Dependencies

```bash
npm install
cd backend
npm install
```

You should be good to go at this point in terms of environment setup.

## Developer flow

You'll need two terminals. One for the frontend, one for the backend.

frontend:

```bash
npx expo start --go
a #open on android
```

backend:

```bash
cd backend
npm run dev
```

### Helpful Command on Expo

```bash
r # reloads the app
s # MAKE SURE YOU READ! Switches between Expo Go and dev build.
```

```
npm run lint --fix
```

## Windows Android Emulator Setup:

### Install the Android SDK

- Install [Android Studios](https://developer.android.com/studio)
  - Standard installation should be fine.

#### Additional Configurations

In Android Studio, under `Settings` (bottom left), go to `Language & Frameworks` > `Android SDK`

Under `SDK Platforms`, I just have the latest. Should probably have a few other versions for additional testing.

- Android 16.0 ("Baklava")

Under `SDK Tools`, ensure you have the following at the minimum.

- `Android SDK Build-Tools`
- `Android SDK Command Line Tools`
- `CMake`
- `Android Emulator`
- `Android Emulator hypervisor driver`
- `Android SDK Platform-Tools`

Take note of your SDK location, specified at the top of this window. This is your ANDROID_HOME.

On Windows, add ANDROID_HOME to your environment variables:

```bash
ANDROID_HOME="C:\Users\<USER_NAME>\AppData\Local\Android\Sdk"
```

On Windows, add the following to your PATH variable:

```bash
$ANDROID_HOME\platform-tools
$ANDROID_HOME\cmdline-tools\latest\bin
$ANDROID_HOME\cmdline-tools\latest
```

#### Additional WSL (Windows Subsystem for Linux) Setup:

On Windows, add ANDROID_HOME to your environment variables:

```bash
# This allows ANDROID_HOME access on WSL
WSLENV="ANDROID_HOME/p"
```

Open WSL and add the following to your `.bashrc` file

```bash
export PATH=$PATH:$ANDROID_HOME/latest/cmdline-tools
export PATH=$PATH:$ANDROID_HOME/latest/cmdline-tools/bin
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Ensure `$ANDROID_HOME` works in your WSL environment, without specifying it in `.bashrc`. If it doesn't work... google is your friend :D.

##### Troubleshooting

You might have to run the following since Windows executables have a `.exe` tag, which interfere's with expo and npm's usage of `adb`.

```bash
sudo cp /mnt/c/Users/<USER_NAME>\AppData/Local/Android/sdk/platform-tools/adb.exe /mnt/c/Users/<USER_NAME>\AppData/Local/Android/sdk/platform-tools/adb
```

### Set up your Android emulator

It's very simple if you go through Android Studio:

`Android Studio` > `Projects` > `More Actions` > `Virtual Device Manager`

Feel free to create whatever Android Emulator you want. I just went with the `Pixel 9 Pro`.

Once you've created your emulator, feel free to open it. Give it a few minutes to startup initially.

You can verify your process:

```bash
username:~$ adb devices
List of devices attached
emulator-5554   device

```

#### Troubleshooting

If your emulator doesn't show up, try killing your adb server and restarting it.

```
adb kill-server

adb nodaemon server
```

Note: From my limited understanding, to develop on WSL while running the Android emulator on Windows, you need to use `adb no daemon server`.

#### Expo Go

Install [Expo Go](https://expo.dev/go) on your emulator or device.
I simply downloaded the Android Emulator APK.

<!-- 1. Ensure your environment is up to date.

```bash
sudo apt update
sudo apt upgrade
sudo apt install zip unzip
```

Add a folder for the sdk

```bash
mkdir ~/Android
cd ~/Android
```

Go to [Android Studios](https://developer.android.com/studio) and scroll down to the `Command line tools only` section. Find and copy the latest version of the tools. -->
<!--
```bash
# fileName="commandlinetools-linux-13114758_latest.zip"
fileName="latest_file_name_here"
wget https://dl.google.com/android/repository/${fileName}
unzip ${fileName} -d cmdline-tools
rm -rf ${fileName}
```

Install zlib and JAVA 21 (Note: 21 because it's the latest LTS version). Add JAVA_HOME environment variable and update path for Java.

```bash
sudo apt install lib32z1 openjdk-21-jdk
```

Add this to your .bashrc

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$PATH:$JAVA_HOME/bin

export ANDROID_HOME=~/Android
export PATH=$PATH:$ANDROID_HOME/latest/cmdline-tools
export PATH=$PATH:$ANDROID_HOME/latest/cmdline-tools/bin
```

Don't forget to source!

```bash
. ~/.bashrc
# or
source ~/.bashrc
```

We want to move

```bash
cd ~/Android/cmdline-tools/
mv cmdline-tools latest
cd latest/bin
./sdkmanager --list

#Scroll through and find the latest

# install_androidPlatforms="platforms;android-36-ext19"
# install_buildTools="build-tools;36.0.0-rc5"
# install_cmake="cmake;4.1.0"
install_androidPlatforms="latest_android_platform_name_here"
install_buildTools="latest_build_tools_name_here"
install_cmake="latest_cmake_name_here"

./sdkmanager --install "platform-tools" ${install_androidPlatforms} ${install_buildTools} ${install_cmake}
```

<!-- ```bash
export ANDROID_HOME=~/Android
export PATH=$PATH:$ANDROID_HOME/latest/cmdline-tools
export PATH=$PATH:$ANDROID_HOME/latest/cmdline-tools/bin
# export PATH=$PATH:$ANDROID_HOME/cmdline-tools/platform-tools
``` -->

<!-- https://docs.expo.dev/workflow/android-studio-emulator/#install-watchman-and-jdk -->
