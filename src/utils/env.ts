/**
 * Environment utilities for proper production vs development handling
 */

/**
 * Check if we're in development mode
 * This constant will be replaced by bundler in production builds
 */
export const __DEV__ = process.env.NODE_ENV !== 'production';

/**
 * Log only in development
 */
export const devLog = (...args: unknown[]): void => {
  if (__DEV__) {
    console.log(...args);
  }
};

/**
 * Warn only in development
 */
export const devWarn = (...args: unknown[]): void => {
  if (__DEV__) {
    console.warn(...args);
  }
};

/**
 * Error log (always logs but with stack trace only in dev)
 */
export const logError = (message: string, error: unknown): void => {
  if (__DEV__) {
    console.error(message, error);
  } else {
    // In production, log without exposing sensitive details
    console.error(message);
  }
};
