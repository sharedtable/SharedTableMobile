import React, { useState, useCallback, useMemo } from 'react';
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
  const { paymentMethods, createSetupIntent, currentSetupIntent } = usePaymentStore();
  
  // State management
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(
    paymentMethods.length > 0 ? paymentMethods[0].id : null
  );
  const [useNewCard, setUseNewCard] = useState(paymentMethods.length === 0);
  const [cardDetails, setCardDetails] = useState<CardFieldInput.Details | null>(null);
  const [saveCard, setSaveCard] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSavedCards = paymentMethods.length > 0;
  const isLoading = loading || processing;

  const formattedAmount = useMemo(() => {
    return `$${(amount / 100).toFixed(2)}`;
  }, [amount]);

  const handleCardChange = useCallback((details: CardFieldInput.Details) => {
    setCardDetails(details);
    if (error) {
      setError(null);
    }
  }, [error]);

  const handleSelectSavedCard = useCallback((cardId: string) => {
    setSelectedPaymentMethod(cardId);
    setUseNewCard(false);
    if (error) {
      setError(null);
    }
  }, [error]);

  const handleUseNewCard = useCallback(() => {
    setUseNewCard(true);
    setSelectedPaymentMethod(null);
    if (error) {
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

        // Validate US zip code
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
      <View style={styles.header}>
        <Text style={styles.title}>Payment Details</Text>
        <Text style={styles.amount}>Hold Amount: {formattedAmount}</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {hasSavedCards && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            {paymentMethods.map((method) => (
              <Pressable
                key={method.id}
                style={[
                  styles.savedCard,
                  selectedPaymentMethod === method.id && !useNewCard && styles.savedCardSelected,
                ]}
                onPress={() => handleSelectSavedCard(method.id)}
                disabled={isLoading}
              >
                <View style={styles.savedCardLeft}>
                  <View style={styles.radioOuter}>
                    {selectedPaymentMethod === method.id && !useNewCard && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Ionicons 
                    name="card" 
                    size={24} 
                    color={theme.colors.text.secondary}
                    style={styles.cardIcon}
                  />
                  <View>
                    <Text style={styles.cardBrand}>
                      {method.card?.brand?.toUpperCase() || 'Card'}
                    </Text>
                    <Text style={styles.cardLast4}>
                      •••• {method.card?.last4 || '****'}
                    </Text>
                  </View>
                </View>
                {method.card?.expMonth && method.card?.expYear && (
                  <Text style={styles.cardExpiry}>
                    {String(method.card.expMonth).padStart(2, '0')}/{String(method.card.expYear).slice(-2)}
                  </Text>
                )}
              </Pressable>
            ))}

            <Pressable
              style={[
                styles.newCardOption,
                useNewCard && styles.newCardOptionSelected,
              ]}
              onPress={handleUseNewCard}
              disabled={isLoading}
            >
              <View style={styles.radioOuter}>
                {useNewCard && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.newCardText}>Use a different card</Text>
            </Pressable>
          </View>
        )}

        {useNewCard && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {hasSavedCards ? 'New Card Details' : 'Card Details'}
            </Text>
            
            <CardField
              postalCodeEnabled={true}
              countryCode="US"
              placeholders={{
                number: '4242 4242 4242 4242',
                postalCode: '12345',
              }}
              cardStyle={cardFieldStyles}
              style={styles.cardField}
              onCardChange={handleCardChange}
              // editable={!isLoading} // Note: CardField doesn't support editable prop
            />

            <View style={styles.saveOption}>
              <Text style={styles.saveText}>Save card for future bookings</Text>
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
            </View>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={theme.colors.error.main} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="lock-closed" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.infoText}>
              Your payment info is encrypted and secure
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.infoText}>
              You&apos;ll only be charged for no-shows or late cancellations
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
        
        <Pressable
          style={[
            styles.button,
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
            <Text style={styles.confirmButtonText}>Confirm Booking</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const cardFieldStyles = {
  backgroundColor: '#FFFFFF',
  textColor: '#000000',
  placeholderColor: '#999999',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#E0E0E0',
  fontSize: 16,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.paper,
  },
  header: {
    padding: scaleWidth(20),
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  title: {
    fontSize: scaleFont(20),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(4),
  },
  amount: {
    fontSize: scaleFont(16),
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: theme.colors.white,
    padding: scaleWidth(20),
    marginBottom: scaleHeight(12),
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(16),
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scaleWidth(16),
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: 12,
    marginBottom: scaleHeight(12),
  },
  savedCardSelected: {
    borderColor: theme.colors.primary.main,
    backgroundColor: `${theme.colors.primary.light}10`,
  },
  savedCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.gray[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(12),
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary.main,
  },
  cardIcon: {
    marginRight: scaleWidth(12),
  },
  cardBrand: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  cardLast4: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
    marginTop: scaleHeight(2),
  },
  cardExpiry: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
  },
  newCardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scaleWidth(16),
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: 12,
  },
  newCardOptionSelected: {
    borderColor: theme.colors.primary.main,
    backgroundColor: `${theme.colors.primary.light}10`,
  },
  newCardText: {
    fontSize: scaleFont(15),
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  cardField: {
    height: scaleHeight(50),
    marginBottom: scaleHeight(16),
  },
  saveOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: scaleHeight(8),
  },
  saveText: {
    fontSize: scaleFont(15),
    color: theme.colors.text.primary,
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
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(12),
  },
  infoText: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
    marginLeft: scaleWidth(8),
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: scaleWidth(20),
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  button: {
    flex: 1,
    height: scaleHeight(48),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.gray[200],
    marginRight: scaleWidth(12),
  },
  cancelButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary.main,
  },
  confirmButtonDisabled: {
    backgroundColor: theme.colors.gray[300],
  },
  confirmButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.white,
  },
});

export default CheckoutPaymentForm;