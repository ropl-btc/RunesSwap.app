/**
 * Structured logging utility for consistent error handling and debugging
 * Replaces scattered console.error() calls with standardized logging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  component?: string;
}

class Logger {
  private minLevel: LogLevel;

  constructor() {
    // Set minimum log level based on environment
    if (process.env.NODE_ENV === 'test') {
      this.minLevel = LogLevel.ERROR; // Only errors in tests
    } else if (process.env.NODE_ENV === 'development') {
      this.minLevel = LogLevel.DEBUG; // Everything in dev
    } else {
      this.minLevel = LogLevel.WARN; // Warn and above in production
    }
  }

  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    component?: string,
  ): void {
    if (level < this.minLevel) return;
    // Extra guard: silence non-error logs during tests to keep Jest output clean
    if (process.env.NODE_ENV === 'test' && level < LogLevel.ERROR) return;

    const componentPrefix = component ? `[${component}]` : '';
    const formattedMessage = `${componentPrefix} ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, context || '');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, context || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, context || '');
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, context || '');
        break;
    }
  }

  debug(message: string, context?: LogContext, component?: string): void {
    this.log(LogLevel.DEBUG, message, context, component);
  }

  info(message: string, context?: LogContext, component?: string): void {
    this.log(LogLevel.INFO, message, context, component);
  }

  warn(message: string, context?: LogContext, component?: string): void {
    this.log(LogLevel.WARN, message, context, component);
  }

  error(message: string, context?: LogContext, component?: string): void {
    this.log(LogLevel.ERROR, message, context, component);
  }

  // Specialized methods for specific error types
  apiError(message: string, context?: LogContext): void {
    this.error(message, context, 'API');
  }

  dbError(message: string, context?: LogContext): void {
    this.error(message, context, 'DB');
  }

  fetchError(message: string, context?: LogContext): void {
    this.error(message, context, 'FETCH');
  }

  authError(message: string, context?: LogContext): void {
    this.error(message, context, 'AUTH');
  }

  validationError(message: string, context?: LogContext): void {
    this.error(message, context, 'VALIDATION');
  }
}

// Export singleton instance
export const logger = new Logger();

// Helper functions for common patterns
export const logFetchError = (url: string, error: unknown): void => {
  logger.fetchError(`Fetch Error for ${url}`, {
    error: error instanceof Error ? error.message : String(error),
    url,
  });
};

export const logApiError = (operation: string, error: unknown): void => {
  logger.apiError(`API Error in ${operation}`, {
    operation,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
};

export const logDbError = (operation: string, error: unknown): void => {
  logger.dbError(`Database Error in ${operation}`, {
    operation,
    error: error instanceof Error ? error.message : String(error),
  });
};

// For backward compatibility, export as default
export default logger;
