import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import {
  CardField,
  useStripe,
  CardFieldInput,
} from '@stripe/stripe-react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { scaleHeight, scaleWidth, scaleFont } from '@/utils/responsive';
import { usePaymentStore } from '@/store/paymentStore';
import { logger } from '@/utils/logger';

interface AddPaymentMethodSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess?: (paymentMethodId: string) => void;
}

export const AddPaymentMethodSheet: React.FC<AddPaymentMethodSheetProps> = ({
  isVisible,
  onClose,
  onSuccess,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const stripe = useStripe();
  const { createSetupIntent, addPaymentMethod, currentSetupIntent } = usePaymentStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState<CardFieldInput.Details | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCardChange = useCallback((details: CardFieldInput.Details) => {
    setCardDetails(details);
    if (error) {
      setError(null);
    }
  }, [error]);

  const handleAddCard = useCallback(async () => {
    if (!stripe || !cardDetails?.complete) {
      setError('Please enter valid card details');
      return;
    }

    // Validate US zip code (5 digits only)
    if (cardDetails.postalCode) {
      const zipCode = cardDetails.postalCode.replace(/\s/g, ''); // Remove spaces
      if (!/^\d{5}$/.test(zipCode)) {
        setError('Please enter a valid 5-digit US zip code');
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      let setupIntentClientSecret = currentSetupIntent?.clientSecret;

      if (!setupIntentClientSecret) {
        const success = await createSetupIntent();
        if (!success || !usePaymentStore.getState().currentSetupIntent) {
          throw new Error('Failed to initialize payment setup');
        }
        const setupIntent = usePaymentStore.getState().currentSetupIntent;
        setupIntentClientSecret = setupIntent?.clientSecret || '';
      }

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
        throw new Error('Failed to save payment method');
      }

      const added = await addPaymentMethod(setupIntent.paymentMethodId);
      
      if (!added) {
        throw new Error('Failed to save payment method');
      }

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      onSuccess?.(setupIntent.paymentMethodId);
      onClose();
    } catch (err) {
      logger.error('Failed to add payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to add payment method');
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [stripe, cardDetails, currentSetupIntent, createSetupIntent, addPaymentMethod, onSuccess, onClose]);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    
    setCardDetails(null);
    setError(null);
    onClose();
  }, [isLoading, onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={['60%']}
      enablePanDownToClose
      onClose={handleClose}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Add Payment Method</Text>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </Pressable>
        </View>

        <Text style={styles.description}>
          Add a card to place holds for bookings. You&apos;ll only be charged if you cancel last minute or don&apos;t show up.
        </Text>

        <View style={styles.cardFieldContainer}>
          <Text style={styles.label}>Card Details</Text>
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
          />
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={theme.colors.error.main} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.securityInfo}>
          <Ionicons name="lock-closed" size={16} color={theme.colors.text.secondary} />
          <Text style={styles.securityText}>
            Your payment information is encrypted and secure. We use Stripe to process payments.
          </Text>
        </View>

        <Pressable
          style={[
            styles.addButton,
            (!cardDetails?.complete || isLoading) && styles.addButtonDisabled,
          ]}
          onPress={handleAddCard}
          disabled={!cardDetails?.complete || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.addButtonText}>Add Card</Text>
          )}
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const cardFieldStyles = {
  backgroundColor: theme.colors.white,
  textColor: '#000000',
  placeholderColor: '#999999',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: theme.colors.gray['200'],
  fontSize: 16,
};

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: theme.colors.border,
    width: 40,
    height: 4,
  },
  contentContainer: {
    paddingHorizontal: scaleWidth(24),
    paddingBottom: scaleHeight(40),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
  },
  title: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: scaleWidth(8),
  },
  description: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    lineHeight: scaleFont(20),
    marginBottom: scaleHeight(24),
  },
  cardFieldContainer: {
    marginBottom: scaleHeight(24),
  },
  label: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(8),
  },
  cardField: {
    height: scaleHeight(50),
    marginVertical: scaleHeight(8),
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.error.main}10`,
    padding: scaleWidth(12),
    borderRadius: 8,
    marginBottom: scaleHeight(16),
  },
  errorText: {
    fontSize: scaleFont(14),
    color: theme.colors.error.main,
    marginLeft: scaleWidth(8),
    flex: 1,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.default,
    padding: scaleWidth(12),
    borderRadius: 8,
    marginBottom: scaleHeight(24),
  },
  securityText: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    marginLeft: scaleWidth(8),
    flex: 1,
    lineHeight: scaleFont(16),
  },
  addButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: scaleHeight(16),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: theme.colors.text.disabled,
  },
  addButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.white,
  },
});