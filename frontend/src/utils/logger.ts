/**
 * Frontend logging utility
 * Provides structured logging that can be sent to error tracking services
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  error?: Error;
  context?: Record<string, unknown>;
  timestamp: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private log(level: LogLevel, message: string, error?: Error, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      error,
      context,
      timestamp: new Date().toISOString(),
    };

    // Always log to console in development
    if (this.isDevelopment) {
      const consoleMethod = console[level] || console.log;
      if (error) {
        consoleMethod(message, error, context);
      } else {
        consoleMethod(message, context);
      }
    }

    // In production, send to error tracking service
    // TODO: Integrate with error tracking service (e.g., Sentry, LogRocket)
    if (!this.isDevelopment && level === 'error') {
      // Send error to tracking service
      this.sendToErrorTracking(entry);
    }
  }

  private sendToErrorTracking(_entry: LogEntry) {
    // Placeholder for error tracking integration
    // Example: Sentry.captureException(entry.error, { extra: entry.context });
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, undefined, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, undefined, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, undefined, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, error, context);
  }
}

export const logger = new Logger();

