import { Request, Response, NextFunction } from 'express';

import { privyClient } from '../config/privy';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
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
export const verifyPrivyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Allow test mode for development
    const testUserId = req.headers['x-test-user-id'] as string;
    if (testUserId && process.env.NODE_ENV === 'development') {
      req.userId = testUserId;
      req.userEmail = 'test@example.com';
      next();
      return;
    }
    
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
      });
      return;
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

      // Store user info from JWT claims
      const claims = verifiedClaims as { userId: string; email?: string; walletAddress?: string };
      req.user = {
        id: claims.userId,
        email: claims.email,
        walletAddress: claims.walletAddress,
      };

      next();
    } catch (error: any) {
      logger.error('Token verification failed:', error);
      
      // Check for specific JWT errors
      if (error.code === 'ERR_JWT_EXPIRED' || error.name === 'JWTExpired') {
        res.status(401).json({
          success: false,
          error: 'Token has expired. Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
        return;
      }
      
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
    return;
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

      // Store user info from JWT claims
      const claims = verifiedClaims as { userId: string; email?: string; walletAddress?: string };
      req.user = {
        id: claims.userId,
        email: claims.email,
        walletAddress: claims.walletAddress,
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
