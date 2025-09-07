import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { scaleHeight, scaleWidth, scaleFont } from '@/utils/responsive';

interface PaymentStatusBannerProps {
  type: 'hold_placed' | 'no_payment_method' | 'payment_required';
  message?: string;
  onAction?: () => void;
  actionText?: string;
}

export const PaymentStatusBanner: React.FC<PaymentStatusBannerProps> = ({
  type,
  message,
  onAction,
  actionText,
}) => {
  const getBannerStyle = () => {
    switch (type) {
      case 'hold_placed':
        return {
          backgroundColor: `${theme.colors.success.main}10`,
          borderColor: theme.colors.success.main,
          iconColor: theme.colors.success.main,
          icon: 'checkmark-circle' as const,
        };
      case 'no_payment_method':
        return {
          backgroundColor: `${theme.colors.warning.main}10`,
          borderColor: theme.colors.warning.main,
          iconColor: theme.colors.warning.main,
          icon: 'card-outline' as const,
        };
      case 'payment_required':
        return {
          backgroundColor: `${theme.colors.error.main}10`,
          borderColor: theme.colors.error.main,
          iconColor: theme.colors.error.main,
          icon: 'alert-circle' as const,
        };
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'hold_placed':
        return 'Payment hold active. Released after attendance.';
      case 'no_payment_method':
        return 'Add a payment method to book dinners';
      case 'payment_required':
        return 'Payment method required for booking';
    }
  };

  const style = getBannerStyle();
  const displayMessage = message || getDefaultMessage();

  return (
    <View style={[styles.container, { backgroundColor: style.backgroundColor, borderColor: style.borderColor }]}>
      <View style={styles.content}>
        <Ionicons name={style.icon} size={20} color={style.iconColor} />
        <Text style={styles.message}>{displayMessage}</Text>
      </View>
      {onAction && actionText && (
        <Pressable style={styles.actionButton} onPress={onAction}>
          <Text style={[styles.actionText, { color: style.iconColor }]}>{actionText}</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: scaleWidth(16),
    marginVertical: scaleHeight(8),
    padding: scaleWidth(12),
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: scaleWidth(8),
  },
  message: {
    fontSize: scaleFont(14),
    color: theme.colors.text.primary,
    flex: 1,
  },
  actionButton: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(4),
  },
  actionText: {
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
});