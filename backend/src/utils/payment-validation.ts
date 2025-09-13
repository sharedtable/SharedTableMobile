import { z } from 'zod';
import { logger } from './logger';

/**
 * Production-grade payment validation utilities
 */

// Stripe payment method ID format
const stripePaymentMethodIdSchema = z.string().regex(/^pm_[a-zA-Z0-9]{24,}$/);

// Stripe customer ID format
const _stripeCustomerIdSchema = z.string().regex(/^cus_[a-zA-Z0-9]{14,}$/);

// Stripe payment intent ID format  
const _stripePaymentIntentIdSchema = z.string().regex(/^pi_[a-zA-Z0-9]{24,}$/);

// Amount validation (in cents)
const amountSchema = z.number()
  .int()
  .positive()
  .max(99999999); // Max $999,999.99

// Event booking validation
export const bookingHoldSchema = z.object({
  eventId: z.string().uuid(),
  paymentMethodId: stripePaymentMethodIdSchema,
  metadata: z.object({
    user_id: z.string(),
    user_email: z.string().email().optional(),
    event_title: z.string().optional(),
    booking_source: z.enum(['mobile_app', 'web', 'admin']).optional(),
  }).optional(),
});

// Capture hold validation
export const captureHoldSchema = z.object({
  bookingId: z.string().uuid(),
  chargeAmount: amountSchema.optional(),
  reason: z.enum(['no_show', 'late_cancellation', 'policy_violation', 'other']).optional(),
  adminNote: z.string().max(500).optional(),
});

// Release hold validation
export const releaseHoldSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.enum(['attended', 'cancelled_on_time', 'event_cancelled', 'error']).optional(),
});

// Refund validation
export const refundSchema = z.object({
  bookingId: z.string().uuid(),
  amount: amountSchema.optional(),
  reason: z.enum(['requested_by_customer', 'duplicate', 'fraudulent', 'other']),
  description: z.string().max(500).optional(),
});

/**
 * Validate payment amount against business rules
 */
export function validateHoldAmount(eventPrice: number, holdAmount: number): boolean {
  // Hold should be between 100% and 150% of event price
  const minHold = eventPrice;
  const maxHold = Math.round(eventPrice * 1.5);
  
  if (holdAmount < minHold || holdAmount > maxHold) {
    logger.warn('Invalid hold amount', {
      eventPrice,
      holdAmount,
      minHold,
      maxHold,
    });
    return false;
  }
  
  return true;
}

/**
 * Validate cancellation window for charging
 */
export function canChargeForCancellation(eventDate: Date, cancellationDate: Date = new Date()): boolean {
  const hoursUntilEvent = (eventDate.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60);
  
  // Can charge if cancellation is within 24 hours of event
  return hoursUntilEvent <= 24;
}

/**
 * Calculate charge amount based on cancellation policy
 */
export function calculateCancellationCharge(
  eventPrice: number,
  hoursUntilEvent: number
): number {
  if (hoursUntilEvent <= 0) {
    // No-show: charge 100%
    return eventPrice;
  } else if (hoursUntilEvent <= 6) {
    // Less than 6 hours: charge 100%
    return eventPrice;
  } else if (hoursUntilEvent <= 12) {
    // 6-12 hours: charge 75%
    return Math.round(eventPrice * 0.75);
  } else if (hoursUntilEvent <= 24) {
    // 12-24 hours: charge 50%
    return Math.round(eventPrice * 0.5);
  } else {
    // More than 24 hours: no charge
    return 0;
  }
}

/**
 * Validate Stripe webhook event
 */
export function isValidWebhookEvent(event: any): boolean {
  if (!event || !event.type || !event.id || !event.data?.object) {
    return false;
  }
  
  // Check event ID format
  if (!/^evt_[a-zA-Z0-9]{24,}$/.test(event.id)) {
    return false;
  }
  
  // Validate known event types
  const validEventTypes = [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'payment_intent.canceled',
    'payment_intent.requires_action',
    'charge.succeeded',
    'charge.failed',
    'charge.refunded',
    'payment_method.attached',
    'payment_method.detached',
    'customer.created',
    'customer.updated',
    'customer.deleted',
  ];
  
  return validEventTypes.includes(event.type);
}

/**
 * Sanitize payment metadata for logging
 */
export function sanitizePaymentData(data: any): any {
  const sanitized = { ...data };
  
  // Remove sensitive fields
  const sensitiveFields = [
    'card_number',
    'cvv',
    'cvc',
    'client_secret',
    'secret',
    'password',
    'token',
    'api_key',
  ];
  
  function removeSensitive(obj: any, depth = 0): any {
    if (depth > 10) return obj; // Prevent infinite recursion
    
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    const cleaned = Array.isArray(obj) ? [...obj] : { ...obj };
    
    for (const key in cleaned) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        cleaned[key] = '[REDACTED]';
      } else if (typeof cleaned[key] === 'object') {
        cleaned[key] = removeSensitive(cleaned[key], depth + 1);
      }
    }
    
    return cleaned;
  }
  
  return removeSensitive(sanitized);
}

/**
 * Rate limit check for payment operations
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkPaymentRateLimit(
  userId: string,
  operation: 'create_hold' | 'capture' | 'refund',
  maxAttempts = 5,
  windowMs = 60000 // 1 minute
): boolean {
  const key = `${userId}:${operation}`;
  const now = Date.now();
  
  const limit = rateLimitMap.get(key);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }
  
  if (limit.count >= maxAttempts) {
    logger.warn('Payment rate limit exceeded', {
      userId,
      operation,
      attempts: limit.count,
    });
    return false;
  }
  
  limit.count++;
  return true;
}

/**
 * Validate idempotency key format
 */
export function validateIdempotencyKey(key: string): boolean {
  // Should be UUID or similar unique identifier
  return /^[a-zA-Z0-9\-_]{16,64}$/.test(key);
}

/**
 * Business rule: Check if user can make a booking
 */
export async function canUserMakeBooking(
  userId: string,
  _maxActiveBookings = 5
): Promise<{ allowed: boolean; reason?: string }> {
  // This would normally check the database for:
  // 1. User's current active bookings count
  // 2. User's payment history (any defaults?)
  // 3. User's verification status
  // 4. Any temporary bans or restrictions
  
  // Placeholder implementation
  return { allowed: true };
}

/**
 * Validate refund eligibility
 */
export function isEligibleForRefund(
  bookingDate: Date,
  chargeDate: Date,
  refundRequestDate: Date = new Date()
): { eligible: boolean; reason?: string } {
  const daysSinceCharge = (refundRequestDate.getTime() - chargeDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // Refund window: 30 days from charge
  if (daysSinceCharge > 30) {
    return {
      eligible: false,
      reason: 'Refund window has expired (30 days)',
    };
  }
  
  // Event must be in the past
  if (bookingDate.getTime() > refundRequestDate.getTime()) {
    return {
      eligible: false,
      reason: 'Cannot refund before event date',
    };
  }
  
  return { eligible: true };
}