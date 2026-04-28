import { Service } from '@rxdi/core';
import { Container } from '@rxdi/core';
import { NatsPubSub } from './nats-pubsub.class';
import { NatsPubSubInterface } from './interfaces';

@Service()
export class GraphQLNatsPubSubService implements NatsPubSubInterface {
  natsPubSub: NatsPubSub;

  constructor() {
    const natsClient = (global as any).NatsClientService || Container.get('NatsClientService');
    this.natsPubSub = new NatsPubSub(natsClient);
  }

  async publish(trigger: string, payload: any): Promise<void> {
    return this.natsPubSub.publish(trigger, payload);
  }

  async subscribe<T>(
    trigger: string,
    onMessage: (m: T) => Promise<void>
  ): Promise<number> {
    return this.natsPubSub.subscribe(trigger, onMessage);
  }

  async unsubscribe(subId: number): Promise<void> {
    return this.natsPubSub.unsubscribe(subId);
  }

  asyncIterator<T>(event: any): AsyncIterator<T> {
    return this.natsPubSub.asyncIterableIterator<T>(event);
  }

  asyncIterableIterator<T>(event: any): AsyncIterator<T> {
    return this.natsPubSub.asyncIterableIterator<T>(event);
  }

  publishSignal(signal: string, data: any): Promise<void> {
    return this.natsPubSub.publish(signal, data);
  }
}