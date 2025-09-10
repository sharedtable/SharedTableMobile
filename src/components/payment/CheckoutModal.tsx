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
import { scaleHeight, scaleWidth } from '@/utils/responsive';

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

// Calculate the height to match the white card area from HomeScreen
const CARD_TOP_POSITION = scaleHeight(210); // Same as contentCardContainer top position
const MODAL_HEIGHT = screenHeight - CARD_TOP_POSITION;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  invisibleArea: {
    flex: 1,
    // No background - completely transparent
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: scaleWidth(24), // Match HomeScreen's contentCardContainer
    borderTopRightRadius: scaleWidth(24), // Match HomeScreen's contentCardContainer
    height: MODAL_HEIGHT, // Fixed height to match white card area
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