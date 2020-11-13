import { InjectionToken } from '@rxdi/core';
import { AmqpPubSub } from '@rxdi/graphql-rabbitmq-subscriptions';
import { PubSub } from 'graphql-subscriptions';
import { Server } from 'http';
import { ServerOptions } from 'subscriptions-transport-ws';
export interface GRAPHQL_PUBSUB_SERVER_OPTIONS {
  server?: Server;
  path?: string; // '/subscriptions'
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: number; // 1024
      memLevel: number; // 7
      level: number; // 3
    },
    zlibInflateOptions: {
      chunkSize: number; // 10 * 1024
    },
    clientNoContextTakeover: boolean, // true
    serverNoContextTakeover: boolean, // true
    serverMaxWindowBits: number; // 10
    concurrencyLimit: number; // 10
    threshold: number; // 1024
  };
}
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
  subscriptionServerOptions?: GRAPHQL_PUBSUB_SERVER_OPTIONS;

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
