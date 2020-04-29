import { ModuleWithServices } from '@rxdi/core';
import { GRAPHQL_PUB_SUB_DI_CONFIG } from './config.tokens';
export declare class GraphQLPubSubModule {
    static forRoot(config?: GRAPHQL_PUB_SUB_DI_CONFIG): ModuleWithServices;
}
export * from './config.tokens';
export * from './decorators/index';
export * from './services/index';
export * from './helpers/index';
