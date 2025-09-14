import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { api } from '@/services/api';
import { CheckoutModal } from '@/components/payment/CheckoutModal';

interface DietaryPreferencesModalProps {
  visible: boolean;
  dinnerData: {
    id: string;
    datetime: string;
    restaurant?: string;
    address?: string;
    dinner_type?: 'regular' | 'singles';
    current_signups?: number;
    max_signups?: number;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Define dietary needs outside component to prevent recreation on render
const DIETARY_NEEDS = [
  'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Kosher', 'Halal',
  'Nut allergy', 'Shellfish allergy', 'No restrictions'
] as const;

export const DietaryPreferencesModal: React.FC<DietaryPreferencesModalProps> = ({
  visible,
  dinnerData,
  onClose,
  onSuccess,
}) => {
  const styles = getStyles();
  
  // State for dietary preferences
  const [selectedDietaryNeeds, setSelectedDietaryNeeds] = useState<string[]>([]);
  const [confirmDietaryRestrictions, setConfirmDietaryRestrictions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);

  const loadUserPreferences = useCallback(async () => {
    try {
      const response = await api.getUserPreferences();
      if (response.success && response.data) {
        const prefs = response.data;
        
        // Set dietary restrictions
        if (prefs.dietary_restrictions && prefs.dietary_restrictions.length > 0) {
          const validDietaryNeeds = prefs.dietary_restrictions.filter((d: string) =>
            DIETARY_NEEDS.includes(d as typeof DIETARY_NEEDS[number])
          );
          if (validDietaryNeeds.length > 0) {
            setSelectedDietaryNeeds(validDietaryNeeds);
          } else if (prefs.dietary_restrictions.includes('No restrictions')) {
            setSelectedDietaryNeeds(['No restrictions']);
          }
        } else {
          setSelectedDietaryNeeds(['No restrictions']);
        }
      } else {
        // Default to 'No restrictions' if no preferences found
        setSelectedDietaryNeeds(['No restrictions']);
      }
      setHasLoadedPreferences(true);
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Default to 'No restrictions' on error
      setSelectedDietaryNeeds(['No restrictions']);
      setHasLoadedPreferences(true);
    }
  }, []);

  useEffect(() => {
    if (visible && !hasLoadedPreferences) {
      loadUserPreferences().finally(() => {
        setIsLoading(false);
      });
    } else if (visible) {
      setIsLoading(false);
    }
  }, [visible, hasLoadedPreferences, loadUserPreferences]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setHasLoadedPreferences(false);
      setShowCheckoutModal(false);
      setBookingLoading(false);
      setConfirmDietaryRestrictions(false);
    }
  }, [visible]);

  const handleConfirmAndContinue = () => {
    // Open checkout modal
    setShowCheckoutModal(true);
  };

  const handleCheckoutSuccess = async (paymentMethodId: string, _shouldSave: boolean) => {
    try {
      setBookingLoading(true);
      setShowCheckoutModal(false);
      
      const dietaryRestrictions = selectedDietaryNeeds
        .filter(need => need !== 'No restrictions')
        .join(', ') || 'None';

      if (dinnerData?.id) {
        const signupResponse = await api.signupForDinner({
          dinnerId: dinnerData.id,
          dietaryRestrictions,
          preferences: JSON.stringify({
            dietary_needs: selectedDietaryNeeds,
          }),
          paymentMethodId,
        });

        if (signupResponse.success) {
          // Close modal and trigger success callback
          onClose();
          onSuccess();
        } else {
          Alert.alert('Error', signupResponse.error || 'Failed to complete signup. Please try again.');
        }
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

  const toggleDietaryNeed = useCallback((need: string) => {
    setSelectedDietaryNeeds(prev => {
      if (need === 'No restrictions') {
        return ['No restrictions'];
      }
      
      // Remove 'No restrictions' when selecting other options
      const filtered = prev.filter(r => r !== 'No restrictions');
      
      if (filtered.includes(need)) {
        // If removing this item and no other items selected, default to 'No restrictions'
        const newList = filtered.filter(r => r !== need);
        return newList.length === 0 ? ['No restrictions'] : newList;
      }
      
      return [...filtered, need];
    });
  }, []);


  if (!dinnerData) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.invisibleArea} onPress={onClose} />
        <View style={styles.modalContent}>
          {/* Close Button */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color={theme.colors.text.secondary} />
          </Pressable>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Title Section */}
            <View style={styles.titleSection}>
              <View style={styles.iconContainer}>
                <Ionicons name="restaurant" size={24} color={theme.colors.white} />
              </View>
              <Text style={styles.title}>Dietary Preferences</Text>
              <Text style={styles.subtitle}>
                Help us ensure the restaurant can accommodate your dietary needs
              </Text>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.brand.primary} />
                <Text style={styles.loadingText}>Loading your preferences...</Text>
              </View>
            ) : (
              <>
                {/* Dietary Needs Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Select all that apply</Text>
                  </View>
                  
                  <View style={styles.optionsGrid}>
                    {DIETARY_NEEDS.map((need) => (
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
                  
                  {/* Confirmation checkbox */}
                  {selectedDietaryNeeds.length > 0 && !selectedDietaryNeeds.includes('No restrictions') && (
                    <Pressable 
                      style={styles.checkbox}
                      onPress={() => setConfirmDietaryRestrictions(!confirmDietaryRestrictions)}
                    >
                      <View style={[styles.checkboxBox, confirmDietaryRestrictions && styles.checkboxChecked]}>
                        {confirmDietaryRestrictions && (
                          <Ionicons name="checkmark" size={14} color="white" />
                        )}
                      </View>
                      <Text style={styles.checkboxText}>
                        I confirm I&apos;ve disclosed my dietary restrictions so my match + restaurant are a good fit
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* Action Button */}
                <Pressable 
                  style={styles.confirmButton}
                  onPress={handleConfirmAndContinue}
                >
                  <Text style={styles.confirmButtonText}>Continue to Payment</Text>
                  <Ionicons name="arrow-forward" size={20} color={theme.colors.white} />
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Checkout Modal */}
      <CheckoutModal
        visible={showCheckoutModal}
        amount={3000}
        onSuccess={handleCheckoutSuccess}
        onCancel={handleCheckoutCancel}
        loading={bookingLoading}
      />
    </Modal>
  );
};

const { height: screenHeight } = Dimensions.get('window');

// Calculate the height to match the white card area from HomeScreen
const CARD_TOP_POSITION = scaleHeight(210); // Same as contentCardContainer top position
const MODAL_HEIGHT = screenHeight - CARD_TOP_POSITION;

/* eslint-disable react-native/no-unused-styles */
const getStyles = () => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  invisibleArea: {
    flex: 1,
    // No background - completely transparent
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: scaleWidth(24),
    borderTopRightRadius: scaleWidth(24),
    height: MODAL_HEIGHT,
    shadowColor: theme.colors.black['1'],
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: scaleHeight(16),
    right: scaleWidth(16),
    zIndex: 10,
    width: scaleWidth(28),
    height: scaleWidth(28),
    borderRadius: scaleWidth(14),
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.black?.['1'] || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  scrollContent: {
    paddingTop: scaleHeight(30),
    paddingBottom: scaleHeight(40),
  },
  titleSection: {
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(24),
  },
  iconContainer: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: scaleWidth(24),
    backgroundColor: theme.colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
  },
  title: {
    fontSize: scaleFont(22),
    fontWeight: '700',
    color: theme.colors.brand.primary,
    marginBottom: scaleHeight(8),
    fontFamily: theme.typography.fontFamily.heading,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: scaleWidth(20),
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: scaleFont(20),
  },
  section: {
    paddingHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(24),
  },
  sectionHeader: {
    marginBottom: scaleHeight(16),
  },
  sectionTitle: {
    fontSize: scaleFont(15),
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(10),
  },
  chip: {
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(20),
    backgroundColor: theme.colors.background?.paper || '#F9F9F9',
    borderWidth: 1,
    borderColor: theme.colors.gray?.['200'] || '#E0E0E0',
    marginBottom: scaleHeight(8),
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
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
  },
  chipTextSelected: {
    color: theme.colors.white,
    fontWeight: '500',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: scaleHeight(16),
    paddingHorizontal: scaleWidth(4),
  },
  checkboxBox: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderWidth: 2,
    borderColor: theme.colors.gray?.['200'] || '#E0E0E0',
    borderRadius: scaleWidth(4),
    marginRight: scaleWidth(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.success?.main || '#4CAF50',
    borderColor: theme.colors.success?.main || '#4CAF50',
  },
  checkboxText: {
    flex: 1,
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: scaleFont(18),
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: scaleHeight(60),
  },
  loadingText: {
    marginTop: scaleHeight(12),
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.brand.primary,
    marginHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(15),
    borderRadius: scaleWidth(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleHeight(8),
  },
  confirmButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.white,
    marginRight: scaleWidth(8),
    fontFamily: theme.typography.fontFamily.body,
  },
});