import { PluginInterface } from '@rxdi/core';
import { Server } from 'hapi';
import { GRAPHQL_PLUGIN_CONFIG } from '@rxdi/graphql';
import { GRAPHQL_PUB_SUB_DI_CONFIG } from '../config.tokens';
export declare class SubscriptionService implements PluginInterface {
    private server;
    private config;
    private pubConfig;
    constructor(server: Server, config: GRAPHQL_PLUGIN_CONFIG, pubConfig: GRAPHQL_PUB_SUB_DI_CONFIG);
    OnInit(): void;
    register(): Promise<void>;
}
