import { InjectionToken } from '@rxdi/core';
import { AmqpPubSub } from '@rxdi/graphql-rabbitmq-subscriptions';
import { PubSub } from 'graphql-subscriptions';
import { ServerOptions } from 'subscriptions-transport-ws';
export declare class GRAPHQL_PUB_SUB_DI_CONFIG {
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
export declare const GRAPHQL_PUB_SUB_CONFIG: InjectionToken<GRAPHQL_PUB_SUB_DI_CONFIG>;
