import { Module, ModuleWithServices } from '@rxdi/core';
import { InMemoryCache } from '@apollo/client/cache';
import {
  ApolloClient,
  GraphqlDocuments,
  GraphqlModuleConfig,
  GraphqlSubscriptionClient,
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
import { WebSocketLink } from '@apollo/client/link/ws';
import { ManagedSubscriptionClient } from './subscription-client';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/client/link/context';

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
      httpOptions = {},
      pubsubOptions = {},
      onSubscriptionConnectionError,
    }: GraphqlModuleConfig = {} as GraphqlModuleConfig,
    documents = {},
  ): ModuleWithServices {
    const headers = {};
    const connections: { [key: string]: AbortController } = {};

    // One client for the WebSocket link AND the GraphqlSubscriptionClient
    // token, so what a consumer closes is what the link uses. `lazy: true`:
    // nothing connects until the first subscription, and a client the
    // consumer force-closed reconnects on the next one — with freshly
    // evaluated connectionParams.
    const subscriptionClient = new ManagedSubscriptionClient(pubsub, {
      lazy: true,
      connectionParams: () => ({
        get authorization() {
          return headers['authorization'];
        },
      }),
      connectionCallback: (error) => {
        // Also fires on every successful ack, with no error.
        if (!error) {
          return;
        }
        console.error('[Subscription]: ', error);
        // Legacy reload: the literal 'Unauthorized' only, exactly as before
        // (see GraphqlModuleConfig.refreshOnUnauthenticated).
        if (refreshOnUnauthenticated && error?.['message'] === 'Unauthorized') {
          location.reload();
          return;
        }
        // Deliberately NO close()/terminate() here: this fires before the
        // pending operations receive their errors, so stopping the client
        // now settles them with nothing (forced close) or reconnects
        // (non-forced). Stopping the reconnect loop is the consumer's call,
        // from the operation error it does see — see GraphqlSubscriptionClient.
        onSubscriptionConnectionError?.(error, subscriptionClient);
      },
      reconnect: true,
      ...pubsubOptions,
    });

    return {
      module: GraphqlModule,
      providers: [
        {
          provide: GraphqlSubscriptionClient,
          useValue: subscriptionClient,
        },
        {
          provide: GraphqlDocuments,
          useValue: Object.keys(documents).reduce((prev, doc) => ({
            ...prev, 
            [doc.split('/').pop()]: documents[doc]
          }), {}),
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
                  new WebSocketLink(subscriptionClient),
                  createHttpLink({ uri, ...httpOptions }),
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
export * from './subscription-client';
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
