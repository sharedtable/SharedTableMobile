# SharedTable Mobile App

React Native mobile application for SharedTable - Stanford's social dining platform.

## Overview

This is the mobile frontend for SharedTable, connecting to the existing Next.js backend API. The app allows Stanford students to:

- 📱 Browse and book dinner events
- 👥 Connect with other students
- 💬 Receive notifications
- 👤 Manage their profile
- 💳 Handle payments via Stripe

## Architecture

This mobile app is **frontend-only** and connects to the SharedTableWeb backend:

```
SharedTableMobile (this repo)     SharedTableWeb
     React Native          →→→        Next.js
     Frontend Only         API        Backend + Web
```

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: Zustand
- **API Client**: Axios
- **Forms**: React Hook Form + Zod
- **UI Components**: Custom + React Native Elements
- **Authentication**: Connects to NextAuth backend
- **Storage**: Expo SecureStore

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Studio
- Expo Go app on your phone (for device testing)

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd SharedTableMobile
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create environment configuration:
```bash
# Update app.json with your API URL
# Development: http://localhost:3000/api
# Production: https://your-app.vercel.app/api
```

## Development

### Start the backend first:
```bash
# In SharedTableWeb directory
cd ../SharedTableWeb
npm run dev
```

### Then start the mobile app:
```bash
# In SharedTableMobile directory
npm start
# or
expo start
```

### Run on specific platform:
```bash
npm run ios     # iOS Simulator
npm run android # Android Emulator
npm run web     # Web browser (limited functionality)
```

## Project Structure

```
src/
├── screens/          # Screen components
│   ├── auth/        # Authentication screens
│   └── main/        # Main app screens
├── components/       # Reusable components
├── navigation/       # Navigation setup
├── services/         # API service layer
├── store/           # Zustand state management
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
├── types/           # TypeScript definitions
├── assets/          # Images, fonts, etc.
└── config/          # App configuration
```

## API Integration

The app connects to the SharedTableWeb API endpoints:

### Authentication
- `POST /api/auth/create-account` - Sign up
- `POST /api/auth/login` - Sign in
- `GET /api/auth/session` - Get session
- `POST /api/auth/logout` - Sign out

### Reservations
- `GET /api/reservations/available` - List events
- `POST /api/reservations/book` - Book event
- `GET /api/bookings/my-bookings` - User's bookings

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

## Key Features

### 🔐 Authentication
- Stanford email validation
- Secure token storage
- Auto-refresh tokens

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

1. **Development**: Use Expo Go app
2. **Testing**: Build development client
3. **Production**: Submit to App Store / Google Play

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

### Connection Issues
- Ensure backend is running
- Check API URL configuration
- Verify network connectivity

### Build Issues
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Reset Metro: `npx react-native start --reset-cache`

## Contributing

1. Create feature branch
2. Make changes
3. Test on both platforms
4. Submit pull request

## License

[Your License]

## Contact

[Your Contact Info]