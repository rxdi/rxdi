import { GraphQLClient } from 'graphql-request';
import { GRAPHQL_PUB_SUB_DI_CONFIG } from '../config.tokens';
import { PubSub } from 'graphql-subscriptions';
export declare class RemotePubsub extends PubSub {
    config: GRAPHQL_PUB_SUB_DI_CONFIG;
    client: GraphQLClient;
    defaultQuery: string;
    constructor(config: GRAPHQL_PUB_SUB_DI_CONFIG);
    notifier(signal?: string, payload?: Object): Promise<any>;
    publish(signal: string, data: any): Promise<void>;
}
