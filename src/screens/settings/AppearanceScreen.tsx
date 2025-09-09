import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Pressable,
  useColorScheme,
} from 'react-native';

import { Icon } from '@/components/base/Icon';
import { TopBar } from '@/components/navigation/TopBar';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface AppearanceScreenProps {
  onNavigate?: (screen: string, data?: Record<string, unknown>) => void;
}

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeOption {
  mode: ThemeMode;
  title: string;
  subtitle: string;
  icon: string;
}

const THEME_KEY = 'app_theme_mode';

const themeOptions: ThemeOption[] = [
  {
    mode: 'light',
    title: 'Light',
    subtitle: 'Always use light theme',
    icon: 'sun',
  },
  {
    mode: 'dark',
    title: 'Dark',
    subtitle: 'Always use dark theme',
    icon: 'moon',
  },
  {
    mode: 'system',
    title: 'System',
    subtitle: 'Follow device settings',
    icon: 'smartphone',
  },
];

const fontSizeOptions = [
  { key: 'small', title: 'Small', scale: 0.9 },
  { key: 'medium', title: 'Medium', scale: 1.0 },
  { key: 'large', title: 'Large', scale: 1.1 },
  { key: 'extra-large', title: 'Extra Large', scale: 1.2 },
];

export const AppearanceScreen: React.FC<AppearanceScreenProps> = ({ onNavigate }) => {
  const systemColorScheme = useColorScheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>('system');
  const [selectedFontSize, setSelectedFontSize] = useState('medium');
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    loadAppearanceSettings();
  }, []);

  const loadAppearanceSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      const savedFontSize = await AsyncStorage.getItem('app_font_size');
      const savedReduceMotion = await AsyncStorage.getItem('app_reduce_motion');

      if (savedTheme) {
        setSelectedTheme(savedTheme as ThemeMode);
      }
      if (savedFontSize) {
        setSelectedFontSize(savedFontSize);
      }
      if (savedReduceMotion) {
        setReduceMotion(JSON.parse(savedReduceMotion));
      }
    } catch (error) {
      console.error('Failed to load appearance settings:', error);
    }
  };

  const handleThemeChange = async (mode: ThemeMode) => {
    try {
      setSelectedTheme(mode);
      await AsyncStorage.setItem(THEME_KEY, mode);

      // Here you would typically update your app's theme context
      // For now, we'll just save the preference
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const handleFontSizeChange = async (size: string) => {
    try {
      setSelectedFontSize(size);
      await AsyncStorage.setItem('app_font_size', size);

      // You would update your typography scale here
    } catch (error) {
      console.error('Failed to save font size preference:', error);
    }
  };

  const handleReduceMotionChange = async (enabled: boolean) => {
    try {
      setReduceMotion(enabled);
      await AsyncStorage.setItem('app_reduce_motion', JSON.stringify(enabled));

      // You would update your animation settings here
    } catch (error) {
      console.error('Failed to save motion preference:', error);
    }
  };

  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (selectedTheme === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return selectedTheme;
  };

  const handleBack = () => {
    onNavigate?.('settings');
  };

  const renderThemeOption = (option: ThemeOption) => {
    const isSelected = selectedTheme === option.mode;
    const effectiveTheme = getEffectiveTheme();

    return (
      <Pressable
        key={option.mode}
        style={({ pressed }) => [
          styles.themeOption,
          isSelected && styles.selectedThemeOption,
          pressed && styles.pressedOption,
        ]}
        onPress={() => handleThemeChange(option.mode)}
      >
        <View style={[styles.themeIconContainer, isSelected && styles.selectedIconContainer]}>
          <Icon
            name={option.icon as never}
            size={24}
            color={isSelected ? theme.colors.white : theme.colors.primary.main}
          />
        </View>

        <View style={styles.themeContent}>
          <Text style={[styles.themeTitle, isSelected && styles.selectedThemeText]}>
            {option.title}
          </Text>
          <Text style={[styles.themeSubtitle, isSelected && styles.selectedThemeSubtext]}>
            {option.subtitle}
            {option.mode === 'system' && ` (${effectiveTheme})`}
          </Text>
        </View>

        {isSelected && (
          <View style={styles.checkContainer}>
            <Icon name="check" size={20} color={theme.colors.primary.main} />
          </View>
        )}
      </Pressable>
    );
  };

  const renderFontSizeOption = (option: (typeof fontSizeOptions)[0]) => {
    const isSelected = selectedFontSize === option.key;

    return (
      <Pressable
        key={option.key}
        style={({ pressed }) => [
          styles.fontSizeOption,
          isSelected && styles.selectedFontSizeOption,
          pressed && styles.pressedOption,
        ]}
        onPress={() => handleFontSizeChange(option.key)}
      >
        <Text
          style={[
            styles.fontSizeText,
            { fontSize: scaleFont(16 * option.scale) },
            isSelected && styles.selectedFontSizeText,
          ]}
        >
          {option.title}
        </Text>

        {isSelected && (
          <View style={styles.checkContainer}>
            <Icon name="check" size={20} color={theme.colors.primary.main} />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <TopBar title="Appearance" showBack onBack={handleBack} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Theme Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme</Text>
          <Text style={styles.sectionSubtitle}>Choose your preferred theme for the app</Text>
          <View style={styles.themeGrid}>{themeOptions.map(renderThemeOption)}</View>
        </View>

        {/* Font Size */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Font Size</Text>
          <Text style={styles.sectionSubtitle}>Adjust text size for better readability</Text>
          <View style={styles.fontSizeList}>{fontSizeOptions.map(renderFontSizeOption)}</View>
        </View>

        {/* Accessibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessibility</Text>
          <View style={styles.accessibilityList}>
            <Pressable
              style={({ pressed }) => [styles.accessibilityOption, pressed && styles.pressedOption]}
              onPress={() => handleReduceMotionChange(!reduceMotion)}
            >
              <View style={styles.accessibilityContent}>
                <Text style={styles.accessibilityTitle}>Reduce Motion</Text>
                <Text style={styles.accessibilitySubtitle}>
                  Minimize animations and transitions
                </Text>
              </View>
              <View style={[styles.toggleContainer, reduceMotion && styles.toggleActive]}>
                {reduceMotion && <Icon name="check" size={16} color={theme.colors.white} />}
              </View>
            </Pressable>
          </View>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewContainer}>
            <View style={styles.previewCard}>
              <Text
                style={[
                  styles.previewTitle,
                  {
                    fontSize: scaleFont(
                      18 * (fontSizeOptions.find((f) => f.key === selectedFontSize)?.scale || 1)
                    ),
                  },
                ]}
              >
                Sample Event
              </Text>
              <Text
                style={[
                  styles.previewSubtitle,
                  {
                    fontSize: scaleFont(
                      14 * (fontSizeOptions.find((f) => f.key === selectedFontSize)?.scale || 1)
                    ),
                  },
                ]}
              >
                This is how text will appear with your current settings
              </Text>
              <View style={styles.previewButton}>
                <Text
                  style={[
                    styles.previewButtonText,
                    {
                      fontSize: scaleFont(
                        16 * (fontSizeOptions.find((f) => f.key === selectedFontSize)?.scale || 1)
                      ),
                    },
                  ]}
                >
                  Join Event
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: scaleHeight(50) }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  accessibilityContent: {
    flex: 1,
  },
  accessibilityList: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.ui.lightGray,
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    marginHorizontal: scaleWidth(16),
    overflow: 'hidden',
  },
  accessibilityOption: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
  },
  accessibilitySubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginTop: scaleHeight(2),
  },
  accessibilityTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '500',
  },
  checkContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(16),
    height: scaleWidth(32),
    justifyContent: 'center',
    width: scaleWidth(32),
  },
  container: {
    backgroundColor: theme.colors.background.paper,
    flex: 1,
  },
  fontSizeList: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.ui.lightGray,
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    marginHorizontal: scaleWidth(16),
    overflow: 'hidden',
  },
  fontSizeOption: {
    alignItems: 'center',
    borderBottomColor: theme.colors.ui.lighterGray,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
  },
  fontSizeText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
  },
  pressedOption: {
    transform: [{ scale: 0.98 }],
  },
  previewButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(12),
  },
  previewButtonText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.ui.lightGray,
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    padding: scaleWidth(20),
  },
  previewContainer: {
    marginHorizontal: scaleWidth(16),
  },
  previewSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: scaleFont(20),
    marginBottom: scaleHeight(16),
  },
  previewTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.bold,
    fontWeight: '700',
    marginBottom: scaleHeight(8),
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: scaleHeight(32),
  },
  sectionSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    marginBottom: scaleHeight(16),
    marginHorizontal: scaleWidth(16),
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: scaleFont(20),
    fontWeight: '700',
    marginBottom: scaleHeight(8),
    marginHorizontal: scaleWidth(16),
  },
  selectedFontSizeOption: {
    backgroundColor: theme.colors.primary.light,
  },
  selectedFontSizeText: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  selectedIconContainer: {
    backgroundColor: theme.colors.primary.main,
  },
  selectedThemeOption: {
    backgroundColor: theme.colors.primary.light,
    borderColor: theme.colors.primary.main,
  },
  selectedThemeSubtext: {
    color: theme.colors.primary.main,
  },
  selectedThemeText: {
    color: theme.colors.primary.main,
  },
  themeContent: {
    flex: 1,
  },
  themeGrid: {
    marginHorizontal: scaleWidth(16),
  },
  themeIconContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.light,
    borderRadius: scaleWidth(24),
    height: scaleWidth(48),
    justifyContent: 'center',
    marginRight: scaleWidth(16),
    width: scaleWidth(48),
  },
  themeOption: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.ui.lightGray,
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: scaleHeight(12),
    padding: scaleWidth(20),
  },
  themeSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginTop: scaleHeight(2),
  },
  themeTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  toggleActive: {
    backgroundColor: theme.colors.primary.main,
  },
  toggleContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.ui.lightGray,
    borderRadius: scaleWidth(16),
    height: scaleWidth(32),
    justifyContent: 'center',
    width: scaleWidth(32),
  },
});
