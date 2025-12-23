import { Module, ModuleWithServices } from '@rxdi/core';
import { InMemoryCache } from '@apollo/client/cache';
import {
 ApolloClient,
 GraphqlDocuments,
 GraphqlModuleConfig,
 noopHeaders,
 Definintion,
} from './graphql.injection';
import {
 createHttpLink,
 ApolloClient as ApolloClientOriginal,
 concat,
 ApolloLink,
 split,
 Observable,
 from,
} from '@apollo/client/core';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/client/link/context';

import { createClient } from 'graphql-ws';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';

@Module({})
export class GraphqlModule {
 public static forRoot(
  {
   uri,
   pubsub,
   refreshOnUnauthenticated,
   onRequest,
   cache,
   apolloRequestHandler,
   cancelPendingRequests,
   apolloClientOptions,
  }: GraphqlModuleConfig = {} as GraphqlModuleConfig,
  documents = {},
 ): ModuleWithServices {
  const headers = {};
  const connections: { [key: string]: AbortController } = {};

  return {
   module: GraphqlModule,
   providers: [
    {
     provide: GraphqlDocuments,
     useValue: documents,
    },
    {
     provide: ApolloClient,
     useFactory: () =>
      new ApolloClientOriginal({
       link: concat(
        from([
         setContext(async (operation) => {
          const method = onRequest || noopHeaders;
          let headersMap: Headers = (await method.call(operation)) || {};
          headersMap.forEach((v, k) => {
           headers[k] = v;
          });
          return {
           headers,
          };
         }),
         new ApolloLink(
          typeof apolloRequestHandler === 'function'
           ? (apolloRequestHandler as never)
           : (operation, forward) => {
              /* Start cancel request */
              if (cancelPendingRequests) {
               return new Observable((observer: any) => {
                const context = operation.getContext();

                const connectionHandle = forward(operation).subscribe({
                 next: (...arg) => observer.next(...arg),
                 error: (...arg) => {
                  cleanUp();
                  observer.error(...arg);
                 },
                 complete: (...arg) => {
                  cleanUp();
                  observer.complete(...arg);
                 },
                });

                const cleanUp = () => {
                 connectionHandle?.unsubscribe();
                 delete connections[context.requestTrackerId];
                };

                if (context.requestTrackerId) {
                 const controller = new AbortController();
                 controller.signal.onabort = cleanUp;
                 operation.setContext({
                  ...context,
                  fetchOptions: {
                   signal: controller.signal,
                   ...context?.fetchOptions,
                  },
                 });

                 if (connections[context.requestTrackerId]) {
                  // If a controller exists, that means this operation should be aborted.
                  connections[context.requestTrackerId].abort();
                 }

                 connections[context.requestTrackerId] = controller;
                }

                return connectionHandle;
               });
              }
              /* End cancel request */
              return forward(operation);
             },
         ),
        ]),
        split(
         ({ query }) => {
          const { kind, operation }: Definintion = getMainDefinition(query);
          return kind === 'OperationDefinition' && operation === 'subscription';
         },
         (() => {
          const wsClient = createClient({
           url: pubsub,
           lazy: true,
           retryAttempts: Infinity,
           connectionParams: () => ({
            authorization: headers['authorization'],
           }),
           on: {
            closed: (event) => {
             if (event['code'] === 4401 && refreshOnUnauthenticated) {
              location.reload();
             }
            },
           },
          });

          return new GraphQLWsLink(wsClient);
         })(),
         createHttpLink({ uri }),
        ),
       ),
       cache: cache || new InMemoryCache(),
       ...apolloClientOptions,
      }),
    },
   ],
  };
 }
}

export * from './graphql.injection';
export * from './graphq.helpers';
export {
 GraphQLRequest,
 QueryOptions,
 SubscriptionOptions,
 MutationOptions,
 PossibleTypesMap,
} from '@apollo/client/core';
export { InMemoryCache } from '@apollo/client/cache';

export { DataProxy } from '@apollo/client/cache';
