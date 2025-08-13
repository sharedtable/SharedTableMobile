import { authConfig, authMonitoring } from '../../supabase/client';

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: any) => void;
}

export class RetryService {
  /**
   * Retry a function with exponential backoff
   */
  static async withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const {
      maxAttempts = authConfig.maxRetryAttempts,
      delay = authConfig.retryDelay,
      backoffFactor = 2,
      onRetry,
    } = options;

    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts) {
          authMonitoring.logSecurityEvent('retry_exhausted', 'medium', {
            error: error instanceof Error ? error.message : String(error),
            attempts: maxAttempts,
          });
          throw error;
        }

        const retryDelay = delay * Math.pow(backoffFactor, attempt - 1);

        authMonitoring.logAuthEvent('retry_attempt', {
          attempt,
          error: error instanceof Error ? error.message : String(error),
          retryDelay,
        });

        onRetry?.(attempt, error);

        await this.sleep(retryDelay);
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: any): boolean {
    if (!error) return false;

    // Network errors are retryable
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      return true;
    }

    // Rate limiting errors are retryable
    if (error.status === 429 || error.message?.includes('rate limit')) {
      return true;
    }

    // Temporary server errors are retryable
    if (error.status >= 500 && error.status < 600) {
      return true;
    }

    // Timeout errors are retryable
    if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
      return true;
    }

    return false;
  }

  /**
   * Sleep for given milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        throw new Error('Circuit breaker is OPEN');
      } else {
        this.state = 'HALF_OPEN';
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      authMonitoring.logSecurityEvent('circuit_breaker_open', 'high', {
        failures: this.failures,
        threshold: this.threshold,
      });
    }
  }

  getState(): string {
    return this.state;
  }
}
