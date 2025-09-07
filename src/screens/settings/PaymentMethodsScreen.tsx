import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PaymentMethodCard } from '@/components/payment/PaymentMethodCard';
import { AddPaymentMethodSheet } from '@/components/payment/AddPaymentMethodSheet';
import { usePaymentStore } from '@/store/paymentStore';
import { theme } from '@/theme';
import { scaleHeight, scaleWidth, scaleFont } from '@/utils/responsive';

export function PaymentMethodsScreen() {
  const navigation = useNavigation();
  const {
    paymentMethods,
    defaultPaymentMethodId,
    isLoading,
    error,
    initializePayments,
    fetchPaymentMethods,
    removePaymentMethod,
    setDefaultPaymentMethod,
    clearError,
  } = usePaymentStore();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [deletingMethodId, setDeletingMethodId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializePayments();
  }, [initializePayments]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: clearError },
      ]);
    }
  }, [error, clearError]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPaymentMethods();
    setRefreshing(false);
  }, [fetchPaymentMethods]);

  const handleAddPaymentMethod = useCallback(() => {
    if (__DEV__) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowAddSheet(true);
  }, []);

  const handlePaymentMethodAdded = useCallback(async () => {
    setShowAddSheet(false);
    await fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const handleRemovePaymentMethod = useCallback((methodId: string) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDeletingMethodId(methodId);
            const success = await removePaymentMethod(methodId);
            if (!success) {
              Alert.alert('Error', 'Failed to remove payment method');
            }
            setDeletingMethodId(null);
          },
        },
      ]
    );
  }, [removePaymentMethod]);

  const handleSetDefault = useCallback(async (methodId: string) => {
    await setDefaultPaymentMethod(methodId);
  }, [setDefaultPaymentMethod]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="card-outline" size={64} color={theme.colors.text.disabled} />
      <Text style={styles.emptyTitle}>No Payment Methods</Text>
      <Text style={styles.emptyDescription}>
        Add a payment method to book dining events
      </Text>
      <Pressable style={styles.addButtonLarge} onPress={handleAddPaymentMethod}>
        <Ionicons name="add" size={24} color={theme.colors.white} />
        <Text style={styles.addButtonLargeText}>Add Payment Method</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={styles.backButton} />
      </View>

      {isLoading && paymentMethods.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      ) : paymentMethods.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            <Text style={styles.sectionTitle}>Your Cards</Text>
            {paymentMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                id={method.id}
                brand={method.card?.brand || 'Card'}
                last4={method.card?.last4 || '••••'}
                expMonth={method.card?.expMonth || 0}
                expYear={method.card?.expYear || 0}
                isDefault={method.id === defaultPaymentMethodId}
                isDeleting={deletingMethodId === method.id}
                onDelete={() => handleRemovePaymentMethod(method.id)}
                onSetDefault={
                  method.id !== defaultPaymentMethodId
                    ? () => handleSetDefault(method.id)
                    : undefined
                }
              />
            ))}

            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                <Ionicons name="shield-checkmark" size={24} color={theme.colors.success.main} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>How Payment Holds Work</Text>
                  <Text style={styles.infoText}>
                    When you book a dining event, we place a temporary hold on your card 
                    for 120% of the event cost. The hold is released after you attend. 
                    You&apos;re only charged if you cancel within 24 hours or don&apos;t show up.
                  </Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Ionicons name="lock-closed" size={24} color={theme.colors.primary.main} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Your Payment is Secure</Text>
                  <Text style={styles.infoText}>
                    We use industry-standard encryption to protect your payment information. 
                    Card details are stored securely with Stripe and never on our servers.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.bottomBar}>
            <Pressable style={styles.addButton} onPress={handleAddPaymentMethod}>
              <Ionicons name="add" size={20} color={theme.colors.white} />
              <Text style={styles.addButtonText}>Add Card</Text>
            </Pressable>
          </View>
        </>
      )}

      <AddPaymentMethodSheet
        isVisible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onSuccess={handlePaymentMethodAdded}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: scaleWidth(8),
    width: scaleWidth(44),
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: scaleHeight(16),
  },
  sectionTitle: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(12),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(32),
  },
  emptyTitle: {
    fontSize: scaleFont(20),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: scaleHeight(16),
    marginBottom: scaleHeight(8),
  },
  emptyDescription: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: scaleHeight(24),
  },
  addButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(14),
    borderRadius: 12,
  },
  addButtonLargeText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.white,
    marginLeft: scaleWidth(8),
  },
  infoSection: {
    marginTop: scaleHeight(24),
    paddingHorizontal: scaleWidth(16),
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    padding: scaleWidth(16),
    borderRadius: 12,
    marginBottom: scaleHeight(12),
    ...theme.shadows.sm,
  },
  infoContent: {
    flex: 1,
    marginLeft: scaleWidth(12),
  },
  infoTitle: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(4),
  },
  infoText: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    lineHeight: scaleFont(18),
  },
  bottomBar: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.main,
    paddingVertical: scaleHeight(12),
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.white,
    marginLeft: scaleWidth(6),
  },
});