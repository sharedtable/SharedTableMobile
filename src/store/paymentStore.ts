import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import StripeService, { PaymentMethod } from '@/services/stripe';
import { logger } from '@/utils/logger';

export interface PaymentState {
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  currentSetupIntent: {
    id: string;
    clientSecret: string;
    customerId: string;
  } | null;
  currentPaymentIntent: {
    id: string;
    clientSecret?: string;
    amount: number;
    eventId: string;
  } | null;
}

export interface PaymentActions {
  initializePayments: () => Promise<void>;
  fetchPaymentMethods: () => Promise<void>;
  addPaymentMethod: (paymentMethodId: string) => Promise<boolean>;
  removePaymentMethod: (paymentMethodId: string) => Promise<boolean>;
  setDefaultPaymentMethod: (paymentMethodId: string) => Promise<void>;
  createSetupIntent: () => Promise<boolean>;
  createBookingHold: (dinnerId: string, amount: number) => Promise<boolean>;
  captureBookingHold: (bookingId: string, amount?: number, reason?: string) => Promise<boolean>;
  releaseBookingHold: (bookingId: string) => Promise<boolean>;
  clearPaymentData: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export type PaymentStore = PaymentState & PaymentActions;

const initialState: PaymentState = {
  paymentMethods: [],
  defaultPaymentMethodId: null,
  isLoading: false,
  error: null,
  isInitialized: false,
  currentSetupIntent: null,
  currentPaymentIntent: null,
};

export const usePaymentStore = create<PaymentStore>()(
  immer((set, get) => ({
    ...initialState,

    initializePayments: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const defaultMethodId = await StripeService.getDefaultPaymentMethod();
        
        const methods = await StripeService.fetchPaymentMethods();

        set((state) => {
          state.paymentMethods = methods;
          state.defaultPaymentMethodId = defaultMethodId;
          state.isInitialized = true;
          state.isLoading = false;
        });
      } catch (error) {
        logger.error('Failed to initialize payments:', error);
        set((state) => {
          state.error = 'Failed to initialize payment methods';
          state.isLoading = false;
        });
      }
    },

    fetchPaymentMethods: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const methods = await StripeService.fetchPaymentMethods();
        
        set((state) => {
          state.paymentMethods = methods;
          state.isLoading = false;
        });
      } catch (error) {
        logger.error('Failed to fetch payment methods:', error);
        set((state) => {
          state.error = 'Failed to load payment methods';
          state.isLoading = false;
        });
      }
    },

    addPaymentMethod: async (paymentMethodId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const saved = await StripeService.savePaymentMethod(paymentMethodId);
        
        if (!saved) {
          throw new Error('Failed to save payment method');
        }

        await get().fetchPaymentMethods();

        if (get().paymentMethods.length === 1) {
          await get().setDefaultPaymentMethod(paymentMethodId);
        }

        set((state) => {
          state.isLoading = false;
        });

        return true;
      } catch (error) {
        logger.error('Failed to add payment method:', error);
        set((state) => {
          state.error = 'Failed to add payment method';
          state.isLoading = false;
        });
        return false;
      }
    },

    removePaymentMethod: async (paymentMethodId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const removed = await StripeService.removePaymentMethod(paymentMethodId);
        
        if (!removed) {
          throw new Error('Failed to remove payment method');
        }

        set((state) => {
          state.paymentMethods = state.paymentMethods.filter(
            (pm: PaymentMethod) => pm.id !== paymentMethodId
          );
          
          if (state.defaultPaymentMethodId === paymentMethodId) {
            state.defaultPaymentMethodId = null;
            
            if (state.paymentMethods.length > 0) {
              state.defaultPaymentMethodId = state.paymentMethods[0].id;
            }
          }
          
          state.isLoading = false;
        });

        return true;
      } catch (error) {
        logger.error('Failed to remove payment method:', error);
        set((state) => {
          state.error = 'Failed to remove payment method';
          state.isLoading = false;
        });
        return false;
      }
    },

    setDefaultPaymentMethod: async (paymentMethodId: string) => {
      try {
        await StripeService.savePaymentMethod(paymentMethodId);
        
        set((state) => {
          state.defaultPaymentMethodId = paymentMethodId;
        });
      } catch (error) {
        logger.error('Failed to set default payment method:', error);
        set((state) => {
          state.error = 'Failed to set default payment method';
        });
      }
    },

    createSetupIntent: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const result = await StripeService.createSetupIntent();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create setup intent');
        }

        set((state) => {
          state.currentSetupIntent = {
            id: result.setupIntentId || '',
            clientSecret: result.clientSecret || '',
            customerId: result.customerId || '',
          };
          state.isLoading = false;
        });

        return true;
      } catch (error) {
        logger.error('Failed to create setup intent:', error);
        set((state) => {
          state.error = 'Failed to initialize card setup';
          state.isLoading = false;
        });
        return false;
      }
    },

    createBookingHold: async (dinnerId: string, amount: number) => {
      const { defaultPaymentMethodId } = get();
      
      if (!defaultPaymentMethodId) {
        set((state) => {
          state.error = 'Please add a payment method first';
        });
        return false;
      }

      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const result = await StripeService.createBookingHold(
          dinnerId,
          defaultPaymentMethodId
        );
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create payment hold');
        }

        set((state) => {
          state.currentPaymentIntent = {
            id: result.paymentIntentId || '',
            amount,
            eventId: dinnerId, // Keep as eventId for backward compatibility
          };
          state.isLoading = false;
        });

        return true;
      } catch (error) {
        logger.error('Failed to create booking hold:', error);
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to place payment hold';
          state.isLoading = false;
        });
        return false;
      }
    },

    captureBookingHold: async (bookingId: string, amount?: number, reason?: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const captured = await StripeService.captureBookingHold(
          bookingId,
          amount,
          reason
        );
        
        set((state) => {
          state.isLoading = false;
          state.currentPaymentIntent = null;
        });

        return captured;
      } catch (error) {
        logger.error('Failed to capture booking hold:', error);
        set((state) => {
          state.error = 'Failed to charge payment';
          state.isLoading = false;
        });
        return false;
      }
    },

    releaseBookingHold: async (bookingId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const released = await StripeService.releaseBookingHold(bookingId);
        
        set((state) => {
          state.isLoading = false;
          state.currentPaymentIntent = null;
        });

        return released;
      } catch (error) {
        logger.error('Failed to release booking hold:', error);
        set((state) => {
          state.error = 'Failed to release payment hold';
          state.isLoading = false;
        });
        return false;
      }
    },

    clearPaymentData: async () => {
      await StripeService.clearPaymentData();
      
      set((state) => {
        Object.assign(state, initialState);
      });
    },

    setError: (error: string | null) => {
      set((state) => {
        state.error = error;
      });
    },

    clearError: () => {
      set((state) => {
        state.error = null;
      });
    },
  }))
);