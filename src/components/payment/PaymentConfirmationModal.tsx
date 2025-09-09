import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { scaleHeight, scaleWidth, scaleFont } from '@/utils/responsive';

interface PaymentConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
  eventDetails: {
    date: string;
    time: string;
    dayOfWeek: string;
  };
  paymentDetails: {
    cardBrand: string;
    last4: string;
    holdAmount: number;
  };
}

export const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  isProcessing,
  eventDetails,
  paymentDetails,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="shield-checkmark" size={48} color={theme.colors.success.main} />
            <Text style={styles.title}>Confirm Your Booking</Text>
          </View>

          {/* Event Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Details</Text>
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.detailText}>
                {eventDetails.dayOfWeek}, {eventDetails.date} at {eventDetails.time}
              </Text>
            </View>
          </View>

          {/* Payment Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.cardRow}>
              <Ionicons name="card" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.detailText}>
                {paymentDetails.cardBrand} •••• {paymentDetails.last4}
              </Text>
            </View>
            <View style={styles.holdInfo}>
              <Text style={styles.holdAmount}>
                Hold Amount: ${(paymentDetails.holdAmount / 100).toFixed(2)}
              </Text>
              <Text style={styles.holdNote}>
                This is a temporary hold. You&apos;ll only be charged if you cancel within 24 hours or don&apos;t show up.
              </Text>
            </View>
          </View>

          {/* Terms */}
          <View style={styles.termsSection}>
            <View style={styles.termItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success.main} />
              <Text style={styles.termText}>Free cancellation up to 24 hours before</Text>
            </View>
            <View style={styles.termItem}>
              <Ionicons name="information-circle" size={20} color={theme.colors.primary.main} />
              <Text style={styles.termText}>Hold released after you attend</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isProcessing}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.confirmButton, isProcessing && styles.buttonDisabled]}
              onPress={onConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <>
                  <Ionicons name="lock-closed" size={20} color={theme.colors.white} />
                  <Text style={styles.confirmButtonText}>Confirm & Place Hold</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay.medium,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleWidth(20),
  },
  modal: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: scaleWidth(24),
    width: '100%',
    maxWidth: 400,
    ...theme.shadows.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: scaleHeight(24),
  },
  title: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: scaleHeight(12),
  },
  section: {
    marginBottom: scaleHeight(20),
  },
  sectionTitle: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: scaleHeight(8),
    textTransform: 'uppercase',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(8),
  },
  detailText: {
    fontSize: scaleFont(16),
    color: theme.colors.text.primary,
  },
  holdInfo: {
    backgroundColor: `${theme.colors.primary.main}10`,
    padding: scaleWidth(12),
    borderRadius: 8,
    marginTop: scaleHeight(8),
  },
  holdAmount: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: theme.colors.primary.main,
    marginBottom: scaleHeight(4),
  },
  holdNote: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    lineHeight: scaleFont(16),
  },
  termsSection: {
    marginBottom: scaleHeight(24),
    gap: scaleHeight(8),
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  termText: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: scaleWidth(12),
  },
  button: {
    flex: 1,
    paddingVertical: scaleHeight(14),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: scaleWidth(8),
  },
  cancelButton: {
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary.main,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  confirmButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.white,
  },
});