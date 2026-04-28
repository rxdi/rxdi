import { Container } from '@rxdi/core';
import { NatsClientService } from '../services/nats-client.service';
import { NatsListenerHost } from '../services/nats-listener.host';
import { NATS_LOGGER, NatsLogger } from '../interfaces';
import { NatsLoggerService } from '../services/nats-logger.service';
import { ConsoleNatsLogger } from '../interfaces/nats-logger';

export interface NatsCallOptions {
  channel: string;
  timeout?: number;
  queueGroup?: string;
}

function getLogger(): NatsLoggerService {
  try {
    return Container.get(NATS_LOGGER) as NatsLoggerService;
  } catch {
    const logger = new ConsoleNatsLogger(false);
    return new NatsLoggerService(false, logger);
  }
}

export function NatsCall(options: NatsCallOptions): MethodDecorator {
  return function (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const methodName = String(propertyKey);
    const classCtor = target.constructor;

    NatsListenerHost.registerCall(classCtor, methodName, options.channel, options.timeout || 30000, options.queueGroup);
    const logger = getLogger();
    logger.debug(`[@NatsCall] Registered: ${classCtor.name}.${methodName} on ${options.channel}${options.queueGroup ? ` (queue: ${options.queueGroup})` : ''}`);

    return descriptor;
  };
}

export function NatsCallHandler(channel: string, timeout?: number, queueGroup?: string) {
  return NatsCall({ channel, timeout, queueGroup });
}