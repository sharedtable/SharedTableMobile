import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Switch,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
// Type definitions for Stripe
interface CardFieldInputDetails {
  complete: boolean;
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  postalCode?: string;
  number?: string;
  validNumber?: string;
  validExpiryDate?: string;
  validCVC?: string;
}

// Type for Stripe's useStripe hook - using 'any' for web compatibility
interface StripeHook {
  confirmPayment: (clientSecret: string, params?: any) => Promise<any>;
  confirmSetupIntent: (clientSecret: string, params?: any) => Promise<any>;
  createPaymentMethod: (params?: any) => Promise<any>;
}

// Only import Stripe on mobile platforms
// Using 'any' type for CardField as Stripe types are not available in web context
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let CardField: any = () => null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useStripe: () => StripeHook | any = () => ({ 
  confirmPayment: async () => ({ error: { message: 'Stripe not available on web' } }),
  confirmSetupIntent: async () => ({ error: { message: 'Stripe not available on web' }, setupIntent: null }),
  createPaymentMethod: async () => ({ error: { message: 'Stripe not available on web' }, paymentMethod: null })
});

if (Platform.OS !== 'web') {
  // Dynamic imports don't work well with React Native Metro bundler
  // Using require with eslint override is the recommended approach
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const stripe = require('@stripe/stripe-react-native');
  CardField = stripe.CardField;
  useStripe = stripe.useStripe;
}
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '@/theme';
import { scaleHeight, scaleWidth, scaleFont } from '@/utils/responsive';
import { usePaymentStore } from '@/store/paymentStore';
import { logger } from '@/utils/logger';

// SavedCard interface removed - not used in this component

interface CheckoutPaymentFormProps {
  amount: number;
  onSuccess: (paymentMethodId: string, shouldSave: boolean) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const CheckoutPaymentForm: React.FC<CheckoutPaymentFormProps> = ({
  amount,
  onSuccess,
  onCancel,
  loading = false,
}) => {
  const stripe = useStripe();
  const { createSetupIntent, clearSetupIntent, currentSetupIntent, paymentMethods, defaultPaymentMethodId, initializePayments } = usePaymentStore();
  
  // State management
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(defaultPaymentMethodId);
  const [useNewCard, setUseNewCard] = useState(!paymentMethods.length);
  const [cardDetails, setCardDetails] = useState<CardFieldInputDetails | null>(null);
  const [saveCard, setSaveCard] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoading = loading || processing;

  // Load payment methods on mount
  useEffect(() => {
    if (paymentMethods.length === 0) {
      initializePayments();
    }
  }, [initializePayments, paymentMethods.length]);

  // Set default payment method when it changes
  useEffect(() => {
    if (defaultPaymentMethodId && paymentMethods.length > 0) {
      setSelectedPaymentMethod(defaultPaymentMethodId);
      setUseNewCard(false);
    } else if (paymentMethods.length === 0) {
      setUseNewCard(true);
    }
  }, [defaultPaymentMethodId, paymentMethods]);
  
  // Clean up SetupIntent when component unmounts or modal closes
  useEffect(() => {
    return () => {
      clearSetupIntent();
    };
  }, [clearSetupIntent]);

  const handleCardChange = useCallback((details: CardFieldInputDetails) => {
    setCardDetails(details);
    if (error && details.complete) {
      setError(null);
    }
    
    // Auto-dismiss keyboard after entering 5 digits in zip code
    if (details.postalCode && details.postalCode.length === 5) {
      // Small delay to ensure the last digit is registered
      setTimeout(() => {
        Keyboard.dismiss();
      }, 100);
    }
  }, [error]);

  const validateAndProcess = useCallback(async () => {
    if (!stripe) {
      setError('Payment system not initialized');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      let paymentMethodId: string;

      if (useNewCard) {
        // Validate card details
        if (!cardDetails?.complete) {
          throw new Error('Please enter valid card details');
        }

        // Validate US zip code if provided
        if (cardDetails.postalCode) {
          const zipCode = cardDetails.postalCode.replace(/\s/g, '');
          if (!/^\d{5}$/.test(zipCode)) {
            throw new Error('Please enter a valid 5-digit US zip code');
          }
        }

        // Create setup intent if needed for saving
        if (saveCard) {
          let setupIntentClientSecret = currentSetupIntent?.clientSecret;

          if (!setupIntentClientSecret) {
            const success = await createSetupIntent();
            if (!success || !usePaymentStore.getState().currentSetupIntent) {
              throw new Error('Failed to initialize payment setup');
            }
            const setupIntent = usePaymentStore.getState().currentSetupIntent;
            setupIntentClientSecret = setupIntent?.clientSecret || '';
          }

          // Confirm setup intent to get payment method
          const { setupIntent, error: confirmError } = await stripe.confirmSetupIntent(
            setupIntentClientSecret,
            {
              paymentMethodType: 'Card',
            }
          );

          if (confirmError) {
            throw new Error(confirmError.message);
          }

          if (!setupIntent?.paymentMethodId) {
            throw new Error('Failed to process payment method');
          }

          paymentMethodId = setupIntent.paymentMethodId;
        } else {
          // Create payment method without saving
          const { paymentMethod, error: createError } = await stripe.createPaymentMethod({
            paymentMethodType: 'Card',
          });

          if (createError) {
            throw new Error(createError.message);
          }

          if (!paymentMethod?.id) {
            throw new Error('Failed to create payment method');
          }

          paymentMethodId = paymentMethod.id;
        }
      } else {
        // Use selected saved card
        if (!selectedPaymentMethod) {
          throw new Error('Please select a payment method');
        }
        paymentMethodId = selectedPaymentMethod;
      }

      // Clear setup intent before success callback
      clearSetupIntent();
      
      // Haptic feedback for success
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Call success callback
      onSuccess(paymentMethodId, useNewCard && saveCard);
    } catch (err) {
      logger.error('Payment processing error:', err);
      
      // Clear setup intent on error to ensure fresh start next time
      clearSetupIntent();
      
      setError(err instanceof Error ? err.message : 'Payment processing failed');
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setProcessing(false);
    }
  }, [
    stripe,
    useNewCard,
    cardDetails,
    saveCard,
    selectedPaymentMethod,
    currentSetupIntent,
    createSetupIntent,
    clearSetupIntent,
    onSuccess,
  ]);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <Pressable style={styles.closeButton} onPress={onCancel}>
        <Ionicons name="close" size={20} color={theme.colors.text.secondary} />
      </Pressable>
      
      <Text style={styles.title}>DEPOSIT PAYMENT</Text>
      <Text style={styles.subtitle}>
        ${(amount / 100).toFixed(0)} will be held but not charged.
      </Text>
      <Text style={styles.description}>
        The deposit will only be charged for no shows.
      </Text>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bounces={false}
      >
        {/* Saved Payment Methods */}
        {paymentMethods.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            {/* Saved Cards */}
            {paymentMethods.map((method) => (
              <Pressable
                key={method.id}
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === method.id && !useNewCard && styles.paymentMethodCardSelected,
                ]}
                onPress={() => {
                  setSelectedPaymentMethod(method.id);
                  setUseNewCard(false);
                  setError(null);
                }}
              >
                <View style={styles.paymentMethodInfo}>
                  <Ionicons 
                    name="card" 
                    size={20} 
                    color={selectedPaymentMethod === method.id && !useNewCard ? theme.colors.primary.main : theme.colors.text.secondary} 
                  />
                  <Text style={[
                    styles.paymentMethodText,
                    selectedPaymentMethod === method.id && !useNewCard && styles.paymentMethodTextSelected
                  ]}>
                    •••• {method.card?.last4 || '****'}
                  </Text>
                  <Text style={[
                    styles.paymentMethodBrand,
                    selectedPaymentMethod === method.id && !useNewCard && styles.paymentMethodTextSelected
                  ]}>
                    {method.card?.brand || 'Card'}
                  </Text>
                </View>
                <View style={[
                  styles.radioButton,
                  selectedPaymentMethod === method.id && !useNewCard && styles.radioButtonSelected,
                ]} />
              </Pressable>
            ))}
            
            {/* Add New Card Option */}
            <Pressable
              style={[
                styles.paymentMethodCard,
                useNewCard && styles.paymentMethodCardSelected,
              ]}
              onPress={() => {
                setUseNewCard(true);
                setSelectedPaymentMethod(null);
                setError(null);
              }}
            >
              <View style={styles.paymentMethodInfo}>
                <Ionicons 
                  name="add-circle-outline" 
                  size={20} 
                  color={useNewCard ? theme.colors.primary.main : theme.colors.text.secondary} 
                />
                <Text style={[
                  styles.paymentMethodText,
                  useNewCard && styles.paymentMethodTextSelected
                ]}>
                  Add new card
                </Text>
              </View>
              <View style={[
                styles.radioButton,
                useNewCard && styles.radioButtonSelected,
              ]} />
            </Pressable>
          </View>
        )}

        {/* New Card Input */}
        {(useNewCard || paymentMethods.length === 0) && (
          <View style={styles.section}>
            {paymentMethods.length === 0 && (
              <Text style={styles.sectionTitle}>Card Details</Text>
            )}
            {/* Card Input */}
            <View style={styles.cardInputContainer}>
              <View style={styles.cardFieldWrapper}>
                <CardField
                  postalCodeEnabled={true}
                  placeholders={{
                    number: 'Card number',
                    postalCode: '12345',
                  }}
                  onCardChange={handleCardChange}
                  cardStyle={cardFieldStyles}
                  style={styles.cardField}
                  autofocus={useNewCard && paymentMethods.length > 0}
                  accessible={true}
                  accessibilityLabel="Card number input"
                />
              </View>
              
              {/* Validation Indicators */}
              {cardDetails && !cardDetails.complete && cardDetails.number && (
                <View style={styles.validationContainer}>
                  {cardDetails.validNumber === 'Invalid' && (
                    <Text style={styles.validationText}>Invalid card number</Text>
                  )}
                  {cardDetails.validExpiryDate === 'Invalid' && (
                    <Text style={styles.validationText}>Invalid expiry date</Text>
                  )}
                  {cardDetails.validCVC === 'Invalid' && (
                    <Text style={styles.validationText}>Invalid CVC</Text>
                  )}
                </View>
              )}
            </View>

              <Pressable 
                style={styles.saveOption}
                onPress={() => !isLoading && setSaveCard(!saveCard)}
                disabled={isLoading}
              >
                <View style={styles.saveOptionContent}>
                  <Switch
                    value={saveCard}
                    onValueChange={setSaveCard}
                    disabled={isLoading}
                    trackColor={{ 
                      false: '#D1D5DB', 
                      true: theme.colors.brand.primary 
                    }}
                    thumbColor={theme.colors.white}
                    ios_backgroundColor="#D1D5DB"
                  />
                  <View style={styles.saveTextContainer}>
                    <Text style={styles.saveText}>Save card for future use</Text>
                    <Text style={styles.saveSubtext}>Secure and encrypted by Stripe</Text>
                  </View>
                </View>
                <Ionicons 
                  name="shield-checkmark" 
                  size={16} 
                  color={theme.colors.success?.main || '#4CAF50'} 
                />
              </Pressable>
          </View>
        )}

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.error.main} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.infoSection}>
            <View style={styles.securityBadges}>
              <View style={styles.badge}>
                <Ionicons name="lock-closed" size={14} color={theme.colors.text.secondary} />
                <Text style={styles.badgeText}>PCI Compliant</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Powered by</Text>
                <Text style={styles.stripeBrand}>Stripe</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[
              styles.confirmButton,
              (!useNewCard || !cardDetails?.complete || isLoading) && 
              !selectedPaymentMethod && 
              styles.confirmButtonDisabled,
            ]}
            onPress={validateAndProcess}
            disabled={
              isLoading || 
              (useNewCard && !cardDetails?.complete) ||
              (!useNewCard && !selectedPaymentMethod)
            }
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Text style={styles.confirmButtonText}>Reserve Now (Deposit Hold Only)</Text>
            )}
          </Pressable>
        </View>
    </KeyboardAvoidingView>
  );
};

const cardFieldStyles = {
  backgroundColor: '#FFFFFF',
  textColor: theme.colors.text.primary,
  placeholderColor: '#999999',
  borderColor: '#E5E7EB',
  borderWidth: 0,
  borderRadius: 8,
  fontSize: 16,
  cursorColor: theme.colors.brand.primary,
  textErrorColor: theme.colors.error.main,
  fontFamily: theme.typography?.fontFamily?.body || 'System',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.transparent,
    borderTopLeftRadius: scaleWidth(24),
    borderTopRightRadius: scaleWidth(24),
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: scaleHeight(16),
    right: scaleWidth(16),
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
    zIndex: 10,
  },
  title: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: scaleHeight(45),
    marginBottom: scaleHeight(12),
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingHorizontal: scaleWidth(20),
  },
  subtitle: {
    fontSize: scaleFont(15),
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(4),
    textAlign: 'center',
    paddingHorizontal: scaleWidth(20),
  },
  description: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    marginBottom: scaleHeight(20),
    textAlign: 'center',
    paddingHorizontal: scaleWidth(20),
  },
  content: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: scaleHeight(10),
  },
  section: {
    backgroundColor: theme.colors.transparent,
    padding: scaleWidth(20),
  },
  cardInputContainer: {
    marginBottom: scaleHeight(20),
  },
  cardFieldWrapper: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.gray?.['200'] || '#E5E7EB',
    paddingHorizontal: scaleWidth(16),
    overflow: 'hidden',
  },
  cardField: {
    width: '100%',
    height: scaleHeight(56),
  },
  validationContainer: {
    marginTop: scaleHeight(8),
    paddingHorizontal: scaleWidth(4),
  },
  validationText: {
    fontSize: scaleFont(12),
    color: theme.colors.error.main,
    marginBottom: scaleHeight(2),
  },
  saveOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.paper,
    padding: scaleWidth(12),
    borderRadius: 8,
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(20),
  },
  saveOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  saveTextContainer: {
    marginLeft: scaleWidth(12),
    flex: 1,
  },
  saveText: {
    fontSize: scaleFont(14),
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  saveSubtext: {
    fontSize: scaleFont(11),
    color: theme.colors.text.secondary,
    marginTop: scaleHeight(2),
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.error.light}20`,
    padding: scaleWidth(12),
    borderRadius: 8,
    marginHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(12),
  },
  errorText: {
    fontSize: scaleFont(14),
    color: theme.colors.error.main,
    marginLeft: scaleWidth(8),
    flex: 1,
  },
  infoSection: {
    padding: scaleWidth(20),
    alignItems: 'center',
  },
  securityBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(20),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
  },
  badgeText: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
  },
  stripeBrand: {
    fontSize: scaleFont(13),
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  footer: {
    padding: scaleWidth(20),
    paddingBottom: scaleHeight(20),
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
  },
  confirmButton: {
    backgroundColor: theme.colors.error.main,
    height: scaleHeight(56),
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.error.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmButtonDisabled: {
    backgroundColor: theme.colors.gray[300],
    shadowOpacity: 0,
  },
  confirmButtonText: {
    fontSize: scaleFont(17),
    fontWeight: '600',
    color: theme.colors.white,
  },
  sectionTitle: {
    fontSize: scaleFont(15),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(16),
    letterSpacing: 0.2,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.gray[50],
    borderRadius: 12,
    padding: scaleWidth(16),
    marginBottom: scaleHeight(12),
    borderWidth: 2,
    borderColor: theme.colors.gray?.['100'] || 'transparent',
  },
  paymentMethodCardSelected: {
    borderColor: theme.colors.primary.main,
    backgroundColor: theme.colors.primary['50'],
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
  },
  paymentMethodText: {
    fontSize: scaleFont(16),
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  paymentMethodTextSelected: {
    color: theme.colors.primary.main,
  },
  paymentMethodBrand: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    textTransform: 'capitalize',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.gray[300],
    backgroundColor: theme.colors.white,
  },
  radioButtonSelected: {
    borderColor: theme.colors.primary.main,
    backgroundColor: theme.colors.primary.main,
  },
});

export default CheckoutPaymentForm;