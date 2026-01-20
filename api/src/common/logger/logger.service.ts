import { Injectable, LoggerService } from '@nestjs/common';
import { WinstonLogger } from 'nest-winston';

/**
 * Custom logger service that wraps Winston logger
 * Usage: Inject LoggerService into your services and use it like NestJS Logger
 */
@Injectable()
export class AppLogger implements LoggerService {
  constructor(private readonly winston: WinstonLogger) {}

  log(message: string, context?: string) {
    this.winston.log(message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.winston.error(message, trace, context);
  }

  warn(message: string, context?: string) {
    this.winston.warn(message, context);
  }

  debug(message: string, context?: string) {
    if (this.winston.debug) {
      this.winston.debug(message, context);
    }
  }

  verbose(message: string, context?: string) {
    if (this.winston.verbose) {
      this.winston.verbose(message, context);
    }
  }
}
