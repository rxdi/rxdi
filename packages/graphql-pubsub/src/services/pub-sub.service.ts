import { PubSub } from 'graphql-subscriptions';
import { AmqpPubSub } from '@rxdi/graphql-rabbitmq-subscriptions';
import { Service, Inject, Container } from '@rxdi/core';
import {
  GRAPHQL_PUB_SUB_CONFIG,
  GRAPHQL_PUB_SUB_DI_CONFIG,
  PubSubProtocol,
} from '../config.tokens';
import { PubSubLogger } from './logger.service';

export let pubsub: PubSub | AmqpPubSub | any;

@Service()
export class PubSubService {
  sub: AmqpPubSub & PubSub;;
  constructor(
    @Inject(GRAPHQL_PUB_SUB_CONFIG) private config: GRAPHQL_PUB_SUB_DI_CONFIG,
    private logger: PubSubLogger
  ) {
    if (this.config.pubsub) {
      this.sub = this.config.pubsub;
    } else if (this.config.protocol === PubSubProtocol.NATS) {
      this.sub = this.createNatsPubSub();
    } else if (this.config.activateRabbitMQ) {
      this.sub = new AmqpPubSub({
        config: `amqp://${
          this.config.user || process.env.AMQP_USER || 'guest'
        }:${this.config.pass || 'guest'}@${
          this.config.host || process.env.AMQP_HOST || 'localhost'
        }:${this.config.port || process.env.AMQP_PORT || '5672'}` as never,
        logger: this.config.logger || this.logger,
      }) as never;
    } else {
      this.sub = new PubSub() as never;
    }
  }

  private createNatsPubSub() {
    try {
      const { NatsClientService, NatsPubSub } = require('@rxdi/nats');
      const natsClient: any = Container.get(NatsClientService);
      if (natsClient?.isReady?.()) {
        return new NatsPubSub(natsClient);
      }
    } catch (e) {
      console.warn('NATS PubSub not available, falling back to default PubSub');
    }
    return new PubSub();
  }

  asyncIterator(event: any, options?: any): AsyncIterator<any> {
    return this.sub.asyncIterableIterator(event, options);
  }

  asyncIterableIterator(event: any, options?: any): AsyncIterator<any> {
    return this.sub.asyncIterableIterator(event, options);
  }

  publish(signal: string, data: any): Promise<void> {
    return this.sub.publish(signal, data);
  }
}