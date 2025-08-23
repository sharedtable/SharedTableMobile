/**
 * Centralized logging utility for production-grade logging
 * Controls log levels and formats for better debugging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

interface LoggerConfig {
  level: LogLevel;
  enableInProduction: boolean;
  groupSimilarLogs: boolean;
  maxLogLength: number;
}

const config: LoggerConfig = {
  level: __DEV__ ? 'info' : 'error', // Only errors in production
  enableInProduction: false,
  groupSimilarLogs: true,
  maxLogLength: 200,
};

const logLevels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

// Track recent logs to prevent spam
const recentLogs = new Map<string, { count: number; lastLogged: number }>();
const LOG_THROTTLE_MS = 1000; // Throttle identical logs to once per second

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (!__DEV__ && !config.enableInProduction) {
      return level === 'error'; // Only log errors in production
    }
    return logLevels[level] >= logLevels[config.level];
  }

  private formatMessage(message: string, data?: any): string {
    if (!data) return message;
    
    const dataStr = typeof data === 'object' 
      ? JSON.stringify(data, null, 2) 
      : String(data);
    
    // Truncate long messages
    if (dataStr.length > config.maxLogLength) {
      return `${message}: ${dataStr.substring(0, config.maxLogLength)}...`;
    }
    
    return `${message}: ${dataStr}`;
  }

  private shouldThrottle(key: string): boolean {
    if (!config.groupSimilarLogs) return false;

    const recent = recentLogs.get(key);
    const now = Date.now();

    if (recent && now - recent.lastLogged < LOG_THROTTLE_MS) {
      recent.count++;
      return true;
    }

    recentLogs.set(key, { count: 1, lastLogged: now });
    
    // Clean up old entries
    if (recentLogs.size > 100) {
      const oldestKey = recentLogs.keys().next().value;
      if (oldestKey) {
        recentLogs.delete(oldestKey);
      }
    }

    return false;
  }

  debug(message: string, data?: any): void {
    if (!this.shouldLog('debug')) return;
    if (this.shouldThrottle(message)) return;
    console.log(`🔍 [DEBUG] ${this.formatMessage(message, data)}`);
  }

  info(message: string, data?: any): void {
    if (!this.shouldLog('info')) return;
    if (this.shouldThrottle(message)) return;
    console.log(`ℹ️ [INFO] ${this.formatMessage(message, data)}`);
  }

  warn(message: string, data?: any): void {
    if (!this.shouldLog('warn')) return;
    if (this.shouldThrottle(message)) return;
    console.warn(`⚠️ [WARN] ${this.formatMessage(message, data)}`);
  }

  error(message: string, error?: any): void {
    if (!this.shouldLog('error')) return;
    
    const errorMessage = error?.message || error;
    const stack = error?.stack;
    
    console.error(`❌ [ERROR] ${message}`, errorMessage);
    if (__DEV__ && stack) {
      console.error('Stack trace:', stack);
    }
  }

  // Group related logs
  group(label: string): void {
    if (!__DEV__) return;
    // eslint-disable-next-line no-console
    console.group(`📁 ${label}`);
  }

  groupEnd(): void {
    if (!__DEV__) return;
    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  // Timing utilities
  time(label: string): void {
    if (!this.shouldLog('debug')) return;
    // eslint-disable-next-line no-console
    console.time(`⏱️ ${label}`);
  }

  timeEnd(label: string): void {
    if (!this.shouldLog('debug')) return;
    // eslint-disable-next-line no-console
    console.timeEnd(`⏱️ ${label}`);
  }

  // Table for structured data
  table(data: any): void {
    if (!this.shouldLog('debug')) return;
    // eslint-disable-next-line no-console
    console.table(data);
  }

  // Clean up console for production
  static cleanupConsole(): void {
    if (!__DEV__) {
      // eslint-disable-next-line no-console
      console.log = () => {};
      // eslint-disable-next-line no-console
      console.debug = () => {};
      // eslint-disable-next-line no-console
      console.info = () => {};
      console.warn = () => {};
      // Keep console.error for critical issues
    }
  }
}

// Create singleton instance
export const logger = new Logger();

// Export utility to set log level
export const setLogLevel = (level: LogLevel): void => {
  config.level = level;
};

// Export utility to enable/disable production logging
export const enableProductionLogging = (enable: boolean): void => {
  config.enableInProduction = enable;
};

// Clean up console in production
if (!__DEV__) {
  Logger.cleanupConsole();
}