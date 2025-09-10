/**
 * Token Provider Service
 * Manages access to the current Privy authentication token
 */

class TokenProvider {
  private getTokenFunction: (() => Promise<string | null>) | null = null;
  private initializationPromise: Promise<void> | null = null;
  private initializationResolve: (() => void) | null = null;

  constructor() {
    // Create a promise that will resolve when the token getter is set
    this.initializationPromise = new Promise((resolve) => {
      this.initializationResolve = resolve;
    });
  }

  /**
   * Set the token getter function from the Privy hook
   */
  setTokenGetter(getter: () => Promise<string | null>) {
    this.getTokenFunction = getter;
    // Resolve the initialization promise if it exists
    if (this.initializationResolve) {
      this.initializationResolve();
      this.initializationResolve = null;
    }
    console.log('[TokenProvider] Token getter initialized');
  }

  /**
   * Wait for the token provider to be initialized
   */
  async waitForInitialization(timeout = 5000): Promise<boolean> {
    if (this.getTokenFunction) return true;
    
    try {
      await Promise.race([
        this.initializationPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout waiting for token provider')), timeout)
        )
      ]);
      return true;
    } catch (error) {
      console.warn('[TokenProvider] Initialization timeout:', error);
      return false;
    }
  }

  /**
   * Get a fresh access token
   */
  async getAccessToken(): Promise<string | null> {
    // Wait a bit for initialization if not ready
    if (!this.getTokenFunction) {
      const initialized = await this.waitForInitialization(2000);
      if (!initialized) {
        console.warn('[TokenProvider] Token getter not initialized after waiting');
        return null;
      }
    }

    if (!this.getTokenFunction) {
      console.warn('[TokenProvider] Token getter still not available');
      return null;
    }

    try {
      const token = await this.getTokenFunction();
      return token;
    } catch (error) {
      console.error('[TokenProvider] Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Clear the token getter (on logout)
   */
  clear() {
    this.getTokenFunction = null;
    // Reset the initialization promise for next login
    this.initializationPromise = new Promise((resolve) => {
      this.initializationResolve = resolve;
    });
  }

  /**
   * Check if the token provider is initialized
   */
  isInitialized(): boolean {
    return this.getTokenFunction !== null;
  }
}

export const tokenProvider = new TokenProvider();