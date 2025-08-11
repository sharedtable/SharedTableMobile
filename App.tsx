import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { useFonts as useInterFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFonts as useKeaniaFonts, KeaniaOne_400Regular } from '@expo-google-fonts/keania-one';
import { LoadingScreen } from '@/screens/LoadingScreen';
import { WelcomeScreen } from '@/screens/auth/WelcomeScreen';
import { ConfirmationCodeScreen } from '@/screens/auth/ConfirmationCodeScreen';
import { OnboardingNameScreen } from '@/screens/onboarding/OnboardingNameScreen';
import { OnboardingBirthdayScreen } from '@/screens/onboarding/OnboardingBirthdayScreen';
import { OnboardingGenderScreen } from '@/screens/onboarding/OnboardingGenderScreen';
import { OnboardingDependentsScreen } from '@/screens/onboarding/OnboardingDependentsScreen';
import { OnboardingWorkScreen } from '@/screens/onboarding/OnboardingWorkScreen';
import { OnboardingEthnicityScreen } from '@/screens/onboarding/OnboardingEthnicityScreen';
import { OnboardingRelationshipScreen } from '@/screens/onboarding/OnboardingRelationshipScreen';
import { OnboardingLifestyleScreen } from '@/screens/onboarding/OnboardingLifestyleScreen';
import { OnboardingInterestsScreen } from '@/screens/onboarding/OnboardingInterestsScreen';
import { OnboardingPersonalityScreen } from '@/screens/onboarding/OnboardingPersonalityScreen';
import { OnboardingPhotoScreen } from '@/screens/onboarding/OnboardingPhotoScreen';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { HowItWorksScreen } from '@/screens/info/HowItWorksScreen';
import { FAQsScreen } from '@/screens/info/FAQsScreen';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { FilterScreen } from '@/screens/filter/FilterScreen';
import { ReviewScreen } from '@/screens/review/ReviewScreen';

// Hide the native splash screen immediately
SplashScreen.hideAsync();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'confirmation' | 'onboarding-name' | 'onboarding-birthday' | 'onboarding-gender' | 'onboarding-dependents' | 'onboarding-work' | 'onboarding-ethnicity' | 'onboarding-relationship' | 'onboarding-lifestyle' | 'onboarding-personality' | 'onboarding-photo' | 'onboarding-complete' | 'onboarding-photos' | 'onboarding-dietary' | 'onboarding-interests' | 'onboarding-location' | 'onboarding-preferences' | 'onboarding-profile' | 'home' | 'how-it-works' | 'faqs' | 'dashboard' | 'profile' | 'settings' | 'filter' | 'review'>('welcome');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userData, setUserData] = useState<any>({});
  const [isNewUser, setIsNewUser] = useState<boolean>(true); // This would be determined by backend
  
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
  const handleNavigate = (screen: string, data?: any) => {
    console.log('Navigating to:', screen, 'from:', currentScreen);
    
    if (data?.email) {
      setUserEmail(data.email);
      setUserData(prevData => ({ ...prevData, email: data.email }));
    }
    
    // Store user data throughout onboarding
    if (data) {
      setUserData(prevData => ({ ...prevData, ...data }));
    }
    
    // After confirmation, check if new user
    if (screen === 'home' && currentScreen === 'confirmation') {
      // For demo: if email ends with 'new', treat as new user
      if (isNewUser || userEmail.includes('new')) {
        setCurrentScreen('onboarding-name');
        return;
      }
      // Existing users go directly to home
      setCurrentScreen('home');
      return;
    }
    
    setCurrentScreen(screen as any);
  };

  // Render the appropriate screen based on currentScreen state
  const renderScreen = () => {
    switch (currentScreen) {
      case 'confirmation':
        return <ConfirmationCodeScreen onNavigate={handleNavigate} email={userEmail} />;
      case 'onboarding-name':
        return <OnboardingNameScreen onNavigate={handleNavigate} currentStep={1} totalSteps={11} />;
      case 'onboarding-birthday':
        return <OnboardingBirthdayScreen onNavigate={handleNavigate} currentStep={2} totalSteps={11} userData={userData} />;
      case 'onboarding-gender':
        return <OnboardingGenderScreen onNavigate={handleNavigate} currentStep={3} totalSteps={11} userData={userData} />;
      case 'onboarding-dependents':
        return <OnboardingDependentsScreen onNavigate={handleNavigate} currentStep={4} totalSteps={11} userData={userData} />;
      case 'onboarding-work':
        return <OnboardingWorkScreen onNavigate={handleNavigate} currentStep={5} totalSteps={11} userData={userData} />;
      case 'onboarding-ethnicity':
        return <OnboardingEthnicityScreen onNavigate={handleNavigate} currentStep={6} totalSteps={11} userData={userData} />;
      case 'onboarding-relationship':
        return <OnboardingRelationshipScreen onNavigate={handleNavigate} currentStep={7} totalSteps={11} userData={userData} />;
      case 'onboarding-lifestyle':
        return <OnboardingLifestyleScreen onNavigate={handleNavigate} currentStep={8} totalSteps={11} userData={userData} />;
      case 'onboarding-interests':
        return <OnboardingInterestsScreen onNavigate={handleNavigate} currentStep={9} totalSteps={11} userData={userData} />;
      case 'onboarding-personality':
        return <OnboardingPersonalityScreen onNavigate={handleNavigate} currentStep={10} totalSteps={11} userData={userData} />;
      case 'onboarding-photo':
        return <OnboardingPhotoScreen onNavigate={handleNavigate} currentStep={11} totalSteps={11} userData={userData} />;
      case 'onboarding-complete':
        // Final onboarding complete screen
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Welcome to SharedTable!</Text>
            <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 40 }}>Your profile is complete. Let's find you some amazing dining experiences!</Text>
            <Pressable 
              onPress={() => handleNavigate('home')} 
              style={{ padding: 15, backgroundColor: '#E24849', borderRadius: 8, paddingHorizontal: 40 }}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>Get Started</Text>
            </Pressable>
          </View>
        );
      case 'onboarding-photos':
        // Placeholder for photos upload screen
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Photos Upload (Coming Soon)</Text>
            <Pressable 
              onPress={() => handleNavigate('home')} 
              style={{ marginTop: 20, padding: 10, backgroundColor: '#C17B5C', borderRadius: 8 }}
            >
              <Text style={{ color: 'white' }}>Complete Onboarding</Text>
            </Pressable>
          </View>
        );
      case 'onboarding-dietary':
        // Placeholder for dietary preferences screen
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Dietary Preferences (Coming Soon)</Text>
            <Pressable 
              onPress={() => handleNavigate('home')} 
              style={{ marginTop: 20, padding: 10, backgroundColor: '#C17B5C', borderRadius: 8 }}
            >
              <Text style={{ color: 'white' }}>Skip to Home</Text>
            </Pressable>
          </View>
        );
      case 'onboarding-location':
        // Placeholder for location screen
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Location Setup (Coming Soon)</Text>
            <Pressable 
              onPress={() => handleNavigate('home')} 
              style={{ marginTop: 20, padding: 10, backgroundColor: '#C17B5C', borderRadius: 8 }}
            >
              <Text style={{ color: 'white' }}>Skip to Home</Text>
            </Pressable>
          </View>
        );
      case 'onboarding-preferences':
        // Placeholder for preferences screen
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Preferences Setup (Coming Soon)</Text>
            <Pressable 
              onPress={() => handleNavigate('home')} 
              style={{ marginTop: 20, padding: 10, backgroundColor: '#C17B5C', borderRadius: 8 }}
            >
              <Text style={{ color: 'white' }}>Skip to Home</Text>
            </Pressable>
          </View>
        );
      case 'onboarding-profile':
        // Placeholder for next onboarding steps
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Profile Setup (Coming Soon)</Text>
            <Pressable 
              onPress={() => handleNavigate('home')} 
              style={{ marginTop: 20, padding: 10, backgroundColor: '#C17B5C', borderRadius: 8 }}
            >
              <Text style={{ color: 'white' }}>Skip to Home</Text>
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