import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Pressable,
  Dimensions,
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
      presentationStyle="overFullScreen"
      onRequestClose={onCancel}
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.invisibleArea} onPress={onCancel} />
        <View style={styles.modalContent}>
          <CheckoutPaymentForm
            amount={amount}
            onSuccess={onSuccess}
            onCancel={onCancel}
            loading={loading}
          />
        </View>
      </View>
    </Modal>
  );
};

const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  invisibleArea: {
    flex: 1,
    // No background color - completely transparent
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: screenHeight * 0.67, // Takes up 2/3 of screen height
    shadowColor: theme.colors.black['1'],
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
});

export default CheckoutModal;