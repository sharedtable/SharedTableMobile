import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Keyboard } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { OnboardingLayout, OnboardingTitle, OnboardingButton } from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface OnboardingBirthdayScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export const OnboardingBirthdayScreen: React.FC<OnboardingBirthdayScreenProps> = ({
  onNavigate,
  currentStep = 2,
  totalSteps = 3,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentDay = new Date().getDate();

  // Initialize from existing data or defaults
  const existingDate = currentStepData.birthDate ? new Date(currentStepData.birthDate) : null;
  const [selectedMonth, setSelectedMonth] = useState(
    existingDate ? existingDate.getMonth() : currentMonth
  );
  const [selectedDay, setSelectedDay] = useState(
    existingDate ? existingDate.getDate() : currentDay
  );
  const [selectedYear, setSelectedYear] = useState(
    existingDate ? existingDate.getFullYear() : currentYear - 25
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);

  // Helper function to get days in month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Generate arrays for the pickers
  const daysInSelectedMonth = getDaysInMonth(selectedMonth, selectedYear);
  const days = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  // Ensure selected day is valid for the selected month
  useEffect(() => {
    if (selectedDay > daysInSelectedMonth) {
      setSelectedDay(daysInSelectedMonth);
    }
  }, [selectedMonth, selectedYear, selectedDay, daysInSelectedMonth]);

  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  // Dismiss keyboard whenever this screen receives focus
  useFocusEffect(
    React.useCallback(() => {
      // Dismiss keyboard immediately when screen focuses
      Keyboard.dismiss();
      
      // Also dismiss after a small delay to handle any delayed focus events
      const timer = setTimeout(() => {
        Keyboard.dismiss();
      }, 50);
      
      return () => clearTimeout(timer);
    }, [])
  );

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      const birthDate = new Date(selectedYear, selectedMonth, selectedDay);
      const birthdayData = { birthDate };

      // Validate locally first
      const validation = validateOnboardingStep('birthday', birthdayData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      // Save to database
      const success = await saveStep('birthday', birthdayData);

      if (success) {
        console.log('✅ [OnboardingBirthdayScreen] Birthday saved successfully');
        onNavigate?.('onboarding-gender', birthdayData);
      } else {
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your birthday. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingBirthdayScreen] Error saving birthday:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-name');
  };

  const handleScroll = (event: any, type: 'month' | 'day' | 'year') => {
    const offset = event.nativeEvent.contentOffset.y;
    const index = Math.round(offset / ITEM_HEIGHT);

    if (type === 'month') {
      const monthIndex = Math.min(Math.max(0, index), 11);
      setSelectedMonth(monthIndex);
    } else if (type === 'day') {
      const dayValue = Math.min(Math.max(1, index + 1), days.length);
      setSelectedDay(dayValue);
    } else if (type === 'year') {
      const yearIndex = Math.min(Math.max(0, index), years.length - 1);
      setSelectedYear(years[yearIndex]);
    }
  };

  useEffect(() => {
    // Ensure keyboard is dismissed when setting up scroll positions
    Keyboard.dismiss();
    
    // Initial scroll positions
    setTimeout(() => {
      monthScrollRef.current?.scrollTo({ y: selectedMonth * ITEM_HEIGHT, animated: false });
      dayScrollRef.current?.scrollTo({ y: (selectedDay - 1) * ITEM_HEIGHT, animated: false });
      const yearIndex = years.indexOf(selectedYear);
      if (yearIndex !== -1) {
        yearScrollRef.current?.scrollTo({ y: yearIndex * ITEM_HEIGHT, animated: false });
      }
    }, 100);
  }, []);

  const renderPickerItem = (item: string | number, index: number, selectedIndex: number) => {
    const isSelected = index === selectedIndex;
    return (
      <View key={index} style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}>
        <Text style={[styles.pickerText, isSelected && styles.pickerTextSelected]}>{item}</Text>
      </View>
    );
  };

  const hasError = Object.keys(localErrors).length > 0 || Object.keys(stepErrors).length > 0;
  const errorMessage =
    localErrors.birthDate || stepErrors.birthDate || localErrors.general || stepErrors.general;

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
    >
      <View style={styles.container}>
        <OnboardingTitle>{"What's your birthday?"}</OnboardingTitle>

        {hasError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Date Pickers - wrapped to prevent touch blocking */}
        <View style={styles.pickersContainer} pointerEvents="box-none">
          {/* Month Picker */}
          <View style={styles.pickerWrapper} pointerEvents="box-none">
            <ScrollView
              ref={monthScrollRef}
              style={styles.picker}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => handleScroll(e, 'month')}
              scrollEventThrottle={16}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ height: ITEM_HEIGHT }} />
              {MONTHS.map((month, index) => renderPickerItem(month, index, selectedMonth))}
              <View style={{ height: ITEM_HEIGHT }} />
            </ScrollView>
          </View>

          {/* Day Picker */}
          <View style={styles.pickerWrapper} pointerEvents="box-none">
            <ScrollView
              ref={dayScrollRef}
              style={styles.picker}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => handleScroll(e, 'day')}
              scrollEventThrottle={16}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ height: ITEM_HEIGHT }} />
              {days.map((day, index) => renderPickerItem(day, index, selectedDay - 1))}
              <View style={{ height: ITEM_HEIGHT }} />
            </ScrollView>
          </View>

          {/* Year Picker */}
          <View style={styles.pickerWrapper} pointerEvents="box-none">
            <ScrollView
              ref={yearScrollRef}
              style={styles.picker}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => handleScroll(e, 'year')}
              scrollEventThrottle={16}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ height: ITEM_HEIGHT }} />
              {years.map((year, index) =>
                renderPickerItem(year, index, years.indexOf(selectedYear))
              )}
              <View style={{ height: ITEM_HEIGHT }} />
            </ScrollView>
          </View>

          {/* Selection Highlight */}
          <View style={styles.selectionHighlight} pointerEvents="none" />
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label={saving ? 'Saving...' : 'Next'}
            disabled={saving}
            loading={saving}
          />
        </View>
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    paddingBottom: scaleHeight(40),
  },
  container: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: theme.colors.error['100'],
    borderColor: theme.colors.error['300'],
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    marginBottom: scaleHeight(16),
    padding: scaleWidth(12),
  },
  errorText: {
    color: theme.colors.error['600'],
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  picker: {
    height: PICKER_HEIGHT,
  },
  pickerItem: {
    alignItems: 'center',
    height: ITEM_HEIGHT,
    justifyContent: 'center',
  },
  pickerItemSelected: {
    // Selected items will be highlighted by the overlay
  },
  pickerText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
  },
  pickerTextSelected: {
    color: theme.colors.black['1'],
    fontSize: scaleFont(18),
    fontWeight: '700',
  },
  pickerWrapper: {
    flex: 1,
    marginHorizontal: scaleWidth(4),
  },
  pickersContainer: {
    flexDirection: 'row',
    height: PICKER_HEIGHT,
    justifyContent: 'space-between',
    marginTop: scaleHeight(40),
    position: 'relative',
  },
  selectionHighlight: {
    backgroundColor: theme.colors.overlay.primary10,
    borderRadius: scaleWidth(8),
    height: ITEM_HEIGHT,
    left: 0,
    position: 'absolute',
    right: 0,
    top: ITEM_HEIGHT,
  },
  spacer: {
    flex: 1,
  },
});