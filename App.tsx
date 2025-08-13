import {
  useFonts as useInterFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts as useKeaniaFonts, KeaniaOne_400Regular } from '@expo-google-fonts/keania-one';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/lib/auth';
import { AuthWrapper } from '@/lib/auth/components/AuthWrapper';
import { WelcomeScreen } from '@/screens/auth/WelcomeScreen';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { FilterScreen } from '@/screens/filter/FilterScreen';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { FAQsScreen } from '@/screens/info/FAQsScreen';
import { HowItWorksScreen } from '@/screens/info/HowItWorksScreen';
import { LoadingScreen } from '@/screens/LoadingScreen';
import { OnboardingBirthdayScreen } from '@/screens/onboarding/OnboardingBirthdayScreen';
import { OnboardingDependentsScreen } from '@/screens/onboarding/OnboardingDependentsScreen';
import { OnboardingEthnicityScreen } from '@/screens/onboarding/OnboardingEthnicityScreen';
import { OnboardingGenderScreen } from '@/screens/onboarding/OnboardingGenderScreen';
import { OnboardingInterestsScreen } from '@/screens/onboarding/OnboardingInterestsScreen';
import { OnboardingLifestyleScreen } from '@/screens/onboarding/OnboardingLifestyleScreen';
import { OnboardingNameScreen } from '@/screens/onboarding/OnboardingNameScreen';
import { OnboardingPersonalityScreen } from '@/screens/onboarding/OnboardingPersonalityScreen';
import { OnboardingPhotoScreen } from '@/screens/onboarding/OnboardingPhotoScreen';
import { OnboardingRelationshipScreen } from '@/screens/onboarding/OnboardingRelationshipScreen';
import { OnboardingWorkScreen } from '@/screens/onboarding/OnboardingWorkScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { ReviewScreen } from '@/screens/review/ReviewScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';

// Hide the native splash screen immediately
SplashScreen.hideAsync();

// Inner component that uses auth context
function AppContent() {
  const { user } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<
    | 'welcome'
    | 'onboarding-name'
    | 'onboarding-birthday'
    | 'onboarding-gender'
    | 'onboarding-dependents'
    | 'onboarding-work'
    | 'onboarding-ethnicity'
    | 'onboarding-relationship'
    | 'onboarding-lifestyle'
    | 'onboarding-personality'
    | 'onboarding-photo'
    | 'onboarding-complete'
    | 'onboarding-photos'
    | 'onboarding-dietary'
    | 'onboarding-interests'
    | 'onboarding-location'
    | 'onboarding-preferences'
    | 'onboarding-profile'
    | 'home'
    | 'how-it-works'
    | 'faqs'
    | 'dashboard'
    | 'profile'
    | 'settings'
    | 'filter'
    | 'review'
  >('welcome');

  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isNewUser] = useState<boolean>(false);
  const [userData, setUserData] = useState<Record<string, unknown>>({});

  // Listen to auth state changes
  useEffect(() => {
    if (!user) {
      // User is logged out, navigate to welcome screen
      console.log('🔄 [App] User logged out, navigating to welcome screen');
      setCurrentScreen('welcome');
    } else {
      // User is logged in, check if they need onboarding
      console.log('🔄 [App] User logged in:', user.email);
      // You can add logic here to determine where to navigate based on user state
    }
  }, [user]);

  // Load Keania One and Inter fonts
  const [interLoaded] = useInterFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  const [keaniaLoaded] = useKeaniaFonts({
    'KeaniaOne-Regular': KeaniaOne_400Regular,
  });

  const fontsLoaded = interLoaded && keaniaLoaded;

  useEffect(() => {
    // If fonts are loaded, hide loading screen after a short delay
    if (fontsLoaded) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  if (isLoading || !fontsLoaded) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  // Handle navigation with email data
  const handleNavigate = (screen: string, data?: Record<string, unknown>) => {
    // Navigation debug logging - remove in production

    if (data?.email) {
      setUserEmail(data.email as string);
      setUserData((prevData) => ({ ...prevData, email: data.email }));
    }

    // Store user data throughout onboarding
    if (data) {
      setUserData((prevData) => ({ ...prevData, ...data }));
    }

    // Check if new user when navigating to home
    if (screen === 'home') {
      // For demo: if email ends with 'new', treat as new user
      if (isNewUser || userEmail.includes('new')) {
        setCurrentScreen('onboarding-name');
        return;
      }
      // Existing users go directly to home
      setCurrentScreen('home');
      return;
    }

    setCurrentScreen(screen as typeof currentScreen);
  };

  // Render the appropriate screen based on currentScreen state
  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding-name':
        return <OnboardingNameScreen onNavigate={handleNavigate} currentStep={1} totalSteps={11} />;
      case 'onboarding-birthday':
        return (
          <OnboardingBirthdayScreen
            onNavigate={handleNavigate}
            currentStep={2}
            totalSteps={11}
            userData={userData}
          />
        );
      case 'onboarding-gender':
        return (
          <OnboardingGenderScreen
            onNavigate={handleNavigate}
            currentStep={3}
            totalSteps={11}
            userData={userData}
          />
        );
      case 'onboarding-dependents':
        return (
          <OnboardingDependentsScreen
            onNavigate={handleNavigate}
            currentStep={4}
            totalSteps={11}
            userData={userData}
          />
        );
      case 'onboarding-work':
        return (
          <OnboardingWorkScreen
            onNavigate={handleNavigate}
            currentStep={5}
            totalSteps={11}
            userData={userData}
          />
        );
      case 'onboarding-ethnicity':
        return (
          <OnboardingEthnicityScreen
            onNavigate={handleNavigate}
            currentStep={6}
            totalSteps={11}
            userData={userData}
          />
        );
      case 'onboarding-relationship':
        return (
          <OnboardingRelationshipScreen
            onNavigate={handleNavigate}
            currentStep={7}
            totalSteps={11}
            userData={userData}
          />
        );
      case 'onboarding-lifestyle':
        return (
          <OnboardingLifestyleScreen
            onNavigate={handleNavigate}
            currentStep={8}
            totalSteps={11}
            userData={userData}
          />
        );
      case 'onboarding-interests':
        return (
          <OnboardingInterestsScreen
            onNavigate={handleNavigate}
            currentStep={9}
            totalSteps={11}
            userData={userData}
          />
        );
      case 'onboarding-personality':
        return (
          <OnboardingPersonalityScreen
            onNavigate={handleNavigate}
            currentStep={10}
            totalSteps={11}
            userData={userData}
          />
        );
      case 'onboarding-photo':
        return (
          <OnboardingPhotoScreen
            onNavigate={handleNavigate}
            currentStep={11}
            totalSteps={11}
            userData={userData}
          />
        );
      case 'onboarding-complete':
        // Final onboarding complete screen
        return (
          <View style={styles.completeContainer}>
            <Text style={styles.completeTitle}>Welcome to SharedTable!</Text>
            <Text style={styles.completeSubtitle}>
              Your profile is complete. Let&apos;s find you some amazing dining experiences!
            </Text>
            <Pressable onPress={() => handleNavigate('home')} style={styles.completeButton}>
              <Text style={styles.completeButtonText}>Get Started</Text>
            </Pressable>
          </View>
        );
      case 'onboarding-photos':
        // Placeholder for photos upload screen
        return (
          <View style={styles.centerContainer}>
            <Text>Photos Upload (Coming Soon)</Text>
            <Pressable onPress={() => handleNavigate('home')} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Complete Onboarding</Text>
            </Pressable>
          </View>
        );
      case 'onboarding-dietary':
        // Placeholder for dietary preferences screen
        return (
          <View style={styles.centerContainer}>
            <Text>Dietary Preferences (Coming Soon)</Text>
            <Pressable onPress={() => handleNavigate('home')} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Skip to Home</Text>
            </Pressable>
          </View>
        );
      case 'onboarding-location':
        // Placeholder for location screen
        return (
          <View style={styles.temporaryContainer}>
            <Text>Location Setup (Coming Soon)</Text>
            <Pressable onPress={() => handleNavigate('home')} style={styles.temporaryButton}>
              <Text style={styles.temporaryButtonText}>Skip to Home</Text>
            </Pressable>
          </View>
        );
      case 'onboarding-preferences':
        // Placeholder for preferences screen
        return (
          <View style={styles.temporaryContainer}>
            <Text>Preferences Setup (Coming Soon)</Text>
            <Pressable onPress={() => handleNavigate('home')} style={styles.temporaryButton}>
              <Text style={styles.temporaryButtonText}>Skip to Home</Text>
            </Pressable>
          </View>
        );
      case 'onboarding-profile':
        // Placeholder for next onboarding steps
        return (
          <View style={styles.temporaryContainer}>
            <Text>Profile Setup (Coming Soon)</Text>
            <Pressable onPress={() => handleNavigate('home')} style={styles.temporaryButton}>
              <Text style={styles.temporaryButtonText}>Skip to Home</Text>
            </Pressable>
          </View>
        );
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} />;
      case 'how-it-works':
        return <HowItWorksScreen onNavigate={handleNavigate} />;
      case 'faqs':
        return <FAQsScreen onNavigate={handleNavigate} />;
      case 'dashboard':
        return <DashboardScreen onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfileScreen onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsScreen onNavigate={handleNavigate} />;
      case 'filter':
        return <FilterScreen onNavigate={handleNavigate} />;
      case 'review':
        return <ReviewScreen onNavigate={handleNavigate} />;
      case 'welcome':
      default:
        return <WelcomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {renderScreen()}
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthWrapper>
        <AppContent />
      </AuthWrapper>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  completeButton: {
    backgroundColor: '#E24849',
    borderRadius: 8,
    padding: 15,
    paddingHorizontal: 40,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  completeContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  completeSubtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  skipButton: {
    backgroundColor: '#C17B5C',
    borderRadius: 8,
    marginTop: 20,
    padding: 10,
  },
  skipButtonText: {
    color: '#FFFFFF',
  },
  temporaryButton: {
    backgroundColor: '#C17B5C',
    borderRadius: 8,
    marginTop: 20,
    padding: 10,
  },
  temporaryButtonText: {
    color: 'white',
  },
  temporaryContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
