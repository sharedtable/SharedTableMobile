import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import {
  CardField,
  useStripe,
  CardFieldInput,
} from '@stripe/stripe-react-native';
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
  const { createSetupIntent, currentSetupIntent } = usePaymentStore();
  
  // State management
  const [_selectedPaymentMethod, _setSelectedPaymentMethod] = useState<string | null>(null);
  const [_useNewCard, _setUseNewCard] = useState(true);
  const useNewCard = _useNewCard; // Always use new card for now
  const selectedPaymentMethod = _selectedPaymentMethod;
  const [cardDetails, setCardDetails] = useState<CardFieldInput.Details | null>(null);
  const [saveCard, setSaveCard] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoading = loading || processing;


  const handleCardChange = useCallback((details: CardFieldInput.Details) => {
    setCardDetails(details);
    if (error && details.complete) {
      setError(null);
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

      // Haptic feedback for success
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Call success callback
      onSuccess(paymentMethodId, useNewCard && saveCard);
    } catch (err) {
      logger.error('Payment processing error:', err);
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
    onSuccess,
  ]);

  return (
    <View style={styles.container}>
      <Pressable style={styles.closeButton} onPress={onCancel}>
        <Ionicons name="close" size={24} color={theme.colors.text.primary} />
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
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
              {/* Card Input with Camera Button */}
              <View style={styles.cardFieldWrapper}>
                <CardField
                  postalCodeEnabled={false}
                  placeholders={{
                    number: '4242 4242 4242 4242',
                  }}
                  onCardChange={handleCardChange}
                  cardStyle={cardFieldStyles}
                  style={styles.cardField}
                />
                <Pressable 
                  style={styles.cameraButton}
                  onPress={() => {
                    // TODO: Implement card scanner
                    console.log('Open card scanner');
                  }}
                >
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                </Pressable>
              </View>

              <View style={styles.saveOption}>
                <Switch
                  value={saveCard}
                  onValueChange={setSaveCard}
                  disabled={isLoading}
                  trackColor={{ 
                    false: theme.colors.gray[300], 
                    true: theme.colors.primary.main 
                  }}
                  thumbColor={theme.colors.white}
                />
                <Text style={styles.saveText}>Save card for future bookings</Text>
              </View>
            </View>

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
    </View>
  );
};

const cardFieldStyles = {
  backgroundColor: '#F8F8F8',
  textColor: '#000000',
  placeholderColor: '#999999',
  borderColor: '#F8F8F8',
  borderWidth: 0,
  borderRadius: 12,
  fontSize: 16,
  cursorColor: '#000000',
  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: scaleHeight(20),
    right: scaleWidth(20),
    padding: scaleWidth(8),
    zIndex: 10,
  },
  title: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: scaleHeight(50),
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
  section: {
    backgroundColor: theme.colors.white,
    padding: scaleWidth(20),
  },
  cardFieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(20),
    position: 'relative',
  },
  cardField: {
    flex: 1,
    height: scaleHeight(56),
    marginRight: scaleWidth(48),
  },
  cameraButton: {
    backgroundColor: theme.colors.error.main,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: scaleWidth(4),
    top: scaleHeight(8),
  },
  saveOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(20),
  },
  saveText: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    marginLeft: scaleWidth(12),
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
    paddingBottom: scaleHeight(30),
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
});

export default CheckoutPaymentForm;