import { Container } from '@rxdi/core';
import { NatsClientService } from '../services/nats-client.service';
import { NatsListenerHost } from '../services/nats-listener.host';
import { NATS_LOGGER } from '../interfaces';
import { NatsLoggerService } from '../services/nats-logger.service';
import { ConsoleNatsLogger } from '../interfaces/nats-logger';

export interface NatsListenerOptions {
  channel: string;
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

export function NatsListener(options: NatsListenerOptions): MethodDecorator {
  return function (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const methodName = String(propertyKey);
    const classCtor = target.constructor;

    NatsListenerHost.registerListener(classCtor, methodName, options.channel, options.queueGroup);
    const logger = getLogger();
    logger.debug(`[@NatsListener] Registered: ${classCtor.name}.${methodName} on ${options.channel}${options.queueGroup ? ` (queue: ${options.queueGroup})` : ''}`);

    return descriptor;
  };
}