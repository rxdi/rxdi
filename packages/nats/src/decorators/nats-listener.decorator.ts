import { Container } from '@rxdi/core';
import { NatsClientService } from '../services/nats-client.service';
import { NatsListenerHost } from '../services/nats-listener.host';

export interface NatsListenerOptions {
  channel: string;
}

export function NatsListener(options: NatsListenerOptions): MethodDecorator {
  return function (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const methodName = String(propertyKey);
    const classCtor = target.constructor;

    NatsListenerHost.register(classCtor, methodName, options.channel);

    return descriptor;
  };
}