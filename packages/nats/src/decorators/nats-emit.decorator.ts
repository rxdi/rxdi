import { Container } from '@rxdi/core';
import { NatsClientService } from '../services/nats-client.service';
import { NATS_LOGGER } from '../interfaces';
import { NatsLoggerService } from '../services/nats-logger.service';
import { ConsoleNatsLogger } from '../interfaces/nats-logger';

export interface NatsEmitOptions {
  channel: string;
  fireAndForget: boolean;
}

function getLogger(): NatsLoggerService {
  try {
    return Container.get(NATS_LOGGER) as NatsLoggerService;
  } catch {
    const logger = new ConsoleNatsLogger(false);
    return new NatsLoggerService(false, logger);
  }
}

export function NatsEmit(options: NatsEmitOptions): MethodDecorator {
  return function (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      const result = await originalMethod.apply(this, args);
      const emitData = result !== undefined ? result : args[0] || args[1] || args[2] || {};

      const natsClient = Container.get(NatsClientService);
      const logger = getLogger();

      if (!natsClient.isReady()) {
        if (options.fireAndForget) {
          logger.warn(`[NatsEmit] NATS not ready, skipping emit to ${options.channel}`);
          return result;
        }
        throw new Error('NATS client is not connected');
      }

      await natsClient.publish(options.channel, emitData);
      logger.debug(`[NatsEmit] Published to ${options.channel}:`, emitData);

      if (!options.fireAndForget) {
        return { success: true, channel: options.channel, data: result };
      }
      return result;
    };

    return descriptor;
  };
}

export function NatsEmitHandler(channel: string) {
  return NatsEmit({ channel, fireAndForget: true });
}