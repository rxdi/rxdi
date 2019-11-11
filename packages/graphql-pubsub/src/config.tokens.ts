import { InjectionToken } from '@rxdi/core';
import { AmqpPubSub } from '@rxdi/graphql-rabbitmq-subscriptions';
import { PubSub } from 'graphql-subscriptions';
import { ServerOptions } from 'subscriptions-transport-ws';

export class GRAPHQL_PUB_SUB_DI_CONFIG {
  pubsub?: AmqpPubSub | PubSub | any;
  remotePubsub?: boolean;
  host?: string;
  query?: string;
  port?: string | number;
  authentication?: string;
  log?: boolean;
  activateRabbitMQ?: boolean;
  logger?: any;
}

export interface PubSubOptions extends ServerOptions {
  onSubConnection(): void;
  onSubOperation(): void;
  onSubDisconnect(): void;
  onSubOperationComplete(): void;
}
export const GRAPHQL_PUB_SUB_CONFIG = new InjectionToken<
  GRAPHQL_PUB_SUB_DI_CONFIG
>('graphql-pub-sub-config-injection-token');
