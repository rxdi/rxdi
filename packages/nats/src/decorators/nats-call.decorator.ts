import { Container } from '@rxdi/core';
import { NatsClientService } from '../services/nats-client.service';

export interface NatsCallOptions {
  channel: string;
  timeout?: number;
}

export function NatsCall(options: NatsCallOptions): MethodDecorator {
  return function (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const method = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      const natsClient = Container.get(NatsClientService);

      if (!natsClient.isReady()) {
        throw new Error('NATS client is not connected');
      }

      const requestData = args[0] || args[1] || args[2] || {};
      const response = await natsClient.request(options.channel, requestData, options.timeout || 30000);
      return response;
    };

    return descriptor;
  };
}

export function NatsCallHandler(channel: string, timeout?: number) {
  return NatsCall({ channel, timeout });
}