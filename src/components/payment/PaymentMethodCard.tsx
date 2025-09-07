import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '@/theme';
import { scaleHeight, scaleWidth, scaleFont } from '@/utils/responsive';

interface PaymentMethodCardProps {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault?: boolean;
  isDeleting?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  testID?: string;
}

export const PaymentMethodCard = memo<PaymentMethodCardProps>(({
  brand,
  last4,
  expMonth,
  expYear,
  isDefault,
  isDeleting,
  onPress,
  onDelete,
  onSetDefault,
  testID,
}) => {
  const getBrandIcon = () => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return 'card';
      case 'mastercard':
        return 'card';
      case 'amex':
        return 'card';
      default:
        return 'card-outline';
    }
  };

  const getBrandColor = () => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '#1A1F71';
      case 'mastercard':
        return '#EB001B';
      case 'amex':
        return '#006FCF';
      default:
        return theme.colors.text.secondary;
    }
  };

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const handleDelete = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onDelete?.();
  };

  const handleSetDefault = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSetDefault?.();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        isDefault && styles.defaultContainer,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
      disabled={isDeleting}
      testID={testID}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${brand} ending in ${last4}`}
    >
      <View style={styles.content}>
        <View style={styles.cardInfo}>
          <Ionicons
            name={getBrandIcon() as keyof typeof Ionicons.glyphMap}
            size={32}
            color={getBrandColor()}
            style={styles.icon}
          />
          <View style={styles.details}>
            <Text style={styles.brand}>{brand.toUpperCase()}</Text>
            <Text style={styles.number}>•••• {last4}</Text>
            <Text style={styles.expiry}>
              Expires {String(expMonth).padStart(2, '0')}/{expYear}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}

          {!isDefault && onSetDefault && (
            <Pressable
              onPress={handleSetDefault}
              style={styles.setDefaultButton}
              hitSlop={8}
            >
              <Text style={styles.setDefaultText}>Set Default</Text>
            </Pressable>
          )}

          {onDelete && (
            <Pressable
              onPress={handleDelete}
              style={styles.deleteButton}
              disabled={isDeleting}
              hitSlop={8}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={theme.colors.error.main} />
              ) : (
                <Ionicons name="trash-outline" size={20} color={theme.colors.error.main} />
              )}
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
});

PaymentMethodCard.displayName = 'PaymentMethodCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: scaleWidth(16),
    marginHorizontal: scaleWidth(16),
    marginVertical: scaleHeight(8),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  defaultContainer: {
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: scaleWidth(12),
  },
  details: {
    flex: 1,
  },
  brand: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(2),
  },
  number: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(4),
  },
  expiry: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
  },
  defaultBadge: {
    backgroundColor: `${theme.colors.primary.main}20`,
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
    borderRadius: 4,
  },
  defaultText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  setDefaultButton: {
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
  },
  setDefaultText: {
    fontSize: scaleFont(12),
    fontWeight: '500',
    color: theme.colors.primary.main,
  },
  deleteButton: {
    padding: scaleWidth(8),
  },
});