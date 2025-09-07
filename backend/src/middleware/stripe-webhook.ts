import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { logger } from '../utils/logger';

export interface StripeWebhookRequest extends Request {
  rawBody?: string;
  stripeEvent?: Stripe.Event;
}

/**
 * Middleware to capture raw body for Stripe webhook signature verification
 */
export const captureRawBody = (req: Request, res: Response, next: NextFunction) => {
  let data = '';
  
  req.on('data', (chunk) => {
    data += chunk;
  });
  
  req.on('end', () => {
    (req as StripeWebhookRequest).rawBody = data;
    next();
  });
};

/**
 * Middleware to verify Stripe webhook signatures
 */
export const verifyStripeWebhook = (req: StripeWebhookRequest, res: Response, next: NextFunction) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    logger.error('Missing Stripe webhook signature or secret');
    return res.status(400).json({
      success: false,
      error: 'Invalid webhook configuration',
    });
  }

  if (!req.rawBody) {
    logger.error('No raw body available for webhook verification');
    return res.status(400).json({
      success: false,
      error: 'Invalid request body',
    });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    });

    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig as string,
      webhookSecret
    );

    req.stripeEvent = event;
    next();
  } catch (err) {
    logger.error('Webhook signature verification failed:', err);
    return res.status(400).json({
      success: false,
      error: 'Invalid webhook signature',
    });
  }
};