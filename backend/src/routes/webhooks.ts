import express, { Response } from 'express';
import { StripeWebhookRequest, verifyStripeWebhook, captureRawBody } from '../middleware/stripe-webhook';
import { supabaseService } from '../config/supabase';
import { logger } from '../utils/logger';
import StripeService from '../services/stripe';

const router = express.Router();

// Important: Use raw body parser for webhook endpoint
router.use('/stripe', express.raw({ type: 'application/json' }), captureRawBody);

/**
 * Stripe webhook handler
 * Processes payment events from Stripe
 */
router.post('/stripe', verifyStripeWebhook, async (req: StripeWebhookRequest, res: Response) => {
  const event = req.stripeEvent!;

  try {
    logger.info(`Processing Stripe webhook: ${event.type}`, {
      eventId: event.id,
      type: event.type,
    });

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as any);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as any);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as any);
        break;

      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object as any);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as any);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as any);
        break;

      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object as any);
        break;

      case 'customer.created':
        await handleCustomerCreated(event.data.object as any);
        break;

      default:
        logger.info(`Unhandled webhook type: ${event.type}`);
    }

    // Acknowledge receipt of the webhook
    res.json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
    });
  }
});

/**
 * Handle successful payment intent (hold placed)
 */
async function handlePaymentIntentSucceeded(paymentIntent: any) {
  const { id, metadata, amount, status } = paymentIntent;

  if (!metadata?.booking_id) {
    logger.warn('Payment intent succeeded without booking_id:', id);
    return;
  }

  try {
    // Update booking payment status
    await supabaseService
      .from('dinner_bookings')
      .update({
        payment_status: 'hold_placed',
        payment_intent_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('payment_intent_id', id);

    // Log transaction
    await supabaseService
      .from('payment_transactions')
      .insert({
        booking_id: metadata.booking_id,
        stripe_payment_intent_id: id,
        type: 'hold',
        amount_cents: amount,
        status: 'succeeded',
        stripe_response: paymentIntent,
      });

    logger.info(`Payment hold placed for booking ${metadata.booking_id}`);
  } catch (error) {
    logger.error('Failed to update booking for successful payment:', error);
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: any) {
  const { id, metadata, last_payment_error } = paymentIntent;

  if (!metadata?.booking_id) {
    return;
  }

  try {
    // Update booking status
    await supabaseService
      .from('dinner_bookings')
      .update({
        payment_status: 'failed',
        payment_error: last_payment_error?.message,
        updated_at: new Date().toISOString(),
      })
      .eq('payment_intent_id', id);

    // Notify user of payment failure
    await sendPaymentFailureNotification(metadata.user_id, metadata.booking_id);

    logger.error(`Payment failed for booking ${metadata.booking_id}:`, last_payment_error);
  } catch (error) {
    logger.error('Failed to handle payment failure:', error);
  }
}

/**
 * Handle canceled payment intent
 */
async function handlePaymentIntentCanceled(paymentIntent: any) {
  const { id, metadata } = paymentIntent;

  if (!metadata?.booking_id) {
    return;
  }

  try {
    await supabaseService
      .from('dinner_bookings')
      .update({
        payment_status: 'hold_released',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_intent_id', id);

    logger.info(`Payment hold released for booking ${metadata.booking_id}`);
  } catch (error) {
    logger.error('Failed to handle payment cancellation:', error);
  }
}

/**
 * Handle successful charge (capture)
 */
async function handleChargeSucceeded(charge: any) {
  const { payment_intent, amount, metadata } = charge;

  if (!metadata?.booking_id) {
    return;
  }

  try {
    await supabaseService
      .from('dinner_bookings')
      .update({
        payment_status: 'charged',
        amount_paid_cents: amount,
        charged_at: new Date().toISOString(),
      })
      .eq('payment_intent_id', payment_intent);

    // Log transaction
    await supabaseService
      .from('payment_transactions')
      .insert({
        booking_id: metadata.booking_id,
        stripe_payment_intent_id: payment_intent,
        type: 'capture',
        amount_cents: amount,
        status: 'succeeded',
        stripe_response: charge,
      });

    logger.info(`Charge succeeded for booking ${metadata.booking_id}: $${amount / 100}`);
  } catch (error) {
    logger.error('Failed to handle successful charge:', error);
  }
}

/**
 * Handle charge refund
 */
async function handleChargeRefunded(charge: any) {
  const { payment_intent, amount_refunded, metadata } = charge;

  if (!metadata?.booking_id || amount_refunded === 0) {
    return;
  }

  try {
    await supabaseService
      .from('dinner_bookings')
      .update({
        payment_status: 'refunded',
        refund_amount_cents: amount_refunded,
        refunded_at: new Date().toISOString(),
      })
      .eq('payment_intent_id', payment_intent);

    logger.info(`Refund processed for booking ${metadata.booking_id}: $${amount_refunded / 100}`);
  } catch (error) {
    logger.error('Failed to handle refund:', error);
  }
}

/**
 * Handle payment method attached
 */
async function handlePaymentMethodAttached(paymentMethod: any) {
  const { id, customer, card } = paymentMethod;

  if (!customer) {
    return;
  }

  try {
    // Find user by stripe customer ID
    const { data: user } = await supabaseService
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customer)
      .single();

    if (!user) {
      logger.warn(`No user found for customer ${customer}`);
      return;
    }

    // Store payment method details
    await supabaseService
      .from('payment_methods')
      .insert({
        user_id: user.id,
        stripe_payment_method_id: id,
        type: paymentMethod.type,
        card_brand: card?.brand,
        card_last4: card?.last4,
        card_exp_month: card?.exp_month,
        card_exp_year: card?.exp_year,
        is_default: false,
      });

    logger.info(`Payment method ${id} attached for user ${user.id}`);
  } catch (error) {
    logger.error('Failed to handle payment method attachment:', error);
  }
}

/**
 * Handle payment method detached
 */
async function handlePaymentMethodDetached(paymentMethod: any) {
  const { id } = paymentMethod;

  try {
    await supabaseService
      .from('payment_methods')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('stripe_payment_method_id', id);

    logger.info(`Payment method ${id} detached`);
  } catch (error) {
    logger.error('Failed to handle payment method detachment:', error);
  }
}

/**
 * Handle customer created
 */
async function handleCustomerCreated(customer: any) {
  const { id, email, metadata } = customer;

  if (!metadata?.user_id) {
    logger.warn('Customer created without user_id metadata:', id);
    return;
  }

  try {
    await supabaseService
      .from('users')
      .update({
        stripe_customer_id: id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', metadata.user_id);

    logger.info(`Stripe customer ${id} linked to user ${metadata.user_id}`);
  } catch (error) {
    logger.error('Failed to handle customer creation:', error);
  }
}

/**
 * Send payment failure notification
 */
async function sendPaymentFailureNotification(userId: string, bookingId: string) {
  // TODO: Implement push notification
  logger.info(`Would send payment failure notification to user ${userId} for booking ${bookingId}`);
}

export default router;