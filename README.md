# SharedTable Mobile App

React Native mobile application with dedicated backend API for SharedTable - Stanford's social dining platform.

## Overview

This repository contains both the mobile frontend (React Native) and dedicated backend API (Express.js) for SharedTable. The app allows Stanford students to:

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

## Environment Variables

Configure in `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:3000/api",
      "productionApiUrl": "https://sharedtable.vercel.app/api"
    }
  }
}
```

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
