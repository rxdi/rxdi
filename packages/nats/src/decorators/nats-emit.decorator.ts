import { Container } from '@rxdi/core';
import { NatsClientService } from '../services/nats-client.service';

export interface NatsEmitOptions {
  channel: string;
  fireAndForget: boolean;
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

      if (!natsClient.isReady()) {
        if (options.fireAndForget) {
          return result;
        }
        throw new Error('NATS client is not connected');
      }

      await natsClient.publish(options.channel, emitData);

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