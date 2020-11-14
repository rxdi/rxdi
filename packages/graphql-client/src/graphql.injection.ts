import { InjectionToken } from '@rxdi/core';
import { ApolloClient as AC, ApolloClientOptions } from 'apollo-client';
import { NormalizedCacheObject, InMemoryCache } from 'apollo-cache-inmemory';
import { RequestHandler } from 'apollo-link';

export const ApolloClient = new InjectionToken<AC<NormalizedCacheObject>>(
  'apollo-link'
);
export interface ApolloClient extends AC<NormalizedCacheObject> {}

export const GraphqlDocuments = 'graphql-documents';

export interface GraphqlModuleConfig {
  uri: string;
  pubsub: string;
  onRequest?(): Promise<Headers>;
  cache?: InMemoryCache;
  apolloRequestHandler?: RequestHandler;
  cancelPendingRequests?: boolean;
  apolloClientOptions?: ApolloClientOptions<unknown>;
}
export const noopHeaders = () => new Headers();
export const noop = () => null;

export interface Definintion {
  kind: string;
  operation?: string;
};