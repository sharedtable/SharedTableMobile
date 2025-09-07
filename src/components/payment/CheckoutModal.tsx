import React from 'react';
import {
  Modal,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import CheckoutPaymentForm from './CheckoutPaymentForm';
import { theme } from '@/theme';

interface CheckoutModalProps {
  visible: boolean;
  amount: number;
  onSuccess: (paymentMethodId: string, shouldSave: boolean) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  visible,
  amount,
  onSuccess,
  onCancel,
  loading,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.container}>
        <CheckoutPaymentForm
          amount={amount}
          onSuccess={onSuccess}
          onCancel={onCancel}
          loading={loading}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.paper,
    ...Platform.select({
      ios: {
        paddingTop: 0,
      },
      android: {
        paddingTop: 0,
      },
    }),
  },
});

export default CheckoutModal;