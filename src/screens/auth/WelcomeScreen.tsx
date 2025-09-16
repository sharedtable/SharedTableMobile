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
            <Text style={styles.primaryButtonText}>Get started</Text>
          </Pressable>

          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text style={styles.footerLink}>Privacy Policy</Text>
            {' and '}
            <Text style={styles.footerLink}>Terms of Service</Text>
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
    backgroundColor: theme.colors.primary.main,
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleWidth(40),
    paddingBottom: scaleHeight(40),
  },
  logoSection: {
    alignItems: 'center',
    marginTop: scaleHeight(120),
  },
  logo: {
    fontSize: scaleFont(48),
    fontWeight: '400',
    color: theme.colors.white,
    letterSpacing: 8,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: scaleHeight(24),
  },
  subtitle: {
    fontSize: scaleFont(16),
    color: theme.colors.white,
    textAlign: 'center',
    lineHeight: scaleFont(24),
    fontFamily: theme.typography.fontFamily.body,
    paddingHorizontal: scaleWidth(20),
  },
  buttonSection: {
    position: 'absolute',
    bottom: scaleHeight(80),
    left: scaleWidth(40),
    right: scaleWidth(40),
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.white,
    paddingVertical: scaleHeight(16),
    paddingHorizontal: scaleWidth(60),
    borderRadius: scaleWidth(30),
    alignItems: 'center',
    marginBottom: scaleHeight(16),
    width: '100%',
  },
  primaryButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '500',
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  footerText: {
    fontSize: scaleFont(11),
    color: theme.colors.white,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.body,
    opacity: 0.9,
    paddingHorizontal: scaleWidth(20),
  },
  footerLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});