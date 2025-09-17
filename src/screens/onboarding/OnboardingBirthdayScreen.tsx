import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';

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
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i); // 100 years range (more reasonable)
  
  // Ensure selected day is valid for the selected month
  useEffect(() => {
    if (selectedDay > daysInSelectedMonth) {
      setSelectedDay(daysInSelectedMonth);
    }
  }, [selectedMonth, selectedYear, selectedDay, daysInSelectedMonth]);

  useEffect(() => {
    // Clear errors when component mounts
    clearErrors();
  }, [clearErrors]);

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
        // Handle step errors from context
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
    // Direct calculation - offset is from the actual scroll position
    // We add ITEM_HEIGHT because of the top padding
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

  React.useEffect(() => {
    // Initial scroll positions - scroll to the correct positions
    setTimeout(() => {
      // Month is 0-indexed, scroll directly to that index
      monthScrollRef.current?.scrollTo({ y: selectedMonth * ITEM_HEIGHT, animated: false });
      // Day is 1-indexed, so day 1 is at index 0
      dayScrollRef.current?.scrollTo({ y: (selectedDay - 1) * ITEM_HEIGHT, animated: false });
      // Year - find index in array
      const yearIndex = years.indexOf(selectedYear);
      if (yearIndex !== -1) {
        yearScrollRef.current?.scrollTo({ y: yearIndex * ITEM_HEIGHT, animated: false });
      }
    }, 100);
  }, [selectedMonth, selectedDay, selectedYear, years]);

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
      keyboardAvoiding
    >
      <View style={styles.container}>
        <OnboardingTitle>{"What's your birthday?"}</OnboardingTitle>

        {hasError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Date Pickers */}
        <View style={styles.pickersContainer}>
          {/* Month Picker */}
          <View style={styles.pickerWrapper}>
            <ScrollView
              ref={monthScrollRef}
              style={styles.picker}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => handleScroll(e, 'month')}
              contentContainerStyle={styles.pickerContent}
            >
              <View style={{ height: ITEM_HEIGHT }} />
              {MONTHS.map((month, index) => renderPickerItem(month, index, selectedMonth))}
              <View style={{ height: ITEM_HEIGHT }} />
            </ScrollView>
          </View>

          {/* Day Picker */}
          <View style={styles.pickerWrapper}>
            <ScrollView
              ref={dayScrollRef}
              style={styles.picker}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => handleScroll(e, 'day')}
              contentContainerStyle={styles.pickerContent}
            >
              <View style={{ height: ITEM_HEIGHT }} />
              {days.map((day, index) => renderPickerItem(day, index, selectedDay - 1))}
              <View style={{ height: ITEM_HEIGHT }} />
            </ScrollView>
          </View>

          {/* Year Picker */}
          <View style={styles.pickerWrapper}>
            <ScrollView
              ref={yearScrollRef}
              style={styles.picker}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => handleScroll(e, 'year')}
              contentContainerStyle={styles.pickerContent}
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
            label={saving ? 'Saving...' : 'I confirm that I am 16 years old'}
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
  pickerContent: {
    paddingVertical: 0,
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
    fontWeight: '700', // Pure black for selected text
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
    backgroundColor: theme.colors.overlay.primary10, // 30% opacity of #E24849 (primary color)
    borderRadius: scaleWidth(8),
    height: ITEM_HEIGHT,
    left: 0,
    position: 'absolute',
    right: 0,
    top: ITEM_HEIGHT, // Center selection for 3 visible items
  },
  spacer: {
    flex: 1,
  },
});
