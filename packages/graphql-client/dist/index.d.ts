import { ModuleWithServices } from '@rxdi/core';
import { GraphqlModuleConfig } from './graphql.injection';
export declare class GraphqlModule {
    static forRoot({ uri, pubsub, onRequest }?: GraphqlModuleConfig, documents?: {}): ModuleWithServices;
}
export * from './graphql.injection';
export * from './graphq.helpers';
export { QueryOptions, SubscriptionOptions, MutationOptions } from 'apollo-client';
export { DataProxy } from 'apollo-cache';
