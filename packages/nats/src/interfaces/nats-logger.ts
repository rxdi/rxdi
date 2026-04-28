export enum NatsLogLevel {
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
}

export interface NatsLogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export class ConsoleNatsLogger implements NatsLogger {
  constructor(private enabled: boolean = false) {}

  debug(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.debug(`[NATS] [DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(`[NATS] [INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.warn(`[NATS] [WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.error(`[NATS] [ERROR] ${message}`, ...args);
    }
  }
}