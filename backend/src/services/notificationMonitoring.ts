/**
 * Production-grade monitoring and metrics service for notifications
 * Tracks performance, errors, and system health
 */

import { logger } from '../utils/logger';

interface MetricEntry {
  timestamp: number;
  value: number;
  labels?: Record<string, string>;
}

interface NotificationMetrics {
  // Performance metrics
  responseTime: MetricEntry[];
  throughput: MetricEntry[];
  
  // Error metrics
  errors: MetricEntry[];
  circuitBreakerTrips: number;
  
  // Storage metrics
  dbOperations: {
    success: number;
    failures: number;
    averageLatency: number;
  };
  
  memoryFallbacks: number;
  cacheHitRatio: number;
  
  // User metrics
  activeUsers: Set<string>;
  notificationsSent: number;
  notificationsRead: number;
  
  // System health
  uptime: number;
  lastHealthCheck: number;
}

interface AlertRule {
  name: string;
  condition: (metrics: NotificationMetrics) => boolean;
  message: string;
  cooldown: number; // ms
  lastTriggered: number;
}

class NotificationMonitoringService {
  private metrics: NotificationMetrics;
  private alerts: AlertRule[];
  private startTime: number;
  
  // Retention settings
  private readonly maxMetricEntries = 1000;
  private readonly metricRetentionMs = 24 * 60 * 60 * 1000; // 24 hours
  private readonly cleanupIntervalMs = 60 * 60 * 1000; // 1 hour
  
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.startTime = Date.now();
    this.metrics = this.initializeMetrics();
    this.alerts = this.initializeAlerts();
    this.startCleanupTimer();
    
    logger.info('Notification monitoring service initialized');
  }

  private initializeMetrics(): NotificationMetrics {
    return {
      responseTime: [],
      throughput: [],
      errors: [],
      circuitBreakerTrips: 0,
      dbOperations: {
        success: 0,
        failures: 0,
        averageLatency: 0
      },
      memoryFallbacks: 0,
      cacheHitRatio: 0,
      activeUsers: new Set(),
      notificationsSent: 0,
      notificationsRead: 0,
      uptime: 0,
      lastHealthCheck: Date.now()
    };
  }

  private initializeAlerts(): AlertRule[] {
    return [
      {
        name: 'HighErrorRate',
        condition: (metrics) => {
          const recentErrors = metrics.errors.filter(e => 
            Date.now() - e.timestamp < 5 * 60 * 1000 // Last 5 minutes
          );
          return recentErrors.length > 10;
        },
        message: 'High error rate detected in notification system',
        cooldown: 10 * 60 * 1000, // 10 minutes
        lastTriggered: 0
      },
      {
        name: 'SlowResponseTime',
        condition: (metrics) => {
          const recentResponses = metrics.responseTime.filter(r => 
            Date.now() - r.timestamp < 5 * 60 * 1000
          );
          const avgResponseTime = recentResponses.length > 0 ? 
            recentResponses.reduce((sum, r) => sum + r.value, 0) / recentResponses.length : 0;
          return avgResponseTime > 2000; // > 2 seconds
        },
        message: 'Slow response times detected in notification system',
        cooldown: 15 * 60 * 1000, // 15 minutes
        lastTriggered: 0
      },
      {
        name: 'DatabaseFailures',
        condition: (metrics) => {
          const failureRate = metrics.dbOperations.failures / 
            (metrics.dbOperations.success + metrics.dbOperations.failures);
          return failureRate > 0.1; // > 10% failure rate
        },
        message: 'High database failure rate in notification system',
        cooldown: 5 * 60 * 1000, // 5 minutes
        lastTriggered: 0
      },
      {
        name: 'LowCacheHitRatio',
        condition: (metrics) => {
          return metrics.cacheHitRatio < 0.5; // < 50% cache hit ratio
        },
        message: 'Low cache hit ratio in notification system',
        cooldown: 30 * 60 * 1000, // 30 minutes
        lastTriggered: 0
      }
    ];
  }

  /**
   * Record response time metric
   */
  recordResponseTime(endpoint: string, duration: number, success: boolean): void {
    this.addMetricEntry(this.metrics.responseTime, duration, {
      endpoint,
      success: success.toString()
    });
    
    if (!success) {
      this.recordError(endpoint, 'Response time recorded for failed request');
    }
    
    this.checkAlerts();
  }

  /**
   * Record database operation
   */
  recordDatabaseOperation(operation: string, duration: number, success: boolean): void {
    if (success) {
      this.metrics.dbOperations.success++;
    } else {
      this.metrics.dbOperations.failures++;
    }
    
    // Update average latency
    const totalOps = this.metrics.dbOperations.success + this.metrics.dbOperations.failures;
    this.metrics.dbOperations.averageLatency = 
      ((this.metrics.dbOperations.averageLatency * (totalOps - 1)) + duration) / totalOps;
    
    logger.debug(`Database operation ${operation}: ${duration}ms (${success ? 'success' : 'failure'})`);
  }

  /**
   * Record error
   */
  recordError(source: string, message: string, severity: 'low' | 'medium' | 'high' = 'medium'): void {
    this.addMetricEntry(this.metrics.errors, 1, {
      source,
      message: message.substring(0, 100), // Limit message length
      severity
    });
    
    logger.error(`Notification error [${severity}] from ${source}: ${message}`);
    this.checkAlerts();
  }

  /**
   * Record circuit breaker trip
   */
  recordCircuitBreakerTrip(): void {
    this.metrics.circuitBreakerTrips++;
    logger.warn('Circuit breaker tripped in notification system');
  }

  /**
   * Record memory fallback usage
   */
  recordMemoryFallback(): void {
    this.metrics.memoryFallbacks++;
    logger.info('Notification system fell back to memory storage');
  }

  /**
   * Update cache hit ratio
   */
  updateCacheHitRatio(ratio: number): void {
    this.metrics.cacheHitRatio = ratio;
  }

  /**
   * Record user activity
   */
  recordUserActivity(userId: string): void {
    this.metrics.activeUsers.add(userId);
  }

  /**
   * Record notification sent
   */
  recordNotificationSent(): void {
    this.metrics.notificationsSent++;
  }

  /**
   * Record notification read
   */
  recordNotificationRead(): void {
    this.metrics.notificationsRead++;
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics(): NotificationMetrics {
    this.metrics.uptime = Date.now() - this.startTime;
    this.metrics.lastHealthCheck = Date.now();
    
    // Return a deep copy to prevent external modifications
    return {
      ...this.metrics,
      activeUsers: new Set(this.metrics.activeUsers),
      responseTime: [...this.metrics.responseTime],
      throughput: [...this.metrics.throughput],
      errors: [...this.metrics.errors]
    };
  }

  /**
   * Get metrics summary for dashboards
   */
  getMetricsSummary(timeRangeMs: number = 60 * 60 * 1000): any {
    const now = Date.now();
    const cutoff = now - timeRangeMs;
    
    // Filter recent metrics
    const recentResponseTimes = this.metrics.responseTime.filter(m => m.timestamp >= cutoff);
    const recentErrors = this.metrics.errors.filter(m => m.timestamp >= cutoff);
    
    // Calculate averages and rates
    const avgResponseTime = recentResponseTimes.length > 0 ? 
      recentResponseTimes.reduce((sum, m) => sum + m.value, 0) / recentResponseTimes.length : 0;
    
    const errorRate = recentErrors.length;
    const requestCount = recentResponseTimes.length;
    
    return {
      timeRange: {
        start: new Date(cutoff).toISOString(),
        end: new Date(now).toISOString(),
        durationMs: timeRangeMs
      },
      performance: {
        averageResponseTime: Math.round(avgResponseTime),
        requestCount,
        requestsPerMinute: Math.round((requestCount / timeRangeMs) * 60 * 1000),
        errorCount: errorRate,
        errorRate: requestCount > 0 ? Math.round((errorRate / requestCount) * 100) : 0
      },
      database: {
        successfulOperations: this.metrics.dbOperations.success,
        failedOperations: this.metrics.dbOperations.failures,
        averageLatency: Math.round(this.metrics.dbOperations.averageLatency),
        successRate: this.metrics.dbOperations.success + this.metrics.dbOperations.failures > 0 ?
          Math.round((this.metrics.dbOperations.success / 
          (this.metrics.dbOperations.success + this.metrics.dbOperations.failures)) * 100) : 100
      },
      cache: {
        hitRatio: Math.round(this.metrics.cacheHitRatio * 100),
        memoryFallbacks: this.metrics.memoryFallbacks
      },
      users: {
        activeUsers: this.metrics.activeUsers.size,
        notificationsSent: this.metrics.notificationsSent,
        notificationsRead: this.metrics.notificationsRead,
        readRate: this.metrics.notificationsSent > 0 ? 
          Math.round((this.metrics.notificationsRead / this.metrics.notificationsSent) * 100) : 0
      },
      system: {
        uptimeMs: this.metrics.uptime,
        uptimeHours: Math.round((this.metrics.uptime / (1000 * 60 * 60)) * 10) / 10,
        circuitBreakerTrips: this.metrics.circuitBreakerTrips,
        lastHealthCheck: new Date(this.metrics.lastHealthCheck).toISOString()
      }
    };
  }

  /**
   * Check alert conditions
   */
  private checkAlerts(): void {
    const now = Date.now();
    
    for (const alert of this.alerts) {
      // Check cooldown
      if (now - alert.lastTriggered < alert.cooldown) {
        continue;
      }
      
      // Check condition
      if (alert.condition(this.metrics)) {
        this.triggerAlert(alert);
        alert.lastTriggered = now;
      }
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(alert: AlertRule): void {
    logger.error(`🚨 ALERT: ${alert.name}`, {
      message: alert.message,
      metrics: this.getMetricsSummary(5 * 60 * 1000) // Last 5 minutes
    });
    
    // In production, you would integrate with alerting systems like:
    // - Slack/Discord webhooks
    // - PagerDuty
    // - Email notifications
    // - SMS alerts
  }

  /**
   * Add metric entry with cleanup
   */
  private addMetricEntry(collection: MetricEntry[], value: number, labels?: Record<string, string>): void {
    collection.push({
      timestamp: Date.now(),
      value,
      labels
    });
    
    // Keep only recent entries
    if (collection.length > this.maxMetricEntries) {
      collection.splice(0, collection.length - this.maxMetricEntries);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldMetrics();
    }, this.cleanupIntervalMs);
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.metricRetentionMs;
    
    const cleanup = (collection: MetricEntry[]) => {
      const originalLength = collection.length;
      const filtered = collection.filter(entry => entry.timestamp >= cutoff);
      collection.splice(0, collection.length, ...filtered);
      return originalLength - filtered.length;
    };
    
    const removedResponseTimes = cleanup(this.metrics.responseTime);
    const removedThroughput = cleanup(this.metrics.throughput);
    const removedErrors = cleanup(this.metrics.errors);
    
    const totalRemoved = removedResponseTimes + removedThroughput + removedErrors;
    
    if (totalRemoved > 0) {
      logger.debug(`Cleaned up ${totalRemoved} old metric entries`);
    }
    
    // Reset active users periodically to prevent memory leaks
    if (this.metrics.activeUsers.size > 10000) {
      this.metrics.activeUsers.clear();
      logger.info('Reset active users set to prevent memory leak');
    }
  }

  /**
   * Health check
   */
  isHealthy(): boolean {
    const now = Date.now();
    
    // Check if we've had too many errors recently
    const recentErrors = this.metrics.errors.filter(e => 
      now - e.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );
    
    if (recentErrors.length > 20) {
      return false;
    }
    
    // Check database failure rate
    const dbFailureRate = this.metrics.dbOperations.failures / 
      (this.metrics.dbOperations.success + this.metrics.dbOperations.failures || 1);
    
    if (dbFailureRate > 0.5) { // > 50% failure rate
      return false;
    }
    
    return true;
  }

  /**
   * Shutdown monitoring service
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    logger.info('Notification monitoring service shutdown', {
      finalMetrics: this.getMetricsSummary()
    });
  }
}

export const notificationMonitoring = new NotificationMonitoringService();

// Export middleware for automatic request tracking
export const trackingMiddleware = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  
  // Track user activity
  if (req.userId) {
    notificationMonitoring.recordUserActivity(req.userId);
  }
  
  // Track response
  const originalSend = res.send;
  res.send = function(data: any) {
    const duration = Date.now() - startTime;
    const success = res.statusCode < 400;
    
    notificationMonitoring.recordResponseTime(
      `${req.method} ${req.route?.path || req.path}`,
      duration,
      success
    );
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Graceful shutdown
process.on('SIGTERM', () => {
  notificationMonitoring.shutdown();
});

process.on('SIGINT', () => {
  notificationMonitoring.shutdown();
});