import {
  StripeProvider,
  useStripe,
  CardField,
  initPaymentSheet,
  presentPaymentSheet,
  PaymentSheetError,
} from '@stripe/stripe-react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/services/api';
import { logger } from '@/utils/logger';

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

export interface PaymentIntentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

export interface SetupIntentResult {
  success: boolean;
  setupIntentId?: string;
  clientSecret?: string;
  customerId?: string;
  error?: string;
}

const PAYMENT_METHOD_CACHE_KEY = 'cached_payment_methods';
const DEFAULT_PAYMENT_METHOD_KEY = 'default_payment_method_id';

export class StripeService {
  private static publishableKey: string | null = null;

  static async initialize(publishableKey: string) {
    this.publishableKey = publishableKey;
  }

  static async createSetupIntent(): Promise<SetupIntentResult> {
    try {
      const response = await (api as any).client.post('/payments/setup-intent', {});
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create setup intent');
      }

      return {
        success: true,
        setupIntentId: response.data.data.setupIntentId,
        clientSecret: response.data.data.clientSecret,
        customerId: response.data.data.customerId,
      };
    } catch (error) {
      logger.error('Failed to create setup intent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize payment setup',
      };
    }
  }

  static async getEphemeralKey(): Promise<{ ephemeralKey: string; customerId: string } | null> {
    try {
      const response = await (api as any).client.post('/payments/ephemeral-key', {});
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get ephemeral key');
      }

      return {
        ephemeralKey: response.data.data.ephemeralKey,
        customerId: response.data.data.customerId,
      };
    } catch (error) {
      logger.error('Failed to get ephemeral key:', error);
      return null;
    }
  }

  static async savePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(DEFAULT_PAYMENT_METHOD_KEY, paymentMethodId);
      
      const existingMethods = await this.getCachedPaymentMethods();
      const newMethod: PaymentMethod = {
        id: paymentMethodId,
        type: 'card',
      };
      
      const updatedMethods = [...existingMethods, newMethod];
      await SecureStore.setItemAsync(
        PAYMENT_METHOD_CACHE_KEY,
        JSON.stringify(updatedMethods)
      );
      
      return true;
    } catch (error) {
      logger.error('Failed to save payment method:', error);
      return false;
    }
  }

  static async getDefaultPaymentMethod(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(DEFAULT_PAYMENT_METHOD_KEY);
    } catch (error) {
      logger.error('Failed to get default payment method:', error);
      return null;
    }
  }

  static async getCachedPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const cached = await SecureStore.getItemAsync(PAYMENT_METHOD_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      logger.error('Failed to get cached payment methods:', error);
      return [];
    }
  }

  static async fetchPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await (api as any).client.get('/payments/payment-methods');
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch payment methods');
      }

      const methods = response.data.data as PaymentMethod[];
      
      await SecureStore.setItemAsync(
        PAYMENT_METHOD_CACHE_KEY,
        JSON.stringify(methods)
      );
      
      return methods;
    } catch (error) {
      logger.error('Failed to fetch payment methods:', error);
      
      return await this.getCachedPaymentMethods();
    }
  }

  static async removePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      const response = await (api as any).client.delete(`/payments/payment-methods/${paymentMethodId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to remove payment method');
      }

      const cachedMethods = await this.getCachedPaymentMethods();
      const updatedMethods = cachedMethods.filter(pm => pm.id !== paymentMethodId);
      await SecureStore.setItemAsync(
        PAYMENT_METHOD_CACHE_KEY,
        JSON.stringify(updatedMethods)
      );

      const defaultMethodId = await this.getDefaultPaymentMethod();
      if (defaultMethodId === paymentMethodId) {
        await SecureStore.deleteItemAsync(DEFAULT_PAYMENT_METHOD_KEY);
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to remove payment method:', error);
      return false;
    }
  }

  static async createBookingHold(
    dinnerId: string,
    paymentMethodId: string
  ): Promise<PaymentIntentResult> {
    try {
      const response = await (api as any).client.post('/payments/booking-hold', {
        dinnerId,
        paymentMethodId,
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create booking hold');
      }

      return {
        success: true,
        paymentIntentId: response.data.data.paymentIntentId,
      };
    } catch (error) {
      logger.error('Failed to create booking hold:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to place payment hold',
      };
    }
  }

  static async captureBookingHold(
    bookingId: string,
    chargeAmount?: number,
    reason?: string
  ): Promise<boolean> {
    try {
      const response = await (api as any).client.post('/payments/capture-hold', {
        bookingId,
        chargeAmount,
        reason,
      });
      
      return response.data.success;
    } catch (error) {
      logger.error('Failed to capture booking hold:', error);
      return false;
    }
  }

  static async releaseBookingHold(bookingId: string): Promise<boolean> {
    try {
      const response = await (api as any).client.post('/payments/release-hold', {
        bookingId,
      });
      
      return response.data.success;
    } catch (error) {
      logger.error('Failed to release booking hold:', error);
      return false;
    }
  }

  static async initializePaymentSheet(
    clientSecret: string,
    customerId?: string,
    ephemeralKey?: string
  ): Promise<{ error?: any }> {
    try {
      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        customerId,
        customerEphemeralKeySecret: ephemeralKey,
        merchantDisplayName: 'SharedTable',
        defaultBillingDetails: {
          name: 'Guest User',
        },
        style: 'alwaysDark',
        googlePay: {
          merchantCountryCode: 'US',
          testEnv: __DEV__,
        },
        applePay: {
          merchantCountryCode: 'US',
        },
        returnURL: 'sharedtable://stripe-redirect',
      });

      if (error) {
        logger.error('Failed to initialize payment sheet:', error);
      }

      return { error: error as any };
    } catch (error) {
      logger.error('Failed to initialize payment sheet:', error);
      return {
        error: {
          code: PaymentSheetError.Failed,
          message: 'Failed to initialize payment',
        } as any,
      };
    }
  }

  static async presentPaymentSheet(): Promise<{ error?: any }> {
    try {
      const { error } = await presentPaymentSheet();
      
      if (error) {
        logger.error('Payment sheet error:', error);
      }
      
      return { error: error as any };
    } catch (error) {
      logger.error('Failed to present payment sheet:', error);
      return {
        error: {
          code: PaymentSheetError.Failed,
          message: 'Failed to complete payment',
        } as any,
      };
    }
  }

  static async clearPaymentData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(PAYMENT_METHOD_CACHE_KEY);
      await SecureStore.deleteItemAsync(DEFAULT_PAYMENT_METHOD_KEY);
    } catch (error) {
      logger.error('Failed to clear payment data:', error);
    }
  }
}

export { StripeProvider, useStripe, CardField };
export default StripeService;