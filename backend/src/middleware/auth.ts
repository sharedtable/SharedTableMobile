import { Request, Response, NextFunction } from 'express';

import { privyClient } from '../config/privy';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email?: string;
    walletAddress?: string;
    [key: string]: unknown;
  };
}

/**
 * Middleware to verify Privy authentication token
 */
export const verifyPrivyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7);

    try {
      // Verify the token with Privy
      const verifiedClaims = await privyClient.verifyAuthToken(token);

      // Add user info to request
      req.userId = verifiedClaims.userId;

      // Log for debugging
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Token verified for user:', verifiedClaims.userId);
      }

      // Store just the essential user info
      req.user = {
        id: verifiedClaims.userId,
        email: undefined,
        walletAddress: undefined,
      };

      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
};

/**
 * Optional middleware - allows authenticated or anonymous requests
 */
export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const verifiedClaims = await privyClient.verifyAuthToken(token);
      req.userId = verifiedClaims.userId;

      // Store just the essential user info
      req.user = {
        id: verifiedClaims.userId,
        email: undefined,
        walletAddress: undefined,
      };
    } catch (error) {
      // Token is invalid, but we allow the request to continue
      logger.debug('Optional auth: Invalid token provided', error);
    }
  }

  next();
};

/**
 * API Key authentication for server-to-server calls
 */
export const verifyApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.API_SECRET_KEY;

  if (!expectedKey) {
    // API key not configured, skip this check
    return next();
  }

  if (apiKey !== expectedKey) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
    });
  }

  next();
};
