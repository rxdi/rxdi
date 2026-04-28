import { Injectable } from '@rxdi/core';
import { NatsLogger, NatsLogLevel } from '../interfaces/nats-logger';

@Injectable()
export class NatsLoggerService {
  private logger: NatsLogger;
  private enabled: boolean;

  constructor(enabled: boolean = false, logger?: NatsLogger) {
    this.enabled = enabled;
    this.logger = logger || {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    };
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  debug(message: string, ...args: any[]): void {
    if (this.enabled) {
      this.logger.debug(message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.enabled) {
      this.logger.info(message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.enabled) {
      this.logger.warn(message, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.enabled) {
      this.logger.error(message, ...args);
    }
  }
}