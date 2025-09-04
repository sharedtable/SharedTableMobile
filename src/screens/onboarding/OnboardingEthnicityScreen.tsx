import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Alert, 
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  Pressable,
  ScrollView,
  Platform,
  FlatList
} from 'react-native';

import {
  OnboardingLayout,
  OnboardingButton,
} from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { Colors } from '@/constants/colors';

interface OnboardingEthnicityScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

const nationalityOptions = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Netherlands',
  'Sweden',
  'Norway',
  'Denmark',
  'Japan',
  'South Korea',
  'China',
  'India',
  'Brazil',
  'Mexico',
  'Argentina',
  'Other',
];

const ethnicityOptions = [
  'White / Caucasian',
  'Black / African American',
  'Hispanic / Latino',
  'Asian / Pacific Islander',
  'Native American',
  'Middle Eastern',
  'Mixed / Multiple',
  'Other',
  'Prefer not to say',
];

const religionOptions = [
  'Christianity',
  'Islam',
  'Judaism',
  'Hinduism',
  'Buddhism',
  'Sikhism',
  'Atheist',
  'Agnostic',
  'Spiritual but not religious',
  'Other',
  'Prefer not to say',
];

const relationshipOptions = [
  'Single',
  'Dating',
  'In a Relationship',
  'Engaged',
  'Married',
  'Divorced',
  'Widowed',
  'It\'s Complicated',
  'Prefer not to say',
];

export const OnboardingEthnicityScreen: React.FC<OnboardingEthnicityScreenProps> = ({
  onNavigate,
  currentStep = 6,
  totalSteps = 11,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [nationality, setNationality] = useState<string>(currentStepData.nationality || '');
  const [ethnicity, setEthnicity] = useState<string>(currentStepData.ethnicity || '');
  const [religion, setReligion] = useState<string>(currentStepData.religion || '');
  const [relationshipStatus, setRelationshipStatus] = useState<string>(currentStepData.relationshipStatus || '');
  
  // Height state
  const [heightUnit, setHeightUnit] = useState<'imperial' | 'metric'>('imperial');
  const [feet, setFeet] = useState<number>(5);
  const [inches, setInches] = useState<number>(8);
  const [centimeters, setCentimeters] = useState<number>(173);
  
  // Scroll refs for height pickers
  const feetScrollRef = useRef<FlatList>(null);
  const inchesScrollRef = useRef<FlatList>(null);
  const cmScrollRef = useRef<FlatList>(null);
  
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [showEthnicityDropdown, setShowEthnicityDropdown] = useState(false);
  const [showReligionDropdown, setShowReligionDropdown] = useState(false);
  const [showRelationshipDropdown, setShowRelationshipDropdown] = useState(false);
  
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  // Generate height options
  const feetOptions = Array.from({ length: 5 }, (_, i) => i + 3); // 3ft to 7ft
  const inchesOptions = Array.from({ length: 12 }, (_, i) => i); // 0 to 11 inches
  const cmOptions = Array.from({ length: 121 }, (_, i) => i + 120); // 120cm to 240cm

  useEffect(() => {
    clearErrors();
    // Initialize height if exists
    if (currentStepData.heightFeet && currentStepData.heightInches) {
      setFeet(currentStepData.heightFeet);
      setInches(currentStepData.heightInches);
      setHeightUnit('imperial');
      // Calculate cm for display
      const totalInches = currentStepData.heightFeet * 12 + currentStepData.heightInches;
      setCentimeters(Math.round(totalInches * 2.54));
    } else if (currentStepData.heightCm) {
      setCentimeters(currentStepData.heightCm);
      setHeightUnit('metric');
      // Calculate feet/inches for display
      const totalInches = currentStepData.heightCm / 2.54;
      const ft = Math.floor(totalInches / 12);
      const inch = Math.round(totalInches % 12);
      setFeet(ft);
      setInches(inch);
    }
  }, [clearErrors, currentStepData]);

  // Helper function for FlatList getItemLayout
  const getItemLayout = (_: any, index: number) => ({
    length: 40,
    offset: 40 * index,
    index,
  });

  // Handle scroll failures
  const onScrollToIndexFailed = (info: any) => {
    const wait = new Promise(resolve => setTimeout(resolve, 50));
    wait.then(() => {
      if (info.averageItemLength && info.highestMeasuredFrameIndex) {
        const ref = info.index === 0 ? feetScrollRef : info.index === 1 ? inchesScrollRef : cmScrollRef;
        ref.current?.scrollToIndex({ index: info.index, animated: false });
      }
    });
  };

  // Scroll to initial values when component mounts or unit changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (heightUnit === 'imperial') {
        const feetIndex = feetOptions.indexOf(feet);
        const inchesIndex = inchesOptions.indexOf(inches);
        if (feetIndex >= 0 && feetScrollRef.current) {
          try {
            feetScrollRef.current.scrollToOffset({ offset: feetIndex * 40, animated: false });
          } catch (_e) {
            // Fallback to manual scroll
          }
        }
        if (inchesIndex >= 0 && inchesScrollRef.current) {
          try {
            inchesScrollRef.current.scrollToOffset({ offset: inchesIndex * 40, animated: false });
          } catch (_e) {
            // Fallback to manual scroll
          }
        }
      } else {
        const cmIndex = cmOptions.indexOf(centimeters);
        if (cmIndex >= 0 && cmScrollRef.current) {
          try {
            cmScrollRef.current.scrollToOffset({ offset: cmIndex * 40, animated: false });
          } catch (_e) {
            // Fallback to manual scroll
          }
        }
      }
    }, 200);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heightUnit]);

  // Convert between units when toggled
  const handleUnitToggle = () => {
    if (heightUnit === 'imperial') {
      // Convert feet/inches to cm
      const totalInches = (feet * 12) + inches;
      const cm = Math.round(totalInches * 2.54);
      setCentimeters(cm);
      setHeightUnit('metric');
    } else {
      // Convert cm to feet/inches
      const totalInches = centimeters / 2.54;
      const ft = Math.floor(totalInches / 12);
      const inch = Math.round(totalInches % 12);
      setFeet(ft);
      setInches(inch === 12 ? 0 : inch);
      if (inch === 12) {
        setFeet(ft + 1);
      }
      setHeightUnit('imperial');
    }
  };

  // Handle scroll selection
  const handleFeetScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / 40); // 40 is item height
    if (index >= 0 && index < feetOptions.length) {
      const newFeet = feetOptions[index];
      setFeet(newFeet);
      // Update cm conversion
      const totalInches = (newFeet * 12) + inches;
      setCentimeters(Math.round(totalInches * 2.54));
    }
  };

  const handleInchesScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / 40);
    if (index >= 0 && index < inchesOptions.length) {
      const newInches = inchesOptions[index];
      setInches(newInches);
      // Update cm conversion
      const totalInches = (feet * 12) + newInches;
      setCentimeters(Math.round(totalInches * 2.54));
    }
  };

  const handleCmScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / 40);
    if (index >= 0 && index < cmOptions.length) {
      const newCm = cmOptions[index];
      setCentimeters(newCm);
      // Update feet/inches conversion
      const totalInches = newCm / 2.54;
      const ft = Math.floor(totalInches / 12);
      const inch = Math.round(totalInches % 12);
      setFeet(ft);
      setInches(inch === 12 ? 0 : inch);
      if (inch === 12) {
        setFeet(ft + 1);
      }
    }
  };

  const handleSelectOption = (value: string, setter: (val: string) => void, closeDropdown: () => void) => {
    setter(value);
    closeDropdown();
    setLocalErrors({});
  };

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      // Basic validation
      if (!nationality) {
        setLocalErrors({ nationality: 'Please select your nationality' });
        return;
      }

      if (!ethnicity) {
        setLocalErrors({ ethnicity: 'Please select your ethnicity' });
        return;
      }

      // Parse height based on selected unit
      let heightData = {};
      if (heightUnit === 'imperial') {
        heightData = {
          heightFeet: feet,
          heightInches: inches,
        };
      } else if (heightUnit === 'metric') {
        heightData = { heightCm: centimeters };
      }

      const ethnicityData = { 
        nationality,
        ethnicity,
        religion: religion || null,
        relationshipStatus: relationshipStatus || null,
        ...heightData,
      };

      const validation = validateOnboardingStep('ethnicity', ethnicityData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      const success = await saveStep('ethnicity', ethnicityData);

      if (success) {
        console.log('✅ [OnboardingEthnicityScreen] Ethnicity saved successfully');
        onNavigate?.('onboarding-personality', ethnicityData);
      } else {
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your information. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingEthnicityScreen] Error saving ethnicity:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-work');
  };

  const hasError = Object.keys(localErrors).length > 0 || Object.keys(stepErrors).length > 0;
  const errorMessage = Object.values(localErrors)[0] || Object.values(stepErrors)[0];

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
      scrollable={false}
    >
      <Pressable 
        style={styles.container}
        onPress={() => {
          setShowNationalityDropdown(false);
          setShowEthnicityDropdown(false);
          setShowReligionDropdown(false);
          setShowRelationshipDropdown(false);
          Keyboard.dismiss();
        }}
      >
        {hasError && errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Nationality */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>What is your nationality?</Text>
          <TouchableOpacity
            style={[styles.selectButton, showNationalityDropdown && styles.selectButtonActive]}
            onPress={() => {
              setShowNationalityDropdown(!showNationalityDropdown);
              setShowEthnicityDropdown(false);
              setShowReligionDropdown(false);
              setShowRelationshipDropdown(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectButtonText, !nationality && styles.placeholderText]}>
              {nationality || 'Select nationality'}
            </Text>
            <Text style={styles.selectButtonArrow}>
              {showNationalityDropdown ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          
          {showNationalityDropdown && (
            <View style={styles.dropdown}>
              <ScrollView 
                showsVerticalScrollIndicator={true} 
                nestedScrollEnabled
                bounces={false}
              >
                {nationalityOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownItem, 
                      nationality === option && styles.dropdownItemSelected,
                      index === nationalityOptions.length - 1 && styles.dropdownItemLast
                    ]}
                    onPress={() => handleSelectOption(option, setNationality, () => setShowNationalityDropdown(false))}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.dropdownItemText, nationality === option && styles.dropdownItemTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Ethnicity */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>What is your ethnicity?</Text>
          <TouchableOpacity
            style={[styles.selectButton, showEthnicityDropdown && styles.selectButtonActive]}
            onPress={() => {
              setShowEthnicityDropdown(!showEthnicityDropdown);
              setShowNationalityDropdown(false);
              setShowReligionDropdown(false);
              setShowRelationshipDropdown(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectButtonText, !ethnicity && styles.placeholderText]}>
              {ethnicity || 'Select ethnicity'}
            </Text>
            <Text style={styles.selectButtonArrow}>
              {showEthnicityDropdown ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          
          {showEthnicityDropdown && (
            <View style={styles.dropdown}>
              <ScrollView 
                showsVerticalScrollIndicator={true} 
                nestedScrollEnabled
                bounces={false}
              >
                {ethnicityOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownItem, 
                      ethnicity === option && styles.dropdownItemSelected,
                      index === ethnicityOptions.length - 1 && styles.dropdownItemLast
                    ]}
                    onPress={() => handleSelectOption(option, setEthnicity, () => setShowEthnicityDropdown(false))}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.dropdownItemText, ethnicity === option && styles.dropdownItemTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Religion */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Religion</Text>
          <TouchableOpacity
            style={[styles.selectButton, showReligionDropdown && styles.selectButtonActive]}
            onPress={() => {
              setShowReligionDropdown(!showReligionDropdown);
              setShowNationalityDropdown(false);
              setShowEthnicityDropdown(false);
              setShowRelationshipDropdown(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectButtonText, !religion && styles.placeholderText]}>
              {religion || 'Select religion'}
            </Text>
            <Text style={styles.selectButtonArrow}>
              {showReligionDropdown ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          
          {showReligionDropdown && (
            <View style={styles.dropdown}>
              <ScrollView 
                showsVerticalScrollIndicator={true} 
                nestedScrollEnabled
                bounces={false}
              >
                {religionOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownItem, 
                      religion === option && styles.dropdownItemSelected,
                      index === religionOptions.length - 1 && styles.dropdownItemLast
                    ]}
                    onPress={() => handleSelectOption(option, setReligion, () => setShowReligionDropdown(false))}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.dropdownItemText, religion === option && styles.dropdownItemTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Relationship Status */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Relationship Status</Text>
          <TouchableOpacity
            style={[styles.selectButton, showRelationshipDropdown && styles.selectButtonActive]}
            onPress={() => {
              setShowRelationshipDropdown(!showRelationshipDropdown);
              setShowNationalityDropdown(false);
              setShowEthnicityDropdown(false);
              setShowReligionDropdown(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectButtonText, !relationshipStatus && styles.placeholderText]}>
              {relationshipStatus || 'Select relationship status'}
            </Text>
            <Text style={styles.selectButtonArrow}>
              {showRelationshipDropdown ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          
          {showRelationshipDropdown && (
            <View style={styles.dropdown}>
              <ScrollView 
                showsVerticalScrollIndicator={true} 
                nestedScrollEnabled
                bounces={false}
              >
                {relationshipOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownItem, 
                      relationshipStatus === option && styles.dropdownItemSelected,
                      index === relationshipOptions.length - 1 && styles.dropdownItemLast
                    ]}
                    onPress={() => handleSelectOption(option, setRelationshipStatus, () => setShowRelationshipDropdown(false))}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.dropdownItemText, relationshipStatus === option && styles.dropdownItemTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Height */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Height</Text>
            <TouchableOpacity
              style={styles.unitToggle}
              onPress={handleUnitToggle}
              activeOpacity={0.7}
            >
              <Text style={[styles.unitOption, heightUnit === 'imperial' && styles.unitOptionActive]}>
                ft/in
              </Text>
              <Text style={styles.unitSeparator}>|</Text>
              <Text style={[styles.unitOption, heightUnit === 'metric' && styles.unitOptionActive]}>
                cm
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.heightPickerContainer}>
            {heightUnit === 'imperial' ? (
              <View style={styles.heightPickerRow}>
                <View style={styles.pickerColumn}>
                  <View style={styles.pickerLabelContainer}>
                    <Text style={styles.pickerLabel}>feet</Text>
                  </View>
                  <View style={styles.pickerWrapper}>
                    <FlatList
                      ref={feetScrollRef}
                      data={feetOptions}
                      keyExtractor={(item) => item.toString()}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={40}
                      decelerationRate="fast"
                      onMomentumScrollEnd={handleFeetScroll}
                      contentContainerStyle={styles.pickerContent}
                      getItemLayout={getItemLayout}
                      onScrollToIndexFailed={onScrollToIndexFailed}
                      initialScrollIndex={feetOptions.indexOf(feet)}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          onPress={() => {
                            setFeet(item);
                            const totalInches = (item * 12) + inches;
                            setCentimeters(Math.round(totalInches * 2.54));
                            const index = feetOptions.indexOf(item);
                            feetScrollRef.current?.scrollToOffset({ offset: index * 40, animated: true });
                          }}
                          style={[styles.pickerItem, feet === item && styles.pickerItemSelected]}
                        >
                          <Text style={[styles.pickerItemText, feet === item && styles.pickerItemTextSelected]}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                    <View style={styles.selectionIndicator} pointerEvents="none" />
                  </View>
                </View>
                
                <View style={styles.pickerColumn}>
                  <View style={styles.pickerLabelContainer}>
                    <Text style={styles.pickerLabel}>inches</Text>
                  </View>
                  <View style={styles.pickerWrapper}>
                    <FlatList
                      ref={inchesScrollRef}
                      data={inchesOptions}
                      keyExtractor={(item) => item.toString()}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={40}
                      decelerationRate="fast"
                      onMomentumScrollEnd={handleInchesScroll}
                      contentContainerStyle={styles.pickerContent}
                      getItemLayout={getItemLayout}
                      onScrollToIndexFailed={onScrollToIndexFailed}
                      initialScrollIndex={inchesOptions.indexOf(inches)}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          onPress={() => {
                            setInches(item);
                            const totalInches = (feet * 12) + item;
                            setCentimeters(Math.round(totalInches * 2.54));
                            const index = inchesOptions.indexOf(item);
                            inchesScrollRef.current?.scrollToOffset({ offset: index * 40, animated: true });
                          }}
                          style={[styles.pickerItem, inches === item && styles.pickerItemSelected]}
                        >
                          <Text style={[styles.pickerItemText, inches === item && styles.pickerItemTextSelected]}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                    <View style={styles.selectionIndicator} pointerEvents="none" />
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.pickerColumnSingle}>
                <View style={styles.pickerLabelContainer}>
                  <Text style={styles.pickerLabel}>centimeters</Text>
                </View>
                <View style={styles.pickerWrapper}>
                  <FlatList
                    ref={cmScrollRef}
                    data={cmOptions}
                    keyExtractor={(item) => item.toString()}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={40}
                    decelerationRate="fast"
                    onMomentumScrollEnd={handleCmScroll}
                    contentContainerStyle={styles.pickerContent}
                    getItemLayout={getItemLayout}
                    onScrollToIndexFailed={onScrollToIndexFailed}
                    initialScrollIndex={cmOptions.indexOf(centimeters)}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setCentimeters(item);
                          const totalInches = item / 2.54;
                          const ft = Math.floor(totalInches / 12);
                          const inch = Math.round(totalInches % 12);
                          setFeet(ft);
                          setInches(inch === 12 ? 0 : inch);
                          if (inch === 12) setFeet(ft + 1);
                          const index = cmOptions.indexOf(item);
                          cmScrollRef.current?.scrollToOffset({ offset: index * 40, animated: true });
                        }}
                        style={[styles.pickerItem, centimeters === item && styles.pickerItemSelected]}
                      >
                        <Text style={[styles.pickerItemText, centimeters === item && styles.pickerItemTextSelected]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                  <View style={styles.selectionIndicator} pointerEvents="none" />
                </View>
              </View>
            )}
            
            {/* Display converted value */}
            <View style={styles.conversionDisplay}>
              <Text style={styles.conversionText}>
                {heightUnit === 'imperial' 
                  ? `= ${centimeters} cm`
                  : `= ${feet}'${inches}"`
                }
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label={saving ? 'Saving...' : 'Next'}
            disabled={!nationality || !ethnicity || saving}
            loading={saving}
          />
        </View>
      </Pressable>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: Colors.errorLighter,
    borderColor: Colors.errorLight,
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    marginBottom: scaleHeight(12),
    padding: scaleWidth(12),
  },
  errorText: {
    color: Colors.error,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  fieldContainer: {
    marginBottom: scaleHeight(20),
    zIndex: 1,
  },
  label: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '500',
    marginBottom: scaleHeight(6),
  },
  selectButton: {
    backgroundColor: Colors.backgroundGrayLight,
    borderColor: Colors.borderLight,
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
  },
  selectButtonActive: {
    borderColor: theme.colors.primary.main,
    backgroundColor: Colors.white,
  },
  selectButtonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    flex: 1,
  },
  placeholderText: {
    color: theme.colors.text.secondary,
  },
  selectButtonArrow: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(14),
    marginLeft: scaleWidth(8),
  },
  dropdown: {
    marginTop: scaleHeight(8),
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    maxHeight: scaleHeight(200),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dropdownItem: {
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(10),
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.backgroundGrayLighter,
  },
  dropdownItemSelected: {
    backgroundColor: Colors.primaryLight,
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  dropdownItemTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(6),
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGrayLighter,
    borderRadius: scaleWidth(6),
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
  },
  unitOption: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    paddingHorizontal: scaleWidth(6),
  },
  unitOptionActive: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  unitSeparator: {
    color: Colors.borderLight,
    fontSize: scaleFont(13),
  },
  heightPickerContainer: {
    backgroundColor: Colors.backgroundGrayLight,
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: scaleWidth(8),
  },
  heightPickerRow: {
    flexDirection: 'row',
    gap: scaleWidth(16),
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerColumnSingle: {
    alignItems: 'center',
  },
  pickerLabelContainer: {
    marginBottom: scaleHeight(8),
  },
  pickerLabel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerWrapper: {
    height: scaleHeight(120),
    width: scaleWidth(80),
    position: 'relative',
  },
  pickerContent: {
    paddingVertical: scaleHeight(40),
  },
  pickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: 'transparent',
  },
  pickerItemText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(18),
  },
  pickerItemTextSelected: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    fontSize: scaleFont(20),
  },
  selectionIndicator: {
    position: 'absolute',
    top: scaleHeight(40),
    left: 0,
    right: 0,
    height: 40,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.primary.main,
    backgroundColor: Colors.primaryLight,
    opacity: 0.1,
  },
  conversionDisplay: {
    marginTop: scaleHeight(12),
    alignItems: 'center',
  },
  conversionText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    fontStyle: 'italic',
  },
  spacer: {
    flex: 1,
  },
  bottomContainer: {
    paddingBottom: scaleHeight(20),
    paddingTop: scaleHeight(16),
  },
});