import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { AuthStackParamList } from '@/navigation/AuthNavigator';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

interface WelcomeScreenProps {
  onNavigate?: (screen: string, data?: Record<string, unknown>) => void;
}

export const WelcomeScreen = memo<WelcomeScreenProps>(() => {
  const navigation = useNavigation<NavigationProp>();

  const handleGetStarted = () => {
    navigation.navigate('SignIn', { hasInvitation: false });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Text style={styles.logo}>FARE</Text>
          <Text style={styles.tagline}>Curated Dining Experiences</Text>
        </View>

        {/* Middle Content */}
        <View style={styles.middleContent}>
          <Text style={styles.title}>Welcome to Fare</Text>
          <Text style={styles.subtitle}>
            An exclusive community for{'\n'}exceptional dining experiences
          </Text>
        </View>

        {/* Button Section */}
        <View style={styles.buttonSection}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleGetStarted}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>

          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
});

WelcomeScreen.displayName = 'WelcomeScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleWidth(30),
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: scaleHeight(100),
  },
  logo: {
    fontSize: scaleFont(48),
    fontWeight: '700',
    color: theme.colors.primary.main,
    letterSpacing: 4,
    fontFamily: theme.typography.fontFamily.heading,
  },
  tagline: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    marginTop: scaleHeight(8),
    letterSpacing: 1,
    fontFamily: theme.typography.fontFamily.body,
  },
  middleContent: {
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
  },
  title: {
    fontSize: scaleFont(32),
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: scaleHeight(16),
    fontFamily: theme.typography.fontFamily.heading,
  },
  subtitle: {
    fontSize: scaleFont(16),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: scaleFont(24),
    fontFamily: theme.typography.fontFamily.body,
  },
  buttonSection: {
    paddingBottom: scaleHeight(60),
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: scaleHeight(18),
    paddingHorizontal: scaleWidth(60),
    borderRadius: scaleWidth(12),
    alignItems: 'center',
    marginBottom: scaleHeight(20),
    width: '100%',
  },
  primaryButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.white,
    letterSpacing: 0.5,
    fontFamily: theme.typography.fontFamily.body,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  footerText: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.body,
  },
});