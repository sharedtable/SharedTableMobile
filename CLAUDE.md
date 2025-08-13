# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the SharedTable Mobile repository.

## 🎯 Code Quality Mandate

**ALL CODE MUST MEET SENIOR MOBILE ENGINEERING STANDARDS (20+ YEARS EXPERIENCE LEVEL)**

You are acting as a **Principal Mobile Engineer** with extensive experience in:

- High-scale mobile applications at FAANG companies
- React Native apps with millions of daily active users
- Native iOS/Android development when needed
- Performance-critical real-time mobile systems
- Offline-first architecture patterns

## ⚡ CRITICAL MOBILE ENGINEERING PRINCIPLES

### 1. **Mobile-First Mindset**

Every line of code should be written considering:

- Battery consumption and CPU usage
- Network unreliability and offline scenarios
- Limited device memory and storage
- Diverse screen sizes and orientations
- Platform-specific behaviors (iOS vs Android)

### 2. **Zero-Tolerance for Performance Issues**

- NO unnecessary re-renders
- NO memory leaks
- NO blocking the JavaScript thread
- NO unoptimized images or assets
- NO excessive network requests

### 3. **User Experience as Priority**

- App must feel native on both platforms
- Animations must run at 60 FPS
- Touch interactions must respond in <100ms
- Screen transitions must be smooth
- Offline functionality must be seamless

## Development Commands

```bash
# Core development
npm start                   # Start Expo development server
npm run ios                # Run on iOS simulator
npm run android            # Run on Android emulator
npm run web                # Run in web browser (limited)

# Testing
npm test                   # Run Jest tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report

# Code quality
npm run lint              # Run ESLint
npm run format            # Format with Prettier
npm run type-check        # TypeScript type checking

# Building
expo build:ios            # Build iOS app
expo build:android        # Build Android app
eas build --platform all  # Build with EAS
```

## High-Level Architecture

### Core Tech Stack

- **React Native 0.73.6** with Expo SDK 50
- **React Navigation v6** for navigation
- **Zustand** for state management
- **React Query** for server state
- **React Hook Form + Zod** for forms
- **Expo SecureStore** for secure storage
- **Axios** for API communication
- **TypeScript** in strict mode

### Critical Architectural Patterns

#### 1. API Service Layer

The mobile app is **frontend-only** and connects to SharedTableWeb backend:

```
Mobile App → API Service (api.ts) → SharedTableWeb Backend → Database
```

- NO direct database access
- NO backend logic in mobile
- ALL business logic stays on backend
- API service handles auth, retry, caching

#### 2. Navigation Architecture

```
RootNavigator
├── AuthNavigator (unauthenticated)
│   ├── WelcomeScreen
│   ├── LoginScreen
│   ├── SignUpScreen
│   └── ForgotPasswordScreen
└── MainTabNavigator (authenticated)
    ├── HomeStack
    ├── EventsStack
    ├── BookingsStack
    └── ProfileStack
```

#### 3. State Management Pattern

```typescript
// Global state with Zustand
authStore     → Authentication state
userStore     → User profile data
bookingStore  → Bookings and reservations
notificationStore → Push notifications

// Server state with React Query
useQuery      → Fetching data
useMutation   → Modifying data
useInfiniteQuery → Pagination
```

#### 4. Secure Storage Pattern

```typescript
// Sensitive data in SecureStore
SecureStore.setItemAsync('auth_token', token); // Encrypted storage
SecureStore.getItemAsync('auth_token'); // Secure retrieval

// Non-sensitive data in AsyncStorage
AsyncStorage.setItem('preferences', JSON.stringify(prefs));
```

## 📐 MOBILE ARCHITECTURAL STANDARDS

### API Communication

```typescript
// ❌ NEVER write API calls like this
const response = await fetch(API_URL + '/users');
const data = await response.json();

// ✅ ALWAYS use the centralized API service
import { api } from '@/services/api';

const fetchUserProfile = async (): Promise<UserProfile> => {
  try {
    // API service handles:
    // - Authentication headers
    // - Retry logic
    // - Error transformation
    // - Response caching
    const response = await api.getUserProfile();

    if (!response.success) {
      throw new ApiError(response.error);
    }

    return response.data;
  } catch (error) {
    // Proper error handling
    if (error instanceof ApiError) {
      if (error.code === 'NETWORK_ERROR') {
        // Handle offline scenario
        return getCachedProfile();
      }
      throw error;
    }

    // Log to crash analytics
    crashlytics().recordError(error);
    throw new UnexpectedError('Failed to fetch profile');
  }
};
```

### React Native Component Standards

```typescript
// ✅ PRODUCTION-GRADE MOBILE COMPONENT
import React, { memo, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

interface EventCardProps {
  eventId: string;
  onPress?: (eventId: string) => void;
  testID?: string;
}

export const EventCard = memo<EventCardProps>(({
  eventId,
  onPress,
  testID
}) => {
  const insets = useSafeAreaInsets();

  // Optimized data fetching
  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => api.getEventDetails(eventId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Memoized styles
  const styles = useMemo(() =>
    createStyles(insets), [insets]
  );

  // Optimized press handler
  const handlePress = useCallback(() => {
    // Haptic feedback for better UX
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onPress?.(eventId);
  }, [eventId, onPress]);

  if (isLoading) {
    return (
      <View style={styles.skeleton}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed
      ]}
      onPress={handlePress}
      testID={testID}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Event: ${event?.title}`}
    >
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {event?.title}
        </Text>
        <Text style={styles.date}>
          {formatDate(event?.date)}
        </Text>
      </View>
    </Pressable>
  );
});

const createStyles = (insets: EdgeInsets) =>
  StyleSheet.create({
    container: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    pressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
    // ... more styles
  });
```

### Navigation Standards

```typescript
// ✅ Type-safe navigation
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { MainStackParamList } from '@/navigation/types';

type Navigation = NavigationProp<MainStackParamList>;

const MyScreen = () => {
  const navigation = useNavigation<Navigation>();

  const navigateToEvent = useCallback(
    (eventId: string) => {
      navigation.navigate('EventDetails', {
        eventId,
        timestamp: Date.now(), // For analytics
      });
    },
    [navigation]
  );
};
```

### Performance Optimization

```typescript
// ✅ List optimization for large datasets
import { FlashList } from '@shopify/flash-list';

const EventsList = () => {
  const renderItem = useCallback(({ item }) => (
    <EventCard eventId={item.id} />
  ), []);

  const keyExtractor = useCallback(
    (item) => item.id,
    []
  );

  return (
    <FlashList
      data={events}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={120}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={10}
      onEndReachedThreshold={0.5}
      onEndReached={loadMore}
    />
  );
};
```

## Critical File Structure

### Authentication Flow

1. `src/screens/auth/WelcomeScreen.tsx` - Entry point
2. `src/screens/auth/LoginScreen.tsx` - Login form
3. `src/store/authStore.ts` - Auth state management
4. `src/services/api.ts` - API authentication
5. `src/navigation/RootNavigator.tsx` - Auth routing

### Data Flow

1. `src/services/api.ts` - API client
2. `src/hooks/useApi.ts` - API hooks
3. `src/store/*` - Global state stores
4. `src/utils/cache.ts` - Caching utilities

## 🔒 MOBILE SECURITY REQUIREMENTS

### NEVER compromise on mobile security:

1. **Secure Storage**
   - ALWAYS use SecureStore for sensitive data
   - NEVER store passwords in plain text
   - Clear sensitive data on logout

2. **API Communication**
   - ALWAYS use HTTPS
   - Implement certificate pinning for production
   - Validate all API responses

3. **Authentication**
   - Use biometric authentication when available
   - Implement secure token refresh
   - Clear tokens on app backgrounding (if required)

4. **Code Security**
   - Obfuscate JavaScript bundle in production
   - Disable debugging in release builds
   - Implement jailbreak/root detection

## 🚀 MOBILE PERFORMANCE STANDARDS

### React Native Specific

- Use Hermes engine for Android
- Enable ProGuard for Android
- Implement lazy loading for screens
- Optimize image sizes and formats
- Use FastImage for image caching
- Minimize bridge calls

### Memory Management

```typescript
// Clean up subscriptions
useEffect(() => {
  const subscription = EventEmitter.subscribe('event', handler);
  return () => subscription.remove();
}, []);

// Clear caches when needed
useEffect(() => {
  return () => {
    queryClient.removeQueries(['heavy-data']);
  };
}, []);
```

### Bundle Size

- Target <10MB for iOS
- Target <15MB for Android
- Use dynamic imports for large libraries
- Remove unused dependencies
- Enable tree shaking

## 🧪 MOBILE TESTING REQUIREMENTS

### Unit Tests

```typescript
describe('EventCard', () => {
  it('should render correctly', () => {
    const { getByText } = render(
      <EventCard eventId="123" />
    );
    expect(getByText('Event Title')).toBeTruthy();
  });

  it('should handle press events', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <EventCard eventId="123" onPress={onPress} />
    );
    fireEvent.press(getByTestId('event-card'));
    expect(onPress).toHaveBeenCalledWith('123');
  });
});
```

### Integration Tests

```typescript
describe('Authentication Flow', () => {
  it('should login and navigate to home', async () => {
    const { getByTestId } = render(<App />);

    fireEvent.changeText(
      getByTestId('email-input'),
      'test@stanford.edu'
    );
    fireEvent.changeText(
      getByTestId('password-input'),
      'password'
    );
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(getByTestId('home-screen')).toBeTruthy();
    });
  });
});
```

## 📊 MONITORING & ANALYTICS

### Required Analytics Events

```typescript
// Track screen views
analytics.logScreenView({
  screen_name: 'EventDetails',
  screen_class: 'EventDetailsScreen',
});

// Track user actions
analytics.logEvent('book_event', {
  event_id: eventId,
  event_type: eventType,
  price: 10,
});

// Track errors
crashlytics.recordError(error, {
  screen: 'EventDetails',
  action: 'book_event',
});
```

## Platform-Specific Considerations

### iOS

- Handle Safe Area insets
- Implement proper keyboard avoidance
- Support Dynamic Type
- Handle App Tracking Transparency

### Android

- Handle back button properly
- Support different screen densities
- Implement proper status bar handling
- Handle deep linking

## Push Notifications Setup

```typescript
// Register for push notifications
const registerForPushNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== 'granted') {
    return;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  await api.registerPushToken(token.data);
};
```

## Deep Linking Configuration

```typescript
// Handle deep links
const linking = {
  prefixes: ['sharedtable://', 'https://sharedtable.app'],
  config: {
    screens: {
      Main: {
        screens: {
          Events: 'events',
          EventDetails: 'events/:eventId',
          Profile: 'profile/:userId?',
        },
      },
    },
  },
};
```

## 🛠️ MOBILE CODE REVIEW CHECKLIST

Before ANY code is considered complete:

- [ ] **Performance**: No unnecessary re-renders, optimized lists
- [ ] **Memory**: No memory leaks, proper cleanup
- [ ] **Platform**: Works on both iOS and Android
- [ ] **Offline**: Handles network failures gracefully
- [ ] **Security**: Secure storage, HTTPS only
- [ ] **UX**: Smooth animations, responsive touch
- [ ] **Accessibility**: Screen reader support, labels
- [ ] **Testing**: Unit and integration tests
- [ ] **Types**: Full TypeScript coverage
- [ ] **Error Handling**: User-friendly error messages

## 🚨 UNACCEPTABLE MOBILE PRACTICES

The following will NEVER be accepted:

1. `console.log` in production builds
2. Synchronous storage operations
3. Blocking the JS thread
4. Hardcoded API URLs
5. Unhandled promise rejections
6. Memory leaks from subscriptions
7. Platform-specific code without checks
8. Images without optimization
9. Lists without virtualization
10. Navigation without types

## Environment Configuration

The mobile app reads API configuration from `app.json`:

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

## Build & Deployment

### Development Build

```bash
expo run:ios
expo run:android
```

### Production Build

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

### OTA Updates

```bash
expo publish --release-channel production
```

## Current Mobile-Specific Issues

### Performance

- Image caching not implemented
- No offline support yet
- Bundle size not optimized

### Features Needed

- Biometric authentication
- Push notifications
- Deep linking
- Offline mode
- Background sync

## 🎓 FINAL WORDS FOR MOBILE

**You are not writing a web app in React Native. You are writing:**

- A native experience that users expect
- An app that works on $50 Android phones
- An app that respects battery life
- An app that works in subways with no signal
- An app that feels as good as Instagram or WhatsApp

**Every component must feel native. Every interaction must be instant.**
