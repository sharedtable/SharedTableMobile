import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/base/Icon';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface OnboardingBirthdayScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
  currentStep?: number;
  totalSteps?: number;
  userData?: any;
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
  totalSteps = 10,
  userData = {},
}) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentDay = new Date().getDate();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [selectedYear, setSelectedYear] = useState(currentYear - 25); // Default to 25 years ago

  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);

  // Generate arrays for the pickers
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 120 }, (_, i) => currentYear - i); // 120 years range

  const handleNext = () => {
    const birthday = new Date(selectedYear, selectedMonth, selectedDay);

    // Validate age (must be at least 18)
    const age = Math.floor(
      (new Date().getTime() - birthday.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    if (age < 18) {
      Alert.alert('Age Requirement', 'You must be at least 18 years old to use SharedTable');
      return;
    }

    onNavigate?.('onboarding-gender', {
      ...userData,
      birthday: birthday.toISOString(),
      age,
    });
  };

  const handleBack = () => {
    onNavigate?.('onboarding-name');
  };

  const handleScroll = (event: any, type: 'month' | 'day' | 'year') => {
    const offset = event.nativeEvent.contentOffset.y;

    // The selected item is at position ITEM_HEIGHT from the top of the visible area
    // Since we have padding at the top, we need to calculate which item is at that position
    let index: number;

    if (type === 'year') {
      // Year has 2 * ITEM_HEIGHT padding at top
      // Selected position is at offset + ITEM_HEIGHT (since selection highlight is at ITEM_HEIGHT)
      index = Math.round((offset + ITEM_HEIGHT) / ITEM_HEIGHT) - 2;
    } else {
      // Month and day have 1 * ITEM_HEIGHT padding at top
      // Selected position is at offset + ITEM_HEIGHT
      index = Math.round((offset + ITEM_HEIGHT) / ITEM_HEIGHT) - 1;
    }

    if (type === 'month') {
      const monthIndex = Math.min(Math.max(0, index), 11);
      setSelectedMonth(monthIndex);
    } else if (type === 'day') {
      const dayValue = Math.min(Math.max(1, index + 1), 31);
      setSelectedDay(dayValue);
    } else if (type === 'year') {
      const yearIndex = Math.min(Math.max(0, index), years.length - 1);
      setSelectedYear(years[yearIndex]);
    }
  };

  const scrollToIndex = (
    scrollRef: React.RefObject<ScrollView | null>,
    index: number,
    type: 'month' | 'day' | 'year' = 'month'
  ) => {
    // Month and day have 1 ITEM_HEIGHT padding, year has 2 ITEM_HEIGHT padding
    const paddingHeight = type === 'year' ? ITEM_HEIGHT * 2 : ITEM_HEIGHT;
    const scrollPosition = index * ITEM_HEIGHT + paddingHeight;
    scrollRef.current?.scrollTo({ y: scrollPosition, animated: true });
  };

  React.useEffect(() => {
    // Initial scroll positions
    setTimeout(() => {
      scrollToIndex(monthScrollRef, selectedMonth, 'month');
      scrollToIndex(dayScrollRef, selectedDay - 1, 'day');
      const yearIndex = years.indexOf(selectedYear);
      scrollToIndex(yearScrollRef, yearIndex, 'year');
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

  // Calculate progress percentage
  const progress = (currentStep / totalSteps) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleBack} style={styles.headerButton}>
              <Icon name="chevron-left" size={24} color={theme.colors.text.primary} />
            </Pressable>
            <View style={styles.headerSpacer} />
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>What's your birthday?</Text>

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
                <View style={{ height: ITEM_HEIGHT * 2 }} />
                {years.map((year, index) =>
                  renderPickerItem(year, index, years.indexOf(selectedYear))
                )}
                <View style={{ height: ITEM_HEIGHT * 2 }} />
              </ScrollView>
            </View>

            {/* Selection Highlight */}
            <View style={styles.selectionHighlight} pointerEvents="none" />
          </View>
        </View>

        {/* Bottom Button - Fixed Position */}
        <View style={styles.bottomContainer}>
          <Pressable style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    backgroundColor: theme.colors.white,
    bottom: 0,
    left: scaleWidth(24),
    paddingBottom: scaleHeight(40),
    paddingTop: scaleHeight(20),
    position: 'absolute',
    right: scaleWidth(24),
  },
  container: {
    backgroundColor: theme.colors.white,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleWidth(24),
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: -scaleWidth(4),
    paddingBottom: scaleHeight(20),
    paddingTop: scaleHeight(12),
  },
  headerButton: {
    padding: scaleWidth(4),
  },
  headerSpacer: {
    flex: 1,
  },
  nextButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    height: scaleHeight(52),
    justifyContent: 'center',
  },
  nextButtonText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(18),
    fontWeight: '600' as any,
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
    color: '#000000',
    fontSize: scaleFont(18),
    fontWeight: '700' as any, // Pure black for selected text
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
  progressBackground: {
    backgroundColor: '#F0F0F0',
    borderRadius: scaleHeight(2),
    height: scaleHeight(4),
    overflow: 'hidden',
  },
  progressContainer: {
    marginBottom: scaleHeight(32),
  },
  progressFill: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleHeight(2),
    height: '100%',
  },
  scrollContent: {
    flex: 1,
  },
  selectionHighlight: {
    backgroundColor: 'rgba(226, 72, 73, 0.1)', // 30% opacity of #E24849 (primary color)
    borderRadius: scaleWidth(8),
    height: ITEM_HEIGHT,
    left: 0,
    position: 'absolute',
    right: 0,
    top: ITEM_HEIGHT, // Center selection for 3 visible items
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(32),
    fontWeight: '700' as any,
    marginBottom: scaleHeight(40),
  },
});
