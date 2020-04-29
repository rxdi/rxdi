import { PubSub } from 'graphql-subscriptions';
import { AmqpPubSub } from '@rxdi/graphql-rabbitmq-subscriptions';
import { GRAPHQL_PUB_SUB_DI_CONFIG } from '../config.tokens';
import { PubSubLogger } from './logger.service';
export declare let pubsub: PubSub | AmqpPubSub;
export declare class PubSubService {
    private config;
    private logger;
    sub: AmqpPubSub | PubSub;
    constructor(config: GRAPHQL_PUB_SUB_DI_CONFIG, logger: PubSubLogger);
    asyncIterator<T>(event: any): AsyncIterator<T>;
    publish(signal: string, data: any): Promise<void>;
}
