import { InjectionToken } from '@rxdi/core';
import { ApolloClient as AC } from 'apollo-client';
import { NormalizedCacheObject } from 'apollo-cache-inmemory';
export declare const ApolloClient: InjectionToken<AC<NormalizedCacheObject>>;
export interface ApolloClient extends AC<NormalizedCacheObject> {
}
export declare const GraphqlDocuments = "graphql-documents";
export interface GraphqlModuleConfig {
    uri: string;
    pubsub: string;
    onRequest?(): Promise<Headers>;
}
export declare const noopHeaders: () => Headers;
export declare const noop: () => any;
