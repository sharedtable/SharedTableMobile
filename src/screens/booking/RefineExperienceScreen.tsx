import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { api } from '@/services/api';
// import { useAuthStore } from '@/store/authStore';
import { BookingStackNavigationProp } from '@/navigation/types';
import { CheckoutModal } from '@/components/payment/CheckoutModal';

interface RouteParams {
  bookingId?: string;
  dinnerData?: Record<string, unknown>;
}

const RefineExperienceScreen: React.FC = () => {
  const navigation = useNavigation<BookingStackNavigationProp>();
  const route = useRoute();
  const { dinnerData } = (route.params as RouteParams) || {};

  // State for dietary preferences only
  const [selectedDietaryNeeds, setSelectedDietaryNeeds] = useState<string[]>([]);
  const [confirmDietaryRestrictions, setConfirmDietaryRestrictions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // From OnboardingFoodPreferences1Screen
  const dietaryNeeds = [
    'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Kosher', 'Halal',
    'Nut allergy', 'Shellfish allergy', 'No restrictions'
  ];

  useEffect(() => {
    // Load existing preferences if available
    loadUserPreferences().finally(() => {
      setIsLoading(false);
    });
  }, []);

  const loadUserPreferences = async () => {
    try {
      const response = await api.getUserPreferences();
      if (response.success && response.data) {
        const prefs = response.data;
        console.log('Loading user preferences:', prefs);
        
        // Set dietary restrictions
        if (prefs.dietary_restrictions && prefs.dietary_restrictions.length > 0) {
          // Ensure the dietary restrictions match our options exactly
          const validDietaryNeeds = prefs.dietary_restrictions.filter((d: string) =>
            dietaryNeeds.includes(d)
          );
          if (validDietaryNeeds.length > 0) {
            setSelectedDietaryNeeds(validDietaryNeeds);
          } else if (prefs.dietary_restrictions.includes('No restrictions')) {
            setSelectedDietaryNeeds(['No restrictions']);
          }
        } else {
          // Default to "No restrictions" if nothing is set
          setSelectedDietaryNeeds(['No restrictions']);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleConfirmAndContinue = async () => {
    // Store dietary preferences for later use
    // Dietary restrictions are computed but not used in this context
    // const dietaryRestrictions = selectedDietaryNeeds
    //   .filter(need => need !== 'No restrictions')
    //   .join(', ') || 'None';
    
    // Open checkout modal
    setShowCheckoutModal(true);
  };

  const handleCheckoutSuccess = async (paymentMethodId: string, _shouldSave: boolean) => {
    try {
      setBookingLoading(true);
      setShowCheckoutModal(false);
      
      // Get dietary preferences
      const dietaryRestrictions = selectedDietaryNeeds
        .filter(need => need !== 'No restrictions')
        .join(', ') || 'None';

      // Sign up for dinner with dietary preferences and payment method
      if (dinnerData?.id) {
        const signupResponse = await api.signupForDinner({
          dinnerId: dinnerData.id as string,
          dietaryRestrictions,
          preferences: JSON.stringify({
            dietary_needs: selectedDietaryNeeds,
          }),
          paymentMethodId,
        });

        if (signupResponse.success) {
          Alert.alert(
            'Success!',
            'You have successfully signed up for this dinner. You will receive confirmation details 24 hours before the event.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Navigate back to home or previous screen
                  navigation.goBack();
                  // Optionally navigate to home
                  navigation.navigate('Main' as any);
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', signupResponse.error || 'Failed to complete signup. Please try again.');
        }
      } else {
        Alert.alert('Error', 'Invalid dinner data. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Failed to complete signup. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCheckoutCancel = () => {
    setShowCheckoutModal(false);
  };

  const toggleDietaryNeed = (need: string) => {
    setSelectedDietaryNeeds(prev => {
      // If "No restrictions" is selected, clear all other selections
      if (need === 'No restrictions') {
        return ['No restrictions'];
      }
      
      // If selecting something else, remove "No restrictions" if it was selected
      const filtered = prev.filter(r => r !== 'No restrictions');
      
      if (prev.includes(need)) {
        return filtered.filter(r => r !== need);
      }
      
      return [...filtered, need];
    });
  };

  const clearAll = () => {
    setSelectedDietaryNeeds([]);
    setConfirmDietaryRestrictions(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        
        <Text style={styles.title}>Dietary preferences</Text>
        
        <Pressable onPress={clearAll} style={styles.clearButton}>
          <Text style={styles.clearText}>Clear All</Text>
        </Pressable>
      </View>

      {/* Description */}
      <Text style={styles.description}>
        Help us ensure the restaurant can accommodate your dietary needs.
      </Text>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.brand.primary} />
            <Text style={styles.loadingText}>Loading your preferences...</Text>
          </View>
        ) : (
          <>
            {/* Dietary Needs */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Dietary Needs</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{selectedDietaryNeeds.length > 0 ? selectedDietaryNeeds.length.toString() : '0'}</Text>
                </View>
              </View>
              <Text style={styles.sectionDescription}>
                We want everyone at the table to feel comfortable and included.
              </Text>
              <View style={styles.optionsGrid}>
                {dietaryNeeds.map((need) => (
                  <Pressable
                    key={need}
                    style={[
                      styles.chip,
                      selectedDietaryNeeds.includes(need) && styles.chipSelected
                    ]}
                    onPress={() => toggleDietaryNeed(need)}
                  >
                    {selectedDietaryNeeds.includes(need) && (
                      <Ionicons name="checkmark" size={14} color="white" style={styles.chipIcon} />
                    )}
                    <Text style={[
                      styles.chipText,
                      selectedDietaryNeeds.includes(need) && styles.chipTextSelected
                    ]}>
                      {need}
                    </Text>
                  </Pressable>
                ))}
              </View>
              
              {/* Confirmation checkbox - auto-check if user has dietary restrictions */}
              <Pressable 
                style={styles.checkbox}
                onPress={() => setConfirmDietaryRestrictions(!confirmDietaryRestrictions)}
              >
                <View style={[styles.checkboxBox, (confirmDietaryRestrictions || selectedDietaryNeeds.length > 0) && styles.checkboxChecked]}>
                  {(confirmDietaryRestrictions || selectedDietaryNeeds.length > 0) && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
                <Text style={styles.checkboxText}>
                  I confirm I've disclosed my dietary restrictions so my match + restaurant are a good fit.
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <Pressable 
          style={styles.confirmButton}
          onPress={handleConfirmAndContinue}
        >
          <Text style={styles.confirmButtonText}>Confirm & Continue</Text>
        </Pressable>
      </View>
      {/* Checkout Modal */}
      <CheckoutModal
        visible={showCheckoutModal}
        amount={3000} // Fixed $30 hold amount
        onSuccess={handleCheckoutSuccess}
        onCancel={handleCheckoutCancel}
        loading={bookingLoading}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cancelButton: {
    padding: scaleWidth(5),
  },
  cancelText: {
    fontSize: scaleFont(16),
    color: theme.colors.brand.primary,
    fontFamily: theme.typography.fontFamily.body,
  },
  title: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
  },
  clearButton: {
    padding: scaleWidth(5),
  },
  clearText: {
    fontSize: scaleFont(16),
    color: theme.colors.brand.primary,
    fontFamily: theme.typography.fontFamily.body,
  },
  description: {
    fontSize: scaleFont(14),
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(10),
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: scaleFont(20),
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleWidth(20),
  },
  section: {
    paddingVertical: scaleHeight(15),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(8),
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
  },
  sectionDescription: {
    fontSize: scaleFont(14),
    color: '#666666',
    marginBottom: scaleHeight(12),
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: scaleFont(20),
  },
  badge: {
    width: scaleWidth(24),
    height: scaleWidth(24),
    borderRadius: scaleWidth(12),
    backgroundColor: theme.colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.heading,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(8),
  },
  chip: {
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(20),
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: scaleHeight(8),
    marginRight: scaleWidth(8),
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  chipIcon: {
    marginRight: scaleWidth(4),
  },
  chipText: {
    fontSize: scaleFont(14),
    color: '#333333',
    fontFamily: theme.typography.fontFamily.body,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: scaleHeight(12),
  },
  checkboxBox: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: scaleWidth(4),
    marginRight: scaleWidth(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxText: {
    flex: 1,
    fontSize: scaleFont(13),
    color: '#666666',
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: scaleFont(18),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scaleHeight(100),
  },
  loadingText: {
    marginTop: scaleHeight(12),
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  footer: {
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(15),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  confirmButton: {
    backgroundColor: theme.colors.brand.primary,
    paddingVertical: scaleHeight(15),
    borderRadius: scaleWidth(8),
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.heading,
  },
});

export default RefineExperienceScreen;