import { Module, ModuleWithServices } from '@rxdi/core';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { createHttpLink } from 'apollo-link-http';
import {
  ApolloClient,
  GraphqlDocuments,
  GraphqlModuleConfig,
  noopHeaders,
  Definintion
} from './graphql.injection';
import { ApolloClient as ApolloClientOriginal } from 'apollo-client';
import { concat, ApolloLink, split, Observable, from } from 'apollo-link';
import { WebSocketLink } from 'apollo-link-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { getMainDefinition } from 'apollo-utilities';
import { setContext } from 'apollo-link-context';

@Module({})
export class GraphqlModule {
  public static forRoot(
    { uri, pubsub, onRequest, cache }: GraphqlModuleConfig = {} as any,
    documents = {}
  ): ModuleWithServices {
    const headers = {};
    return {
      module: GraphqlModule,
      providers: [
        {
          provide: GraphqlDocuments,
          useValue: documents
        },
        {
          provide: ApolloClient,
          useFactory: () =>
            new ApolloClientOriginal({
              link: concat(
                from([
                  setContext(async operation => {
                    const method = onRequest || noopHeaders;
                    let headersMap: Headers =
                      (await method.call(operation)) || {};
                    headersMap.forEach((v, k) => {
                      headers[k] = v;
                    });
                    return {
                      headers
                    };
                  }),
                  new ApolloLink((operation, forward) => forward(operation))
                ]),
                split(
                  ({ query }) => {
                    const { kind, operation }: Definintion = getMainDefinition(query);
                    return (
                      kind === 'OperationDefinition' &&
                      operation === 'subscription'
                    );
                  },
                  new WebSocketLink(
                    new SubscriptionClient(pubsub, {
                      lazy: true,
                      connectionParams: headers,
                      reconnect: true
                    })
                  ),
                  createHttpLink({ uri })
                )
              ),
              cache: cache || new InMemoryCache()
            })
        }
      ]
    };
  }
}

export * from './graphql.injection';
export * from './graphq.helpers';
export {
  QueryOptions,
  SubscriptionOptions,
  MutationOptions
} from 'apollo-client';
export { IntrospectionFragmentMatcher, InMemoryCache } from 'apollo-cache-inmemory';

export { DataProxy } from 'apollo-cache';
