import { ModuleWithServices } from '@rxdi/core';
import { GRAPHQL_PLUGIN_CONFIG } from './config.tokens';
export declare class GraphQLModule {
    static forRoot(config: GRAPHQL_PLUGIN_CONFIG): ModuleWithServices;
}
export * from './decorators';
export * from './services';
export * from './config.tokens';
export * from './helpers/index';
export * from './test/index';
