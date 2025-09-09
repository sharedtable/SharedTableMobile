import Stripe from 'stripe';
import { logger } from '../utils/logger';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

export interface CreatePaymentIntentParams {
  amount: number; 
  currency?: string;
  customerId?: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
  captureMethod?: 'automatic' | 'manual';
}

export interface PaymentMethodDetails {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  customer: string | null;
}

export interface ChargeHoldParams {
  paymentIntentId: string;
  amount?: number; 
}

export interface RefundParams {
  paymentIntentId: string;
  amount?: number; 
  reason?: string;
}

export class StripeService {
  
  static async createOrUpdateCustomer(
    userId: string,
    email: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Customer> {
    try {
      const customers = await stripe.customers.list({
        email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        return await stripe.customers.update(customers.data[0].id, {
          metadata: {
            user_id: userId,
            ...metadata,
          },
        });
      }

      return await stripe.customers.create({
        email,
        metadata: {
          user_id: userId,
          ...metadata,
        },
      });
    } catch (error) {
      logger.error('Failed to create/update Stripe customer:', error);
      throw new Error('Failed to create payment customer');
    }
  }

  static async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      return paymentMethod;
    } catch (error) {
      logger.error('Failed to attach payment method:', error);
      throw new Error('Failed to attach payment method');
    }
  }

  static async getPaymentMethod(
    paymentMethodId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      return paymentMethod;
    } catch (error) {
      logger.error('Failed to retrieve payment method:', error);
      throw new Error('Failed to retrieve payment method');
    }
  }

  static async updateCustomer(
    customerId: string,
    updates: Stripe.CustomerUpdateParams
  ): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.update(customerId, updates);
      return customer;
    } catch (error) {
      logger.error('Failed to update customer:', error);
      throw new Error('Failed to update customer');
    }
  }

  static async createPaymentIntent({
    amount,
    currency = 'usd',
    customer,
    payment_method,
    metadata = {},
    capture_method = 'manual', 
  }: {
    amount: number;
    currency?: string;
    customer?: string;
    payment_method?: string;
    metadata?: Record<string, string>;
    capture_method?: 'automatic' | 'manual';
  }): Promise<Stripe.PaymentIntent> {
    try {
      const params: Stripe.PaymentIntentCreateParams = {
        amount,
        currency,
        capture_method,
        metadata,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      };

      if (customer) {
        params.customer = customer;
      }

      if (payment_method) {
        params.payment_method = payment_method;
        params.confirm = true; // Auto-confirm when payment method is provided
      }

      const paymentIntent = await stripe.paymentIntents.create(params);

      logger.info('Created payment intent:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to create payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  static async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const params: Stripe.PaymentIntentConfirmParams = {};
      
      if (paymentMethodId) {
        params.payment_method = paymentMethodId;
      }

      const paymentIntent = await stripe.paymentIntents.confirm(
        paymentIntentId,
        params
      );

      logger.info('Confirmed payment intent:', {
        id: paymentIntent.id,
        status: paymentIntent.status,
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to confirm payment intent:', error);
      throw new Error('Failed to confirm payment');
    }
  }

  static async capturePaymentIntent({
    paymentIntentId,
    amount,
  }: ChargeHoldParams): Promise<Stripe.PaymentIntent> {
    try {
      const params: Stripe.PaymentIntentCaptureParams = {};
      
      if (amount !== undefined) {
        params.amount_to_capture = amount;
      }

      const paymentIntent = await stripe.paymentIntents.capture(
        paymentIntentId,
        params
      );

      logger.info('Captured payment intent:', {
        id: paymentIntent.id,
        amount_captured: paymentIntent.amount_received,
        status: paymentIntent.status,
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to capture payment intent:', error);
      throw new Error('Failed to capture payment');
    }
  }

  static async cancelPaymentIntent(
    paymentIntentId: string,
    cancellationReason?: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId, {
        cancellation_reason: cancellationReason as Stripe.PaymentIntentCancelParams.CancellationReason,
      });

      logger.info('Cancelled payment intent:', {
        id: paymentIntent.id,
        status: paymentIntent.status,
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to cancel payment intent:', error);
      throw new Error('Failed to cancel payment hold');
    }
  }

  static async createRefund({
    paymentIntentId,
    amount,
    reason,
  }: RefundParams): Promise<Stripe.Refund> {
    try {
      const params: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        reason: reason as Stripe.RefundCreateParams.Reason,
      };

      if (amount !== undefined) {
        params.amount = amount;
      }

      const refund = await stripe.refunds.create(params);

      logger.info('Created refund:', {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
      });

      return refund;
    } catch (error) {
      logger.error('Failed to create refund:', error);
      throw new Error('Failed to process refund');
    }
  }

  static async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      logger.error('Failed to retrieve payment intent:', error);
      throw new Error('Failed to retrieve payment information');
    }
  }

  static async listPaymentMethods(customerId: string): Promise<PaymentMethodDetails[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data.map((pm) => ({
        id: pm.id,
        type: pm.type,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              expMonth: pm.card.exp_month,
              expYear: pm.card.exp_year,
            }
          : undefined,
        customer: pm.customer as string | null,
      }));
    } catch (error) {
      logger.error('Failed to list payment methods:', error);
      throw new Error('Failed to retrieve payment methods');
    }
  }

  static async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await stripe.paymentMethods.detach(paymentMethodId);
      logger.info('Detached payment method:', paymentMethodId);
    } catch (error) {
      logger.error('Failed to detach payment method:', error);
      throw new Error('Failed to remove payment method');
    }
  }

  static async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    try {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        usage: 'off_session',
      });

      logger.info('Created setup intent:', {
        id: setupIntent.id,
        status: setupIntent.status,
      });

      return setupIntent;
    } catch (error) {
      logger.error('Failed to create setup intent:', error);
      throw new Error('Failed to initialize card setup');
    }
  }

  static async confirmSetupIntent(
    setupIntentId: string,
    paymentMethodId: string
  ): Promise<Stripe.SetupIntent> {
    try {
      const setupIntent = await stripe.setupIntents.confirm(setupIntentId, {
        payment_method: paymentMethodId,
      });

      logger.info('Confirmed setup intent:', {
        id: setupIntent.id,
        status: setupIntent.status,
      });

      return setupIntent;
    } catch (error) {
      logger.error('Failed to confirm setup intent:', error);
      throw new Error('Failed to confirm card setup');
    }
  }

  static async constructWebhookEvent(
    body: string | Buffer,
    signature: string,
    webhookSecret: string
  ): Promise<Stripe.Event> {
    try {
      return stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      logger.error('Failed to construct webhook event:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  static async createEphemeralKey(customerId: string): Promise<Stripe.EphemeralKey> {
    try {
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customerId },
        { apiVersion: '2025-08-27.basil' }
      );

      return ephemeralKey;
    } catch (error) {
      logger.error('Failed to create ephemeral key:', error);
      throw new Error('Failed to create ephemeral key');
    }
  }
}

export default StripeService;