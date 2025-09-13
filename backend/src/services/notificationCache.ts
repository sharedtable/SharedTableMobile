/**
 * Production-grade caching service for notifications
 * Implements multi-level caching with TTL and memory limits
 */

import { logger } from '../utils/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  memoryUsage: number;
  itemCount: number;
}

class NotificationCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    memoryUsage: 0,
    itemCount: 0
  };
  
  // Configuration
  private readonly maxItems = 10000; // Maximum cache items
  private readonly maxMemoryMB = 50; // Maximum memory usage in MB
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private readonly cleanupInterval = 60 * 1000; // 1 minute cleanup
  
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.startCleanupTimer();
    logger.info('Notification cache service initialized');
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    
    return entry.data as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Check memory limits before adding
    if (this.cache.size >= this.maxItems) {
      this.evictLeastRecentlyUsed();
    }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccessed: Date.now()
    };
    
    this.cache.set(key, entry);
    this.updateMemoryUsage();
    this.stats.itemCount = this.cache.size;
  }

  /**
   * Get notifications list with caching
   */
  async getNotifications(
    userId: string, 
    limit: number = 50, 
    unreadOnly: boolean = false
  ): Promise<any[] | null> {
    const cacheKey = `notifications:${userId}:${limit}:${unreadOnly}`;
    return this.get(cacheKey);
  }

  /**
   * Set notifications list in cache
   */
  setNotifications(
    userId: string, 
    notifications: any[], 
    limit: number = 50, 
    unreadOnly: boolean = false,
    ttl: number = 2 * 60 * 1000 // 2 minutes for notifications list
  ): void {
    const cacheKey = `notifications:${userId}:${limit}:${unreadOnly}`;
    this.set(cacheKey, notifications, ttl);
  }

  /**
   * Get unread count with caching
   */
  async getUnreadCount(userId: string): Promise<number | null> {
    const cacheKey = `unread_count:${userId}`;
    return this.get(cacheKey);
  }

  /**
   * Set unread count in cache
   */
  setUnreadCount(userId: string, count: number, ttl: number = 30 * 1000): void { // 30 seconds for count
    const cacheKey = `unread_count:${userId}`;
    this.set(cacheKey, count, ttl);
  }

  /**
   * Get user data with caching
   */
  async getUserData(privyUserId: string): Promise<any | null> {
    const cacheKey = `user:${privyUserId}`;
    return this.get(cacheKey);
  }

  /**
   * Set user data in cache
   */
  setUserData(privyUserId: string, userData: any, ttl: number = 10 * 60 * 1000): void { // 10 minutes for user data
    const cacheKey = `user:${privyUserId}`;
    this.set(cacheKey, userData, ttl);
  }

  /**
   * Invalidate user-related cache entries
   */
  invalidateUserCache(userId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(userId)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.stats.evictions++;
    });
    
    this.updateMemoryUsage();
    this.stats.itemCount = this.cache.size;
    
    logger.debug(`Invalidated ${keysToDelete.length} cache entries for user ${userId}`);
  }

  /**
   * Invalidate notification-related cache entries for a user
   */
  invalidateNotificationCache(userId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith('notifications:') && key.includes(userId)) {
        keysToDelete.push(key);
      }
      if (key.startsWith('unread_count:') && key.includes(userId)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.stats.evictions++;
    });
    
    this.updateMemoryUsage();
    this.stats.itemCount = this.cache.size;
    
    logger.debug(`Invalidated ${keysToDelete.length} notification cache entries for user ${userId}`);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.evictions += size;
    this.stats.itemCount = 0;
    this.stats.memoryUsage = 0;
    logger.info(`Cleared ${size} cache entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache hit ratio
   */
  getHitRatio(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastRecentlyUsed(): void {
    let oldestTime = Date.now();
    let oldestKey = '';
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Update memory usage estimation
   */
  private updateMemoryUsage(): void {
    let memoryUsage = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      // Rough estimation: key size + JSON size
      memoryUsage += key.length * 2; // UTF-16 encoding
      memoryUsage += JSON.stringify(entry.data).length * 2;
      memoryUsage += 64; // Entry metadata overhead
    }
    
    this.stats.memoryUsage = memoryUsage;
    
    // Check memory limit
    const memoryMB = memoryUsage / (1024 * 1024);
    if (memoryMB > this.maxMemoryMB) {
      this.evictByMemoryPressure();
    }
  }

  /**
   * Evict entries when under memory pressure
   */
  private evictByMemoryPressure(): void {
    // Sort by last accessed time and evict oldest 25%
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    const evictCount = Math.floor(entries.length * 0.25);
    
    for (let i = 0; i < evictCount; i++) {
      const [key] = entries[i];
      this.cache.delete(key);
      this.stats.evictions++;
    }
    
    this.updateMemoryUsage();
    this.stats.itemCount = this.cache.size;
    
    logger.warn(`Evicted ${evictCount} entries due to memory pressure`);
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const beforeSize = this.cache.size;
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.stats.evictions++;
    });
    
    this.updateMemoryUsage();
    this.stats.itemCount = this.cache.size;
    
    if (expiredKeys.length > 0) {
      logger.debug(`Cleanup removed ${expiredKeys.length} expired entries (${beforeSize} -> ${this.cache.size})`);
    }
  }

  /**
   * Shutdown cache service
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
    logger.info('Notification cache service shutdown');
  }
}

export const notificationCache = new NotificationCacheService();

// Graceful shutdown
process.on('SIGTERM', () => {
  notificationCache.shutdown();
});

process.on('SIGINT', () => {
  notificationCache.shutdown();
});