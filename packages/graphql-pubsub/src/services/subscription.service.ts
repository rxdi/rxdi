import { Inject, Service, PluginInterface, Container } from '@rxdi/core';
import { ServerOptions, SubscriptionServer } from 'subscriptions-transport-ws';
import { subscribe } from 'graphql/subscription';
import { execute } from 'graphql/execution';
import { HAPI_SERVER } from '@rxdi/hapi';
import { Server } from '@hapi/hapi';
import { GRAPHQL_PLUGIN_CONFIG, GraphqlService } from '@rxdi/graphql';
import {
 GRAPHQL_PUB_SUB_CONFIG,
 GRAPHQL_PUB_SUB_DI_CONFIG,
 PubSubOptions,
} from '../config.tokens';
import { DocumentNode, GraphQLFieldResolver, GraphQLSchema } from 'graphql';

@Service()
export class SubscriptionService implements PluginInterface {
 private subscriptionServer: SubscriptionServer | null = null;

 constructor(
  @Inject(HAPI_SERVER) private server: Server,
  @Inject(GRAPHQL_PLUGIN_CONFIG) private config: GRAPHQL_PLUGIN_CONFIG,
  @Inject(GRAPHQL_PUB_SUB_CONFIG) private pubConfig: GRAPHQL_PUB_SUB_DI_CONFIG,
 ) {}

 OnInit() {
  this.register();
  // Forward-only coupling on graphql: ask GraphqlService to call us back
  // on schema reload so the WS server rebinds against the new schema.
  try {
   const graphqlService = Container.get(GraphqlService);
   graphqlService.addSchemaReloadHook((schema) => this.register(schema));
  } catch (e) {
   // GraphqlService unavailable in this container — unusual but not fatal.
  }
 }

 /**
  * Safe to call multiple times. On re-invocation, the previous SubscriptionServer
  * is closed and a new one is bound — this is what makes dynamic schema reloads
  * (e.g. Lambforge specialize) actually take effect for WS subscribers.
  */
 async register(schema?: GraphQLSchema) {
  if (schema) {
   this.config.graphqlOptions.schema = schema;
  }
  if (this.subscriptionServer) {
   this.subscriptionServer.close();
   this.subscriptionServer = null;
  }
  const config: ServerOptions = {
   execute: this.execute.bind(this),
   subscribe: this.subscribe.bind(this),
   schema: this.config.graphqlOptions.schema,
   onConnect(connectionParams) {
    return connectionParams;
   },
   onOperation: (connectionParams, params, webSocket) => {
    return params;
   },
  };
  if (this.pubConfig.authentication) {
   const auth: PubSubOptions = Container.get(this.pubConfig.authentication);
   Object.assign(config, auth);
   if (auth.onSubConnection) {
    config.onConnect = auth.onSubConnection.bind(auth);
   }
   if (auth.onSubOperation) {
    config.onOperation = auth.onSubOperation.bind(auth);
   }
   if (auth.onSubOperationComplete) {
    config.onOperationComplete = auth.onSubOperationComplete.bind(auth);
   }
   if (auth.onSubDisconnect) {
    config.onDisconnect = auth.onSubDisconnect.bind(auth);
   }
  }
  this.subscriptionServer = new SubscriptionServer(config, {
   server: this.server.listener,
   path: '/subscriptions',
   ...this.pubConfig.subscriptionServerOptions,
  });
 }

 /**
  * Cross compatability graphql v15 and v16 for subscriptions.
  * Schema is read from the live config reference so dynamic schema reloads
  * (e.g. Lambforge specialize, hot module registration) take effect for
  * subsequent operations on already-open WS connections.
  */
 private execute(
  _schema: GraphQLSchema,
  document: DocumentNode,
  rootValue?: any,
  contextValue?: any,
  variableValues?: {
   [key: string]: any;
  },
  operationName?: string,
  fieldResolver?: GraphQLFieldResolver<any, any>,
  subscribeFieldResolver?: GraphQLFieldResolver<any, any>,
 ) {
  return execute({
   schema: this.config.graphqlOptions.schema,
   document,
   rootValue,
   contextValue,
   variableValues,
   operationName,
   fieldResolver,
   subscribeFieldResolver,
  });
 }

 private subscribe(
  _schema: GraphQLSchema,
  document: DocumentNode,
  rootValue?: any,
  contextValue?: any,
  variableValues?: {
   [key: string]: any;
  },
  operationName?: string,
  fieldResolver?: GraphQLFieldResolver<any, any>,
  subscribeFieldResolver?: GraphQLFieldResolver<any, any>,
 ) {
  return subscribe({
   schema: this.config.graphqlOptions.schema,
   document,
   rootValue,
   contextValue,
   variableValues,
   operationName,
   fieldResolver,
   subscribeFieldResolver,
  });
 }
}
