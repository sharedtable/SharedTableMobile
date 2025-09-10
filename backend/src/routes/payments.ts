import express, { Response } from 'express';
import { verifyPrivyToken, AuthRequest } from '../middleware/auth';
import { supabaseService } from '../config/supabase';
import StripeService from '../services/stripe';
import { logger } from '../utils/logger';

const router = express.Router();

router.post('/setup-intent', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id, email, stripe_customer_id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      logger.error('User not found:', { privyUserId, error: userError });
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    let stripeCustomerId = userData.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await StripeService.createOrUpdateCustomer(
        userData.id,
        userData.email,
        {
          privy_user_id: privyUserId,
        }
      );

      stripeCustomerId = customer.id;

      await supabaseService
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userData.id);
    }

    const setupIntent = await StripeService.createSetupIntent(stripeCustomerId);

    return res.json({
      success: true,
      data: {
        setupIntentId: setupIntent.id,
        clientSecret: setupIntent.client_secret,
        customerId: stripeCustomerId,
      },
    });
  } catch (error) {
    logger.error('Error creating setup intent:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize payment setup',
    });
  }
});

router.post('/ephemeral-key', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id, email, stripe_customer_id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (!userData.stripe_customer_id) {
      const customer = await StripeService.createOrUpdateCustomer(
        userData.id,
        userData.email,
        {
          privy_user_id: privyUserId,
        }
      );

      await supabaseService
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userData.id);

      userData.stripe_customer_id = customer.id;
    }

    const ephemeralKey = await StripeService.createEphemeralKey(userData.stripe_customer_id);

    return res.json({
      success: true,
      data: {
        ephemeralKey: ephemeralKey.secret,
        customerId: userData.stripe_customer_id,
      },
    });
  } catch (error) {
    logger.error('Error creating ephemeral key:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create ephemeral key',
    });
  }
});

router.get('/payment-methods', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('stripe_customer_id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData || !userData.stripe_customer_id) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const paymentMethods = await StripeService.listPaymentMethods(userData.stripe_customer_id);

    return res.json({
      success: true,
      data: paymentMethods,
    });
  } catch (error) {
    logger.error('Error listing payment methods:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve payment methods',
    });
  }
});

router.delete('/payment-methods/:paymentMethodId', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { paymentMethodId } = req.params;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('stripe_customer_id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData || !userData.stripe_customer_id) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const paymentMethods = await StripeService.listPaymentMethods(userData.stripe_customer_id);
    const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found',
      });
    }

    await StripeService.detachPaymentMethod(paymentMethodId);

    return res.json({
      success: true,
      message: 'Payment method removed successfully',
    });
  } catch (error) {
    logger.error('Error removing payment method:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to remove payment method',
    });
  }
});

// Unified booking endpoint with payment
router.post('/create-booking', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { 
      dinnerId, 
      paymentMethodId, 
      savePaymentMethod = false,
      dietaryRestrictions,
      preferences 
    } = req.body;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!dinnerId || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        error: 'Dinner ID and payment method are required',
      });
    }

    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id, email, stripe_customer_id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Ensure user has Stripe customer ID
    let stripeCustomerId = userData.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await StripeService.createOrUpdateCustomer(
        userData.id,
        userData.email,
        {
          privy_user_id: privyUserId,
        }
      );
      stripeCustomerId = customer.id;
      
      await supabaseService
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userData.id);
    }

    // Save payment method if requested
    if (savePaymentMethod) {
      try {
        // Check if payment method is already attached to prevent duplicates
        const existingMethods = await StripeService.listPaymentMethods(stripeCustomerId);
        const isAlreadyAttached = existingMethods.some(method => method.id === paymentMethodId);
        
        if (!isAlreadyAttached) {
          // Also check if there's a card with the same fingerprint (same actual card)
          const paymentMethod = await StripeService.getPaymentMethod(paymentMethodId);
          const hasSameCard = paymentMethod.card?.fingerprint && 
            existingMethods.some(method => 
              method.card && 
              (method.card as any).fingerprint === paymentMethod.card?.fingerprint
            );
          
          if (!hasSameCard) {
            await StripeService.attachPaymentMethod(paymentMethodId, stripeCustomerId);
            logger.info('Payment method attached successfully:', paymentMethodId);
          } else {
            logger.info('Card already exists with same fingerprint, skipping attachment');
          }
        } else {
          logger.info('Payment method already attached, skipping');
        }
      } catch (err) {
        logger.warn('Error handling payment method attachment:', err);
      }
    }

    // Check for existing booking
    const { data: existingBooking } = await supabaseService
      .from('dinner_bookings')
      .select('id')
      .eq('user_id', userData.id)
      .eq('dinner_id', dinnerId)
      .single();

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        error: 'You have already booked this dinner',
        code: 'DUPLICATE_BOOKING',
      });
    }

    // Get dinner details
    const { data: dinner, error: dinnerError } = await supabaseService
      .from('dinners')
      .select('*')
      .eq('id', dinnerId)
      .single();

    if (dinnerError || !dinner) {
      return res.status(404).json({
        success: false,
        error: 'Dinner not found',
      });
    }

    // Create payment intent with hold
    const holdAmount = 3000; // $30 USD
    const paymentIntent = await StripeService.createPaymentIntent({
      amount: holdAmount,
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      metadata: {
        user_id: userData.id,
        dinner_id: dinnerId,
        dinner_datetime: dinner.datetime,
        city: dinner.city,
        hold_type: 'booking_guarantee',
      },
      capture_method: 'manual',
    });

    // Payment intent is auto-confirmed when payment_method is provided

    // Create booking
    const { data: booking, error: bookingError } = await supabaseService
      .from('dinner_bookings')
      .insert({
        user_id: userData.id,
        dinner_id: dinnerId,
        status: 'confirmed',
        payment_intent_id: paymentIntent.id,
        payment_status: 'hold_placed',
        amount_paid_cents: 0,
        hold_amount_cents: holdAmount,
        dietary_restrictions: dietaryRestrictions,
        preferences: preferences,
        signed_up_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (bookingError) {
      await StripeService.cancelPaymentIntent(paymentIntent.id, 'abandoned');
      
      logger.error('Failed to create booking:', bookingError);
      return res.status(500).json({
        success: false,
        error: 'Failed to complete booking',
      });
    }

    // Update dinner signup count
    const { error: dinnerUpdateError } = await supabaseService
      .from('dinners')
      .update({
        current_signups: (dinner.current_signups || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dinnerId);

    if (dinnerUpdateError) {
      logger.error('Failed to update dinner signups:', dinnerUpdateError);
    }

    return res.json({
      success: true,
      data: {
        bookingId: booking.id,
        paymentIntentId: paymentIntent.id,
        holdAmount: holdAmount,
        message: 'Booking confirmed successfully',
      },
    });
  } catch (error) {
    logger.error('Error creating booking:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process booking',
    });
  }
});

// Legacy endpoint for backward compatibility
router.post('/booking-hold', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { dinnerId, paymentMethodId } = req.body;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!dinnerId || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        error: 'Dinner ID and payment method are required',
      });
    }

    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id, stripe_customer_id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const { data: dinner, error: dinnerError } = await supabaseService
      .from('dinners')
      .select('*')
      .eq('id', dinnerId)
      .single();

    if (dinnerError || !dinner) {
      return res.status(404).json({
        success: false,
        error: 'Dinner not found',
      });
    }

    const { data: existingBooking } = await supabaseService
      .from('dinner_bookings')
      .select('id, status')
      .eq('user_id', userData.id)
      .eq('dinner_id', dinnerId)
      .single();

    if (existingBooking) {
      logger.info(`User ${userData.id} already has booking for dinner ${dinnerId}`);
      return res.status(400).json({
        success: false,
        error: 'You have already booked this dinner. Please select a different dinner.',
        code: 'DUPLICATE_BOOKING',
      });
    }

    // Fixed hold amount of $30 USD for all bookings
    const holdAmount = 3000; // $30 USD in cents

    const paymentIntent = await StripeService.createPaymentIntent({
      amount: holdAmount,
      customerId: userData.stripe_customer_id,
      paymentMethodId,
      metadata: {
        user_id: userData.id,
        dinner_id: dinnerId,
        dinner_datetime: dinner.datetime,
        city: dinner.city,
        hold_type: 'booking_guarantee',
      },
      captureMethod: 'manual',
    });

    await StripeService.confirmPaymentIntent(
      paymentIntent.id,
      paymentMethodId
    );

    const { data: booking, error: bookingError } = await supabaseService
      .from('dinner_bookings')
      .insert({
        user_id: userData.id,
        dinner_id: dinnerId,
        status: 'confirmed',
        payment_intent_id: paymentIntent.id,
        payment_status: 'hold_placed',
        amount_paid_cents: 0,
        hold_amount_cents: holdAmount,
        signed_up_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (bookingError) {
      await StripeService.cancelPaymentIntent(paymentIntent.id, 'abandoned');
      
      logger.error('Failed to create booking:', bookingError);
      return res.status(500).json({
        success: false,
        error: 'Failed to complete booking',
      });
    }

    // Update dinner signup count
    const { error: dinnerUpdateError } = await supabaseService
      .from('dinners')
      .update({
        current_signups: (dinner.current_signups || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dinnerId);

    if (dinnerUpdateError) {
      logger.error('Failed to update dinner signups:', dinnerUpdateError);
    }

    return res.json({
      success: true,
      data: {
        bookingId: booking.id,
        paymentIntentId: paymentIntent.id,
        holdAmount: holdAmount,
        message: 'Booking confirmed with payment hold',
      },
    });
  } catch (error) {
    logger.error('Error creating booking hold:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process booking',
    });
  }
});

router.post('/create-booking', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { dinnerId, paymentMethodId, savePaymentMethod = false, dietaryRestrictions, preferences } = req.body;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!dinnerId || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        error: 'Dinner ID and payment method are required',
      });
    }

    // Get user data
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id, email, stripe_customer_id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if dinner exists and has availability
    const { data: dinner, error: dinnerError } = await supabaseService
      .from('dinners')
      .select('*')
      .eq('id', dinnerId)
      .single();

    if (dinnerError || !dinner) {
      return res.status(404).json({
        success: false,
        error: 'Dinner not found',
      });
    }

    if (dinner.current_signups >= dinner.max_signups) {
      return res.status(400).json({
        success: false,
        error: 'This dinner is fully booked',
      });
    }

    // Check for existing booking
    const { data: existingBooking } = await supabaseService
      .from('dinner_bookings')
      .select('id')
      .eq('user_id', userData.id)
      .eq('dinner_id', dinnerId)
      .eq('status', 'confirmed')
      .single();

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        error: 'You have already signed up for this dinner',
      });
    }

    // Create or get Stripe customer
    let stripeCustomerId = userData.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await StripeService.createOrUpdateCustomer(
        userData.id,
        userData.email,
        {
          privy_user_id: privyUserId,
        }
      );
      stripeCustomerId = customer.id;

      await supabaseService
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userData.id);
    }

    // Save payment method if requested
    if (savePaymentMethod) {
      await StripeService.attachPaymentMethod(paymentMethodId, stripeCustomerId);
      
      // Set as default payment method
      await StripeService.updateCustomer(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Save to database
      const paymentMethod = await StripeService.getPaymentMethod(paymentMethodId);
      await supabaseService
        .from('payment_methods')
        .upsert({
          id: paymentMethodId,
          user_id: userData.id,
          stripe_payment_method_id: paymentMethodId,
          type: paymentMethod.type,
          card_brand: paymentMethod.card?.brand,
          card_last4: paymentMethod.card?.last4,
          card_exp_month: paymentMethod.card?.exp_month,
          card_exp_year: paymentMethod.card?.exp_year,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      // Update other payment methods to not be default
      await supabaseService
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userData.id)
        .neq('id', paymentMethodId);
    }

    // Create payment intent with hold
    const holdAmount = 3000; // $30 USD in cents
    const paymentIntent = await StripeService.createPaymentIntent({
      amount: holdAmount,
      currency: 'usd',
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      capture_method: 'manual',
      metadata: {
        user_id: userData.id.toString(),
        dinner_id: dinnerId.toString(),
        type: 'dinner_booking_hold',
      },
    });

    // Confirm the payment intent
    const confirmedIntent = await StripeService.confirmPaymentIntent(paymentIntent.id);

    // Create booking record
    const { data: booking, error: bookingError } = await supabaseService
      .from('dinner_bookings')
      .insert({
        user_id: userData.id,
        dinner_id: dinnerId,
        status: 'confirmed',
        payment_intent_id: confirmedIntent.id,
        payment_status: 'hold_placed',
        hold_amount_cents: holdAmount,
        dietary_restrictions: dietaryRestrictions || null,
        preferences: preferences || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (bookingError || !booking) {
      // Cancel payment intent if booking fails
      await StripeService.cancelPaymentIntent(paymentIntent.id, 'requested_by_customer');
      logger.error('Failed to create booking:', bookingError);
      return res.status(500).json({
        success: false,
        error: 'Failed to complete booking',
      });
    }

    // Update dinner signup count
    const { error: dinnerUpdateError } = await supabaseService
      .from('dinners')
      .update({
        current_signups: (dinner.current_signups || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dinnerId);

    if (dinnerUpdateError) {
      logger.error('Failed to update dinner signups:', dinnerUpdateError);
    }

    return res.json({
      success: true,
      data: {
        booking,
        paymentIntent: {
          id: confirmedIntent.id,
          status: confirmedIntent.status,
          amount: confirmedIntent.amount,
        },
        message: 'Booking confirmed successfully',
      },
    });
  } catch (error) {
    logger.error('Error creating booking with payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process booking',
    });
  }
});

router.post('/capture-hold', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { bookingId, chargeAmount, reason } = req.body;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { data: userData } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const { data: booking, error: bookingError } = await supabaseService
      .from('dinner_bookings')
      .select('payment_intent_id, user_id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    if (booking.user_id !== userData.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this booking',
      });
    }

    const capturedIntent = await StripeService.capturePaymentIntent({
      paymentIntentId: booking.payment_intent_id,
      amount: chargeAmount,
    });

    await supabaseService
      .from('dinner_bookings')
      .update({
        payment_status: 'charged',
        amount_paid_cents: chargeAmount || capturedIntent.amount_captured,
        charge_reason: reason || 'no_show',
        charged_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    return res.json({
      success: true,
      data: {
        amountCharged: capturedIntent.amount_received,
        message: 'Payment captured successfully',
      },
    });
  } catch (error) {
    logger.error('Error capturing payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to capture payment',
    });
  }
});

router.post('/release-hold', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { bookingId } = req.body;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { data: userData } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const { data: booking, error: bookingError } = await supabaseService
      .from('dinner_bookings')
      .select('payment_intent_id, user_id, payment_status')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    if (booking.payment_status === 'charged') {
      return res.status(400).json({
        success: false,
        error: 'Payment has already been captured',
      });
    }

    await StripeService.cancelPaymentIntent(
      booking.payment_intent_id,
      'requested_by_customer'
    );

    await supabaseService
      .from('dinner_bookings')
      .update({
        payment_status: 'hold_released',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    return res.json({
      success: true,
      data: {
        message: 'Payment hold released successfully',
      },
    });
  } catch (error) {
    logger.error('Error releasing hold:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to release payment hold',
    });
  }
});

export default router;