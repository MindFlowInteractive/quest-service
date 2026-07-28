import { Injectable, LoggerService } from '@nestjs/common';
import { createLogger, Logger } from 'winston';

import { loggerConfig } from './config/logger.config';

@Injectable()
export class LoggingService implements LoggerService {
  private readonly logger: Logger = createLogger(loggerConfig);

  log(message: unknown, context?: string): void {
    this.logger.info(message, { context });
  }

  error(
    message: unknown,
    trace?: string,
    context?: string,
  ): void {
    this.logger.error(message, {
      trace,
      context,
    });
  }

  warn(message: unknown, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: unknown, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(
    message: unknown,
    context?: string,
  ): void {
    this.logger.verbose(message, { context });
  }

  metric(
    name: string,
    value: number,
    metadata?: Record<string, unknown>,
  ) {
    this.logger.info({
      type: 'metric',
      name,
      value,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  audit(
    action: string,
    metadata?: Record<string, unknown>,
  ) {
    this.logger.info({
      type: 'audit',
      action,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  exception(
    error: Error,
    metadata?: Record<string, unknown>,
  ) {
    this.logger.error({
      type: 'exception',
      name: error.name,
      message: error.message,
      stack: error.stack,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  health() {
    return {
      logger: 'healthy',
      level: process.env.LOG_LEVEL ?? 'info',
      timestamp: new Date().toISOString(),
    };
  }
}